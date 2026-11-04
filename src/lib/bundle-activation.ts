// Trading-bundle → AI course activation: pure rules and request handling.
// Database, auth and email are injected (bundle-activation.server.ts) for tests.
import { z } from "zod";
import { normalizeEmail, verifySync } from "./portal-sync";

export const ACTIVATION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const RESEND_COOLDOWN_MS = 10 * 60 * 1000;
export const ACTIVATE_PAGE_URL = "https://coursi.ai/bundle/activate";
export const ALLOWED_ORIGINS = ["https://coursi.ai", "https://www.coursi.ai"];
export const BUNDLE_TAG = "bundle:trading";

export type Plan = "course" | "course_ai";
export type Level = "beginner" | "intermediate" | "advanced";
const PLAN_RANK: Record<Plan, number> = { course: 1, course_ai: 2 };
const LEVELS: Level[] = ["beginner", "intermediate", "advanced"];

export function planForTier(tier: "courses" | "tutors"): Plan {
  return tier === "tutors" ? "course_ai" : "course";
}
export function planCovers(have: Plan | null, want: Plan) {
  return !!have && PLAN_RANK[have] >= PLAN_RANK[want];
}
/** Levels are only ever raised, never lowered. */
export function higherLevel(current: string | null | undefined, chosen: Level): Level {
  const i = LEVELS.indexOf(current as Level);
  return i > LEVELS.indexOf(chosen) ? (current as Level) : chosen;
}
export function activationLink(rawToken: string) {
  return `${ACTIVATE_PAGE_URL}?t=${encodeURIComponent(rawToken)}`;
}
export function subscriptionTag(grantId: string) {
  return `${BUNDLE_TAG}:${grantId}`;
}

export function newRawToken() {
  const b = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export async function hashToken(raw: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export const grantBody = z.object({
  grant_id: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320).transform(normalizeEmail),
  tier: z.enum(["courses", "tutors"]),
});
export const completeBody = z.object({
  token: z.string().min(20).max(200),
  level: z.enum(["beginner", "intermediate", "advanced"]),
});

export type ActivationRow = {
  id: string; email: string; grant_id: string; plan: Plan; status: "pending" | "activated";
  used_at: string | null; last_email_at: string | null;
};

export type GrantDeps = {
  findByGrant(grantId: string): Promise<ActivationRow | null>;
  /** Highest plan from real (non-free) active subscriptions, or null. */
  paidPlanFor(email: string): Promise<Plan | null>;
  /** Returns null when another call created the same grant first. */
  insert(row: { email: string; grant_id: string; plan: Plan; token_hash: string; expires_at: string }): Promise<ActivationRow | null>;
  rotateToken(id: string, tokenHash: string, expiresAt: string): Promise<void>;
  sendEmail(to: string, link: string): Promise<boolean>;
  markEmailed(id: string, at: string): Promise<void>;
};

export type Result = { status: number; body: Record<string, unknown> };
const UNAUTHORIZED: Result = { status: 401, body: { error: "unauthorized" } };

export async function handleGrant(
  input: { secret: string | undefined; timestamp: string | null; signature: string | null; rawBody: string; nowMs: number },
  deps: GrantDeps,
): Promise<Result> {
  if (!(await verifySync(input.secret, input.timestamp, input.signature, input.rawBody, input.nowMs))) return UNAUTHORIZED;
  let body: z.infer<typeof grantBody>;
  try {
    body = grantBody.parse(JSON.parse(input.rawBody));
  } catch {
    return UNAUTHORIZED;
  }
  const plan = planForTier(body.tier);
  const now = input.nowMs;
  const expires = new Date(now + ACTIVATION_TTL_MS).toISOString();

  const sendFresh = async (row: ActivationRow, rotate: boolean) => {
    const raw = newRawToken();
    if (rotate) await deps.rotateToken(row.id, await hashToken(raw), expires);
    return raw;
  };

  let row = await deps.findByGrant(body.grant_id);
  if (!row) {
    if (planCovers(await deps.paidPlanFor(body.email), plan)) return { status: 200, body: { ok: true, status: "already_active" } };
    const raw = newRawToken();
    row = await deps.insert({ email: body.email, grant_id: body.grant_id, plan, token_hash: await hashToken(raw), expires_at: expires });
    if (!row) return { status: 200, body: { ok: true, status: "pending", emailed: false } };
    const sent = await deps.sendEmail(row.email, activationLink(raw));
    if (sent) await deps.markEmailed(row.id, new Date(now).toISOString());
    return { status: 200, body: { ok: true, status: "pending", emailed: sent } };
  }

  // Repeat call: never a second row; resend at most once per 10 minutes.
  if (row.status === "activated" || row.used_at) return { status: 200, body: { ok: true, status: "activated" } };
  if (row.last_email_at && now - Date.parse(row.last_email_at) < RESEND_COOLDOWN_MS) {
    return { status: 200, body: { ok: true, status: "pending", emailed: false } };
  }
  // Only the hash is stored, so a resend issues a fresh token (the old link stops working).
  const raw = await sendFresh(row, true);
  const sent = await deps.sendEmail(row.email, activationLink(raw));
  if (sent) await deps.markEmailed(row.id, new Date(now).toISOString());
  return { status: 200, body: { ok: true, status: "pending", emailed: sent } };
}

export type CompleteDeps = {
  /** Atomically sets used_at when the token is unused and unexpired; null otherwise. */
  claim(tokenHash: string, nowIso: string): Promise<ActivationRow | null>;
  release(id: string): Promise<void>;
  findUserId(email: string): Promise<string | null>;
  createUser(email: string): Promise<string>;
  getLevel(userId: string): Promise<string | null>;
  setLevel(userId: string, level: Level): Promise<void>;
  grantPlan(userId: string, plan: Plan, grantId: string): Promise<void>;
  markActivated(id: string, level: Level): Promise<void>;
  portalUrl(email: string): Promise<string>;
};

export async function handleComplete(rawBody: string, nowMs: number, deps: CompleteDeps): Promise<Result> {
  let body: z.infer<typeof completeBody>;
  try {
    body = completeBody.parse(JSON.parse(rawBody));
  } catch {
    return { status: 400, body: { error: "invalid_request" } };
  }
  const row = await deps.claim(await hashToken(body.token), new Date(nowMs).toISOString());
  if (!row) return { status: 400, body: { error: "invalid_or_expired" } };
  try {
    const userId = (await deps.findUserId(row.email)) ?? (await deps.createUser(row.email));
    const current = await deps.getLevel(userId);
    const next = higherLevel(current, body.level);
    if (next !== current) await deps.setLevel(userId, next);
    await deps.grantPlan(userId, row.plan, row.grant_id);
    await deps.markActivated(row.id, next);
    return { status: 200, body: { portalUrl: await deps.portalUrl(row.email) } };
  } catch {
    await deps.release(row.id).catch(() => {});
    return { status: 500, body: { error: "activation_failed" } };
  }
}
