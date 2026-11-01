import { test } from "node:test";
import assert from "node:assert/strict";
import { applyStripeWalletTruth, buildCreditLink, earliestWalletCode } from "./wallet-credit";
import { availableCredit, type WalletCode } from "./referral-wallet";

const now = Date.parse("2026-11-01T08:04:00Z");
const row = (patch: Partial<WalletCode> = {}): WalletCode => ({ id: "one", vertical: "ai", code: "OWN5", kind: "friend", amount_cents: 500, issued_at: "2026-10-31T00:00:00Z", expires_at: "2026-12-01T00:00:00Z", redeemed_at: null, cancelled_at: null, person: "fixture", ...patch });
test("credit replaces running promo with exactly one own code, preserving email and referral reference", () => {
  const url = new URL(buildCreditLink("https://buy.stripe.com/example?prefilled_promo_code=LTO5B&prefilled_promo_code=LTO10B&prefilled_email=friend%40example.com&client_reference_id=ABCDEFGH", "OWN5"));
  assert.deepEqual(url.searchParams.getAll("prefilled_promo_code"), ["OWN5"]);
  assert.equal(url.searchParams.get("prefilled_email"), "friend@example.com");
  assert.equal(url.searchParams.get("client_reference_id"), "ABCDEFGH");
  assert.equal(url.pathname, "/example");
});
test("credit adds normalized buyer email without changing the payment link", () => {
  const url = new URL(buildCreditLink("https://buy.stripe.com/example", "OWN5", " BUYER@EXAMPLE.COM "));
  assert.equal(url.searchParams.get("prefilled_email"), "buyer@example.com");
  assert.equal(url.searchParams.get("prefilled_promo_code"), "OWN5");
  assert.equal(url.origin + url.pathname, "https://buy.stripe.com/example");
});
test("choose earliest-expiring active unused unexpired $5 code", () => {
  assert.equal(earliestWalletCode([row(), row({ id: "early", expires_at: "2026-11-02T00:00:00Z" }), row({ id: "used", redeemed_at: "2026-11-01" }), row({ id: "expired", expires_at: "2026-10-31" }), row({ id: "cancelled", cancelled_at: "2026-11-01" })], now)?.id, "early");
  assert.equal(earliestWalletCode([row({ redeemed_at: "2026-11-01" })], now), null);
});
test("Stripe redemption anywhere removes $5 from balance and active choices", () => {
  const original = row();
  assert.equal(availableCredit([original], "ai", now), 5);
  const used = applyStripeWalletTruth(original, { active: false, times_redeemed: 1, expires_at: Date.parse(original.expires_at) / 1000 }, now);
  assert.equal(availableCredit([used], "ai", now), 0);
  assert.equal(earliestWalletCode([used], now), null);
  assert.equal(used.redeemed_at, new Date(now).toISOString());
});
test("Stripe disablement and Stripe expiry cannot remain spendable", () => {
  const disabled = applyStripeWalletTruth(row(), { active: false, times_redeemed: 0, expires_at: Date.parse(row().expires_at) / 1000 }, now);
  const expired = applyStripeWalletTruth(row(), { active: false, times_redeemed: 0, expires_at: (now - 1000) / 1000 }, now);
  assert.equal(availableCredit([disabled, expired], "ai", now), 0);
});