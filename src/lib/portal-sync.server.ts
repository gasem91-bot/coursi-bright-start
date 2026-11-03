// Database wiring and outbound delivery for cross-portal sync.
// Never logs the secret, signatures or payload contents.
import {
  OUTBOX_MAX_ATTEMPTS, OUTBOX_BASE_DELAY_MS, PEER_BASE_URL, PEER_SYNC_PATH, THIS_PORTAL,
  normalizeEmail, outboxBackoffMs, signSync, type SyncDeps,
} from "./portal-sync";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;

async function loadAdmin(): Promise<Admin> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export function makeSyncDeps(admin: Admin): SyncDeps {
  return {
    async recordEvent(e) {
      const { error } = await admin.from("sync_events").insert(e);
      if (!error) return true;
      if (error.code === "23505") return false;
      throw new Error("sync_events insert failed");
    },
    async forgetEvent(id) {
      await admin.from("sync_events").delete().eq("event_id", id);
    },
    async findUserByEmail(email) {
      const target = normalizeEmail(email);
      const { data } = await admin.from("profiles").select("id,email,display_name").ilike("email", target).limit(20);
      const hit = (data ?? []).find((p: { email: string | null }) => (p.email ?? "").trim().toLowerCase() === target);
      return hit ? { id: hit.id, display_name: hit.display_name ?? null } : null;
    },
    async createUser(email) {
      // No password, no session: the person signs in with a magic link or password reset.
      const { data, error } = await admin.auth.admin.createUser({
        email, email_confirm: true, user_metadata: { segment: "ai", synced_from: "trading" },
      });
      if (error || !data?.user?.id) throw new Error("create user failed");
      const id = data.user.id as string;
      // The signup trigger adds a free active Course row; a synced account owns nothing here.
      await admin.from("subscriptions")
        .update({ status: "inactive", cancelled_at: new Date().toISOString() })
        .eq("user_id", id).eq("status", "active").is("stripe_session_id", null);
      return id;
    },
    async setDisplayName(userId, name) {
      await admin.from("profiles").update({ display_name: name }).eq("id", userId)
        .or("display_name.is.null,display_name.eq.");
    },
    async getSummary(userId) {
      const [prof, subs, prog, certs, refs, codes] = await Promise.all([
        admin.from("profiles").select("level").eq("id", userId).maybeSingle(),
        admin.from("subscriptions").select("tier").eq("user_id", userId).eq("status", "active"),
        admin.from("course_progress").select("chapter_id").eq("user_id", userId).eq("completed", true),
        admin.from("certificates").select("id", { count: "exact", head: true }).eq("user_id", userId),
        admin.from("referrals").select("referred_user_id,referred_email,status,created_at,signed_up_at,purchased_at,reward_issued_at").eq("referrer_user_id", userId),
        admin.from("referral_wallet_codes").select("code,kind,amount_cents,issued_at,expires_at,redeemed_at,cancelled_at,vertical").eq("user_id", userId),
      ]);
      const order = ["beginner", "intermediate", "advanced"];
      const tiers = [...new Set((subs.data ?? []).map((s: { tier: string }) => s.tier))];
      const level = prof.data?.level as string | undefined;
      const owned = tiers.length && level ? order.slice(0, order.indexOf(level) + 1) : [];
      const perLevel: Record<string, number> = {};
      for (const r of prog.data ?? []) {
        const lvl = String(r.chapter_id).split("-")[1] ?? "unknown";
        perLevel[lvl] = (perLevel[lvl] ?? 0) + 1;
      }
      const friendIds = (refs.data ?? []).map((r: { referred_user_id: string | null }) => r.referred_user_id).filter(Boolean);
      const names = new Map<string, string>();
      if (friendIds.length) {
        const { data } = await admin.from("profiles").select("id,display_name,full_name").in("id", friendIds);
        for (const p of data ?? []) names.set(p.id, p.display_name || p.full_name || "");
      }
      const now = Date.now();
      return {
        current_level: level ?? null,
        owned_levels: owned,
        tiers,
        bot_access: tiers.includes("course_ai"),
        progress: { completed_chapters_by_level: perLevel, certificates: certs.count ?? 0 },
        friends: (refs.data ?? []).map((r: Record<string, string | null>) => ({
          friend: (r.referred_user_id && names.get(r.referred_user_id)) || r.referred_email,
          status: r.status, invited_at: r.created_at, signed_up_at: r.signed_up_at,
          purchased_at: r.purchased_at, rewarded_at: r.reward_issued_at,
        })),
        wallet_codes: (codes.data ?? []).map((c: Record<string, string | number | null>) => ({
          code: c.code, source: c.kind, amount_cents: c.amount_cents, vertical: c.vertical,
          status: c.cancelled_at ? "cancelled" : c.redeemed_at ? "used"
            : c.expires_at && Date.parse(String(c.expires_at)) < now ? "expired" : "active",
          issued_at: c.issued_at, expires_at: c.expires_at,
        })),
      };
    },
    async upsertReferralMirror(row) {
      const { error } = await admin.from("referral_mirror").upsert(row, { onConflict: "key" });
      if (error) throw new Error("referral mirror failed");
    },
    async upsertCodeMirror(rows) {
      const { error } = await admin.from("wallet_code_mirror").upsert(rows, { onConflict: "code" });
      if (error) throw new Error("code mirror failed");
    },
  };
}

