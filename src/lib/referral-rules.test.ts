import { test } from "node:test";
import assert from "node:assert/strict";
import { REFERRAL_ALPHABET, REFERRAL_CODE_PATTERN, REFERRAL_DISCOUNT_CENTS, REFERRAL_CODE_DAYS, REFERRAL_COUPON_ID, chooseReferralCapture, expiresAfter, isSuccessfulPaidCheckout, canRewardReferral } from "./referral-rules";
import { promotionCodeFor, ensurePromotion } from "./referral-backend.server";

test("referral discount is $5 using the supplied existing coupon", () => {
  assert.equal(REFERRAL_DISCOUNT_CENTS, 500);
  assert.equal(REFERRAL_COUPON_ID, "referral-discount-5");
});
test("friend and reward codes last 90 days from issue", () => {
  assert.equal(expiresAfter(REFERRAL_CODE_DAYS, 1000), 7776001000);
});
test("eight-character referral alphabet excludes ambiguous characters", () => {
  for (const char of ["I", "O", "0", "1"]) assert.equal(REFERRAL_ALPHABET.includes(char), false);
  assert.equal(REFERRAL_CODE_PATTERN.test("ABCDEFGH"), true);
  assert.equal(REFERRAL_CODE_PATTERN.test("ABCDEFG"), false);
  assert.equal(REFERRAL_CODE_PATTERN.test("ABCD0FGH"), false);
});
test("capture lasts 30 days and preserves the first unexpired code", () => {
  const capture = chooseReferralCapture(null, "ABCDEFGH", 1000);
  assert.deepEqual(capture, { code: "ABCDEFGH", expiresAt: 2592001000 });
  assert.deepEqual(chooseReferralCapture(capture, "JKLMNPQR", 2000), capture);
  assert.equal(chooseReferralCapture(capture, null, 2592001000), null);
});
test("expired capture can be replaced and invalid codes are ignored", () => {
  assert.deepEqual(chooseReferralCapture({ code: "ABCDEFGH", expiresAt: 1 }, "JKLMNPQR", 2), { code: "JKLMNPQR", expiresAt: 2592000002 });
  assert.equal(chooseReferralCapture(null, "bad", 1), null);
});
test("only successful positive paid USD purchases qualify", () => {
  assert.equal(isSuccessfulPaidCheckout("paid", 2500, "usd"), true);
  assert.equal(isSuccessfulPaidCheckout("unpaid", 2500, "usd"), false);
  assert.equal(isSuccessfulPaidCheckout("paid", 0, "usd"), false);
});
test("reward is first purchase only, never again or after void", () => {
  assert.equal(canRewardReferral("signed_up", "first", "first"), true);
  assert.equal(canRewardReferral("purchased", "first", "first"), true);
  assert.equal(canRewardReferral("signed_up", "first", "second"), false);
  assert.equal(canRewardReferral("rewarded", "first", "first"), false);
  assert.equal(canRewardReferral("voided", "first", "first"), false);
});
test("promotion issuance retries reuse codes with distinct friend/reward codes", () => {
  const id = "00000000-0000-4000-8000-000000000001";
  assert.equal(promotionCodeFor(id, "friend"), promotionCodeFor(id, "friend"));
  assert.notEqual(promotionCodeFor(id, "friend"), promotionCodeFor(id, "reward"));
  assert.notEqual(promotionCodeFor(id, "friend"), promotionCodeFor(id.replace(/1$/, "2"), "friend"));
});
test("Stripe friend and reward codes enforce single-use and 90-day expiry without prefill", async () => {
  const original = globalThis.fetch;
  const issued = "2026-10-31T09:00:00Z";
  const requests: URLSearchParams[] = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.includes("promotion_codes?")) return Response.json({ data: [] });
    if (url.includes("coupons/")) return Response.json({ valid: true, amount_off: 500, currency: "usd" });
    const params = new URLSearchParams(String(init?.body));
    requests.push(params);
    return Response.json({ id: "fixture", code: params.get("code"), expires_at: Number(params.get("expires_at")) });
  };
  try {
    for (const kind of ["friend", "reward"] as const) await ensurePromotion("fixture", "00000000-0000-4000-8000-000000000001", kind, issued);
    assert.equal(requests.length, 2);
    for (const params of requests) {
      assert.equal(params.get("coupon"), "referral-discount-5");
      assert.equal(params.get("max_redemptions"), "1");
      assert.equal(Number(params.get("expires_at")), Date.parse(issued) / 1000 + 90 * 86400);
      assert.equal(params.has("prefilled_promo_code"), false);
    }
  } finally { globalThis.fetch = original; }
});