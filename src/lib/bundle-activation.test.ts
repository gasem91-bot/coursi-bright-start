import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  handleComplete, handleGrant, hashToken, higherLevel, planForTier,
  type ActivationRow, type CompleteDeps, type GrantDeps,
} from "./bundle-activation";
import { signSync } from "./portal-sync";

const SECRET = "test-only-secret";
const NOW = 1_800_000_000_000;
const TS = String(NOW / 1000);

type Stored = ActivationRow & { token_hash: string; expires_at: string; level: string | null };

function store(paidPlan: "course" | "course_ai" | null = null) {
  const rows: Stored[] = [];
  const links: string[] = [];
  const grant: GrantDeps = {
    async findByGrant(g) { return rows.find((r) => r.grant_id === g) ?? null; },
    async paidPlanFor() { return paidPlan; },
    async insert(r) {
      if (rows.some((x) => x.grant_id === r.grant_id)) return null;
      const row: Stored = { id: `a${rows.length + 1}`, status: "pending", used_at: null, last_email_at: null, level: null, ...r };
      rows.push(row); return row;
    },
    async rotateToken(id, h, e) { const r = rows.find((x) => x.id === id)!; r.token_hash = h; r.expires_at = e; },
    async sendEmail(_to, link) { links.push(link); return true; },
    async markEmailed(id, at) { rows.find((x) => x.id === id)!.last_email_at = at; },
  };
  const users = new Map<string, { id: string; level: string | null; plans: string[] }>();
  const complete: CompleteDeps = {
    async claim(h, nowIso) {
      const r = rows.find((x) => x.token_hash === h && !x.used_at && x.status === "pending" && x.expires_at > nowIso);
      if (!r) return null; r.used_at = nowIso; return r;
    },
    async release(id) { rows.find((x) => x.id === id)!.used_at = null; },
    async findUserId(e) { return users.get(e)?.id ?? null; },
    async createUser(e) { const id = `u${users.size + 1}`; users.set(e, { id, level: "beginner", plans: [] }); return id; },
    async getLevel(id) { return [...users.values()].find((u) => u.id === id)!.level; },
    async setLevel(id, l) { [...users.values()].find((u) => u.id === id)!.level = l; },
    async grantPlan(id, plan) { const u = [...users.values()].find((x) => x.id === id)!; if (!u.plans.includes(plan)) u.plans.push(plan); },
    async markActivated(id, level) { const r = rows.find((x) => x.id === id)!; r.status = "activated"; r.level = level; },
    async portalUrl() { return "https://ai.portal.coursi.ai/login"; },
  };
  return { rows, links, users, grant, complete };
}

async function call(deps: GrantDeps, body: object, o: { sig?: string; ts?: string; now?: number; secret?: string | null } = {}) {
  const raw = JSON.stringify(body);
  const ts = o.ts ?? TS;
  return handleGrant({
    secret: o.secret === null ? undefined : SECRET, timestamp: ts,
    signature: o.sig ?? (await signSync(SECRET, ts, raw)), rawBody: raw, nowMs: o.now ?? NOW,
  }, deps);
}
const g = (extra: object = {}) => ({ grant_id: "tr-1", email: " Sara@Example.com ", tier: "tutors", ...extra });
const tokenOf = (link: string) => decodeURIComponent(new URL(link).searchParams.get("t")!);

describe("bundle activation grant", () => {
  it("rejects a bad signature, stale timestamp or missing secret with 401 and no row", async () => {
    const s = store();
    assert.equal((await call(s.grant, g(), { sig: "ab".repeat(32) })).status, 401);
    const old = String(NOW / 1000 - 301);
    assert.equal((await call(s.grant, g(), { ts: old })).status, 401);
    assert.equal((await call(s.grant, g(), { secret: null })).status, 401);
    assert.equal(s.rows.length, 0);
  });
  it("maps tutors to course_ai and courses to course", async () => {
    assert.equal(planForTier("tutors"), "course_ai");
    assert.equal(planForTier("courses"), "course");
    const s = store();
    await call(s.grant, g({ grant_id: "x1", tier: "courses" }));
    assert.equal(s.rows[0].plan, "course");
    assert.equal(s.rows[0].email, "sara@example.com");
  });
  it("is idempotent by grant_id and resends at most once per 10 minutes", async () => {
    const s = store();
    await call(s.grant, g());
    await call(s.grant, g(), { now: NOW + 60_000 });
    assert.equal(s.rows.length, 1);
    assert.equal(s.links.length, 1);
    await call(s.grant, g(), { now: NOW + 11 * 60_000, ts: String(NOW / 1000 + 660) });
    assert.equal(s.rows.length, 1);
    assert.equal(s.links.length, 2);
  });
  it("does nothing when the email already has equal or higher paid access", async () => {
    const s = store("course_ai");
    const r = await call(s.grant, g({ tier: "courses" }));
    assert.equal(r.body.status, "already_active");
    assert.equal(s.rows.length, 0);
  });
  it("stores only the token hash, never the raw token", async () => {
    const s = store();
    await call(s.grant, g());
    const raw = tokenOf(s.links[0]);
    assert.notEqual(s.rows[0].token_hash, raw);
    assert.equal(s.rows[0].token_hash, await hashToken(raw));
  });
});

describe("bundle activation complete", () => {
  it("token works once only", async () => {
    const s = store();
    await call(s.grant, g());
    const body = JSON.stringify({ token: tokenOf(s.links[0]), level: "intermediate" });
    assert.equal((await handleComplete(body, NOW, s.complete)).status, 200);
    assert.equal((await handleComplete(body, NOW, s.complete)).status, 400);
    assert.deepEqual(s.users.get("sara@example.com")?.plans, ["course_ai"]);
  });
  it("rejects an expired token", async () => {
    const s = store();
    await call(s.grant, g());
    const body = JSON.stringify({ token: tokenOf(s.links[0]), level: "beginner" });
    assert.equal((await handleComplete(body, NOW + 31 * 24 * 3600_000, s.complete)).status, 400);
    assert.equal(s.users.size, 0);
  });
  it("rejects a level outside the three values", async () => {
    const s = store();
    await call(s.grant, g());
    const body = JSON.stringify({ token: tokenOf(s.links[0]), level: "expert" });
    assert.equal((await handleComplete(body, NOW, s.complete)).status, 400);
    assert.equal(s.rows[0].used_at, null);
  });
  it("only raises the level, never lowers it", async () => {
    assert.equal(higherLevel("advanced", "beginner"), "advanced");
    assert.equal(higherLevel("beginner", "intermediate"), "intermediate");
    assert.equal(higherLevel(null, "beginner"), "beginner");
    const s = store();
    s.users.set("sara@example.com", { id: "u9", level: "advanced", plans: [] });
    await call(s.grant, g());
    await handleComplete(JSON.stringify({ token: tokenOf(s.links[0]), level: "beginner" }), NOW, s.complete);
    assert.equal(s.users.get("sara@example.com")?.level, "advanced");
  });
});