export async function runSyncRequest(request: Request) {
  const { handleSyncRequest } = await import("./portal-sync");
  const admin = await loadAdmin();
  return handleSyncRequest({
    secret: process.env["PORTAL_SYNC_SECRET"] || undefined,
    timestamp: request.headers.get("x-sync-timestamp"),
    signature: request.headers.get("x-sync-signature"),
    rawBody: await request.text(),
    nowMs: Date.now(),
  }, makeSyncDeps(admin));
}

/** Queue an event for the peer. Never throws: sync must never block the user. */
export async function enqueueSyncEvent(type: "upsert_user" | "referral_event", payload: Record<string, unknown>) {
  try {
    const admin = await loadAdmin();
    await admin.from("sync_outbox").insert({ type, payload });
  } catch {
    // swallowed on purpose
  }
}

type OutboxRow = { id: string; event_id: string; type: string; payload: unknown; attempts: number };

/** Next state for an outbox row after a delivery attempt. Exported for tests. */
export function nextOutboxState(row: { attempts: number }, outcome: "sent" | "no_secret" | "failed", nowMs: number) {
  if (outcome === "sent") return { status: "sent", attempts: row.attempts + 1 };
  // Missing secret is not the peer's fault: keep the row pending without burning attempts.
  if (outcome === "no_secret") return { status: "pending", attempts: row.attempts, next_attempt_at: new Date(nowMs + OUTBOX_BASE_DELAY_MS).toISOString(), last_error: "secret_missing" };
  const attempts = row.attempts + 1;
  if (attempts >= OUTBOX_MAX_ATTEMPTS) return { status: "failed", attempts, last_error: "delivery_failed" };
  return { status: "pending", attempts, next_attempt_at: new Date(nowMs + outboxBackoffMs(attempts)).toISOString(), last_error: "delivery_failed" };
}

export async function processOutbox(limit = 25) {
  const admin = await loadAdmin();
  const secret = process.env["PORTAL_SYNC_SECRET"] || undefined;
  const { data } = await admin.from("sync_outbox").select("id,event_id,type,payload,attempts")
    .eq("status", "pending").lte("next_attempt_at", new Date().toISOString())
    .order("next_attempt_at").limit(limit);
  let sent = 0, pending = 0, failed = 0;
  for (const row of (data ?? []) as OutboxRow[]) {
    let outcome: "sent" | "no_secret" | "failed" = "no_secret";
    if (secret) {
      try {
        const body = JSON.stringify({ event_id: row.event_id, type: row.type, origin_portal: THIS_PORTAL, payload: row.payload });
        const ts = String(Math.floor(Date.now() / 1000));
        const res = await fetch(PEER_BASE_URL + PEER_SYNC_PATH, {
          method: "POST",
          headers: { "content-type": "application/json", "x-sync-timestamp": ts, "x-sync-signature": await signSync(secret, ts, body) },
          body,
          signal: AbortSignal.timeout(10_000),
        });
        outcome = res.ok ? "sent" : "failed";
      } catch {
        outcome = "failed";
      }
    }
    const next = nextOutboxState(row, outcome, Date.now());
    await admin.from("sync_outbox").update({ ...next, updated_at: new Date().toISOString() }).eq("id", row.id);
    if (next.status === "sent") sent++; else if (next.status === "failed") failed++; else pending++;
  }
  // Stop the 5-minute timer once nothing is waiting; the next queued event re-arms it.
  await admin.rpc("disarm_portal_sync_outbox_if_idle").then(() => {}, () => {});
  return { processed: (data ?? []).length, sent, pending, failed };
}
