// Cross-portal account sync: pure signing, verification and request handling.
// Database access is injected (see portal-sync.server.ts) so it can be tested.
import { z } from "zod";

export const THIS_PORTAL = "ai";
export const PEER_PORTAL = "trading";
export const PEER_BASE_URL = "https://trading.portal.coursi.ai";
export const PEER_SYNC_PATH = "/api/public/portal-sync";
export const SYNC_WINDOW_SECONDS = 5 * 60;
export const OUTBOX_MAX_ATTEMPTS = 4; // first try + 3 retries
export const OUTBOX_BASE_DELAY_MS = 5 * 60 * 1000;

const enc = new TextEncoder();

function toHex(buf: ArrayBuffer) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Hex HMAC-SHA256 over `${timestamp}.${rawBody}`. */
export async function signSync(secret: string, timestamp: string, rawBody: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, enc.encode(`${timestamp}.${rawBody}`)));
}

/** Constant-time comparison of two strings (length leak avoided by full scan). */
export function safeEqual(a: string, b: string) {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export async function verifySync(
  secret: string | undefined,
  timestamp: string | null,
  signature: string | null,
  rawBody: string,
  nowMs: number,
) {
  if (!secret || !timestamp || !signature) return false;
  if (!/^\d{9,12}$/.test(timestamp)) return false;
  if (Math.abs(nowMs / 1000 - Number(timestamp)) > SYNC_WINDOW_SECONDS) return false;
  return safeEqual(await signSync(secret, timestamp, rawBody), signature.toLowerCase());
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function outboxBackoffMs(attempts: number) {
  return OUTBOX_BASE_DELAY_MS * 2 ** Math.max(0, attempts - 1);
}

const email = z.string().trim().email().max(320).transform(normalizeEmail);
const date = z.string().datetime({ offset: true }).nullable().optional();

export const upsertUserPayload = z.object({
  email,
  display_name: z.string().trim().max(120).nullable().optional(),
  origin_portal: z.string().max(32),
  email_verified: z.boolean(),
});
export const summaryPayload = z.object({ email });
export const referralEventPayload = z.object({
  key: z.string().min(1).max(200),
  referrer_email: email,
  friend_email: email.nullable().optional(),
  friend_name: z.string().trim().max(120).nullable().optional(),
  status: z.enum(["invited", "signed_up", "purchased", "rewarded", "voided"]),
  vertical: z.string().max(32).default(PEER_PORTAL),
  dates: z.object({ invited_at: date, signed_up_at: date, purchased_at: date, rewarded_at: date }).partial().default({}),
  codes: z.array(z.object({
    code: z.string().min(3).max(64),
    owner_email: email,
    kind: z.enum(["friend", "reward"]),
    amount_cents: z.number().int().min(0).max(100000).default(500),
    status: z.enum(["active", "used", "expired", "cancelled"]),
    issued_at: date,
    expires_at: date,
  })).max(10).default([]),
});

export const envelopeSchema = z.object({
  event_id: z.string().min(8).max(100),
  type: z.enum(["upsert_user", "get_summary", "referral_event"]),
  origin_portal: z.string().max(32),
  payload: z.unknown(),
});
export type SyncEnvelope = z.infer<typeof envelopeSchema>;

export type SyncDeps = {
  /** Insert into sync_events; false when event_id was already seen. */
  recordEvent(e: { event_id: string; origin_portal: string; type: string }): Promise<boolean>;
  forgetEvent(eventId: string): Promise<void>;
  findUserByEmail(email: string): Promise<{ id: string; display_name: string | null } | null>;
  createUser(email: string): Promise<string>;
  setDisplayName(userId: string, name: string): Promise<void>;
  getSummary(userId: string): Promise<Record<string, unknown>>;
  upsertReferralMirror(row: Record<string, unknown>): Promise<void>;
  upsertCodeMirror(rows: Record<string, unknown>[]): Promise<void>;
};

export type SyncResult = { status: number; body: Record<string, unknown> };
const UNAUTHORIZED: SyncResult = { status: 401, body: { error: "unauthorized" } };

export async function handleSyncRequest(
  input: { secret: string | undefined; timestamp: string | null; signature: string | null; rawBody: string; nowMs: number },
  deps: SyncDeps,
): Promise<SyncResult> {
  // Fail closed: no secret, bad signature, stale time, bad shape, own origin or replay → 401, nothing written.
  if (!(await verifySync(input.secret, input.timestamp, input.signature, input.rawBody, input.nowMs))) return UNAUTHORIZED;
  let env: SyncEnvelope;
  try {
    env = envelopeSchema.parse(JSON.parse(input.rawBody));
  } catch {
    return UNAUTHORIZED;
  }
  if (env.origin_portal !== PEER_PORTAL) return UNAUTHORIZED;
  if (!(await deps.recordEvent({ event_id: env.event_id, origin_portal: env.origin_portal, type: env.type }))) return UNAUTHORIZED;

  try {
    return await dispatch(env, deps);
  } catch (err) {
    // Let the sender retry the same event id.
    await deps.forgetEvent(env.event_id).catch(() => {});
    if (err instanceof z.ZodError) return { status: 400, body: { error: "invalid_payload" } };
    return { status: 500, body: { error: "sync_failed" } };
  }
}

async function dispatch(env: SyncEnvelope, deps: SyncDeps): Promise<SyncResult> {
  if (env.type === "upsert_user") {
    const p = upsertUserPayload.parse(env.payload);
    if (!p.email_verified) return { status: 200, body: { ok: false, reason: "email_not_verified" } };
    const existing = await deps.findUserByEmail(p.email);
    if (existing) {
      // Never overwrite existing fields; only fill an empty display name.
      if (!existing.display_name?.trim() && p.display_name) await deps.setDisplayName(existing.id, p.display_name);
      return { status: 200, body: { ok: true, created: false } };
    }
    const id = await deps.createUser(p.email);
    if (p.display_name) await deps.setDisplayName(id, p.display_name);
    return { status: 200, body: { ok: true, created: true } };
  }

  if (env.type === "get_summary") {
    const p = summaryPayload.parse(env.payload);
    const user = await deps.findUserByEmail(p.email);
    if (!user) return { status: 200, body: { registered: false } };
    return { status: 200, body: { registered: true, display_name: user.display_name, ...(await deps.getSummary(user.id)) } };
  }

  const p = referralEventPayload.parse(env.payload);
  const owner = await deps.findUserByEmail(p.referrer_email);
  await deps.upsertReferralMirror({
    key: p.key,
    owner_user_id: owner?.id ?? null,
    referrer_email: p.referrer_email,
    friend_email: p.friend_email ?? null,
    friend_name: p.friend_name ?? null,
    status: p.status,
    vertical: p.vertical,
    invited_at: p.dates.invited_at ?? null,
    signed_up_at: p.dates.signed_up_at ?? null,
    purchased_at: p.dates.purchased_at ?? null,
    rewarded_at: p.dates.rewarded_at ?? null,
    origin_portal: env.origin_portal,
    updated_at: new Date().toISOString(),
  });
  if (p.codes.length) {
    const rows = [];
    for (const c of p.codes) {
      const o = c.owner_email === p.referrer_email ? owner : await deps.findUserByEmail(c.owner_email);
      rows.push({
        code: c.code, owner_user_id: o?.id ?? null, owner_email: c.owner_email, referral_key: p.key,
        kind: c.kind, amount_cents: c.amount_cents, status: c.status, vertical: p.vertical,
        issued_at: c.issued_at ?? null, expires_at: c.expires_at ?? null,
        origin_portal: env.origin_portal, updated_at: new Date().toISOString(),
      });
    }
    await deps.upsertCodeMirror(rows);
  }
  return { status: 200, body: { ok: true } };
}
