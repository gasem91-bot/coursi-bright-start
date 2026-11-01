import { test } from "node:test";
import assert from "node:assert/strict";
import { availableCredit, walletStatus, type WalletCode } from "./referral-wallet";
import { getVertical } from "./verticals";
import { processReferralRefund } from "./referral-backend.server";

const now = Date.parse("2026-11-01T07:36:00Z");
const code = (patch: Partial<WalletCode> = {}): WalletCode => ({ id: "fixture", vertical: "ai", code: "FIXTURE", kind: "friend", amount_cents: 500,
  issued_at: "2026-11-01T00:00:00Z", expires_at: "2027-01-30T00:00:00Z", redeemed_at: null, cancelled_at: null, person: "fixture", ...patch });
test("wallet sums each active $5 code, excluding used expired and cancelled credits", () => {
  assert.equal(availableCredit([code(), code({ id: "reward", kind: "reward" }), code({ redeemed_at: "2026-11-01T00:00:00Z" }), code({ expires_at: new Date(now).toISOString() }), code({ cancelled_at: "2026-11-01T00:00:00Z" })], "ai", now), 10);
});
test("each wallet state is distinct and a redeemed reward is never available after cancellation", () => {
  assert.equal(walletStatus(code(), now), "active");
  assert.equal(walletStatus(code({ redeemed_at: "2026-10-31" }), now), "used");
  assert.equal(walletStatus(code({ expires_at: new Date(now).toISOString() }), now), "expired");
  assert.equal(walletStatus(code({ cancelled_at: "2026-10-31" }), now), "cancelled");
  assert.equal(walletStatus(code({ redeemed_at: "2026-10-31", cancelled_at: "2026-10-31" }), now), "used");
});
test("credits are segmented by course and unlimited rewards remain separate", () => {
  const rows = Array.from({ length: 201 }, (_, i) => code({ id: String(i) }));
  rows.push(code({ vertical: "trading" }));
  assert.equal(availableCredit(rows, "ai", now), 1005);
  assert.equal(availableCredit(rows, "trading", now), 5);
});
test("unbranded portals fall back to the existing AI theme and logo", () => {
  for (const id of ["trading", "fitness"]) {
    assert.equal(getVertical(id).emailAccent, getVertical("ai").emailAccent);
    assert.equal(getVertical(id).logo, getVertical("ai").logo);
  }
});
test("refund voids the referral and deactivates only an unused reward, including retries", async () => {
  for (const used of [false, true]) {
    let status = "rewarded"; let active = true; let deactivations = 0;
    const admin = { from: () => ({
      select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: "ref", status, reward_promotion_id: "fixture", reward_redeemed_at: used ? "2026-11-01" : null }, error: null }) }) }) }),
      update: (value: { status: string }) => ({ eq: async () => { status = value.status; return { error: null }; } }),
    }) };
    const stripe = { checkout: { sessions: { list: async () => ({ data: [{ id: "first-purchase" }] }) } }, promotionCodes: {
      retrieve: async () => ({ active, times_redeemed: used ? 1 : 0 }),
      update: async () => { active = false; deactivations++; },
    } };
    await processReferralRefund(admin as unknown as Parameters<typeof processReferralRefund>[0], stripe as unknown as Parameters<typeof processReferralRefund>[1], { payment_intent: "fixture" } as Parameters<typeof processReferralRefund>[2]);
    await processReferralRefund(admin as unknown as Parameters<typeof processReferralRefund>[0], stripe as unknown as Parameters<typeof processReferralRefund>[1], { payment_intent: "fixture" } as Parameters<typeof processReferralRefund>[2]);
    assert.equal(status, "voided");
    assert.equal(deactivations, used ? 0 : 1);
  }
});