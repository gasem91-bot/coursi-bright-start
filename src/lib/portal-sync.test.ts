import { describe, expect, it } from "vitest";
import { handleSyncRequest, signSync, verifySync, type SyncDeps } from "./portal-sync";
import { nextOutboxState } from "./portal-sync.server";

const SECRET = "test-only-secret";
const NOW = 1_800_000_000_000;
const ts = String(NOW / 1000);

function fakeDeps() {
  const events = new Set<string>();
  const users = new Map<string, { id: string; display_name: string | null }>();
  const writes: string[] = [];
  const deps: SyncDeps = {
    async recordEvent(e) { if (events.has(e.event_id)) return false; events.add(e.event_id); writes.push("event"); return true; },
    async forgetEvent(id) { events.delete(id); },
    async findUserByEmail(email) { return users.get(email) ?? null; },
    async createUser(email) { const id = `u${users.size + 1}`; users.set(email, { id, display_name: null }); writes.push("create"); return id; },
    async setDisplayName(id, name) { for (const u of users.values()) if (u.id === id && !u.display_name) u.display_name = name; writes.push("name"); },
    async getSummary() { return {}; },
    async upsertReferralMirror() { writes.push("ref"); },
    async upsertCodeMirror() { writes.push("code"); },
  };
  return { deps, users, writes };
}

async function send(deps: SyncDeps, body: object, opts: { secret?: string; t?: string; sig?: string } = {}) {
  const raw = JSON.stringify(body);
  const t = opts.t ?? ts;
  const sig = opts.sig ?? (await signSync(SECRET, t, raw));
  return handleSyncRequest({ secret: "secret" in opts ? opts.secret : SECRET, timestamp: t, signature: sig, rawBody: raw, nowMs: NOW }, deps);
}

const upsert = (id: string, extra: object = {}) => ({
  event_id: id, type: "upsert_user", origin_portal: "trading",
  payload: { email: " Sara@Example.com ", display_name: "Sara", origin_portal: "trading", email_verified: true, ...extra },
});

describe("portal sync signatures", () => {
  it("accepts a valid signature and rejects a tampered body", async () => {
    const sig = await signSync(SECRET, ts, "{}");
    expect(await verifySync(SECRET, ts, sig, "{}", NOW)).toBe(true);
    expect(await verifySync(SECRET, ts, sig, "{ }", NOW)).toBe(false);
  });
  it("rejects timestamps older than 5 minutes", async () => {
    const old = String(NOW / 1000 - 301);
    expect(await verifySync(SECRET, old, await signSync(SECRET, old, "{}"), "{}", NOW)).toBe(false);
  });
  it("fails closed with no data written when the secret is missing", async () => {
    const { deps, writes } = fakeDeps();
    const r = await send(deps, upsert("evt-00001"), { secret: undefined });
    expect(r.status).toBe(401);
    expect(writes).toEqual([]);
  });
  it("rejects a wrong signature with no data written", async () => {
    const { deps, writes } = fakeDeps();
    expect((await send(deps, upsert("evt-00002"), { sig: "00".repeat(32) })).status).toBe(401);
    expect(writes).toEqual([]);
  });
  it("rejects events claiming to come from this portal (no loops)", async () => {
    const { deps, writes } = fakeDeps();
    expect((await send(deps, { ...upsert("evt-00003"), origin_portal: "ai" })).status).toBe(401);
    expect(writes).toEqual([]);
  });
});

describe("portal sync operations", () => {
  it("rejects a replayed event id", async () => {
    const { deps } = fakeDeps();
    expect((await send(deps, upsert("evt-10001"))).status).toBe(200);
    expect((await send(deps, upsert("evt-10001"))).status).toBe(401);
  });
  it("upsert is idempotent by verified email", async () => {
    const { deps, users } = fakeDeps();
    expect((await send(deps, upsert("evt-20001"))).body).toEqual({ ok: true, created: true });
    expect((await send(deps, upsert("evt-20002"))).body).toEqual({ ok: true, created: false });
    expect(users.size).toBe(1);
    expect(users.has("sara@example.com")).toBe(true);
  });
  it("never overwrites an existing display name", async () => {
    const { deps, users } = fakeDeps();
    users.set("sara@example.com", { id: "u9", display_name: "Original" });
    await send(deps, upsert("evt-30001", { display_name: "Changed" }));
    expect(users.get("sara@example.com")?.display_name).toBe("Original");
  });
  it("does not create an account for an unverified email", async () => {
    const { deps, users } = fakeDeps();
    const r = await send(deps, upsert("evt-40001", { email_verified: false }));
    expect(r.body.ok).toBe(false);
    expect(users.size).toBe(0);
  });
  it("reports unregistered emails in get_summary", async () => {
    const { deps } = fakeDeps();
    const r = await send(deps, { event_id: "evt-50001", type: "get_summary", origin_portal: "trading", payload: { email: "x@y.com" } });
    expect(r.body).toEqual({ registered: false });
  });
});

describe("outbox retries", () => {
  it("keeps retrying without burning attempts while the secret is missing", () => {
    expect(nextOutboxState({ attempts: 0 }, "no_secret", NOW)).toMatchObject({ status: "pending", attempts: 0 });
  });
  it("gives up after the first try plus 3 retries", () => {
    expect(nextOutboxState({ attempts: 2 }, "failed", NOW).status).toBe("pending");
    expect(nextOutboxState({ attempts: 3 }, "failed", NOW).status).toBe("failed");
  });
});
