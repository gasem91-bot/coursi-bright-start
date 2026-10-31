import { test } from "node:test";
import assert from "node:assert/strict";
import { inviteBlockReason, referralPurchaseLink, rewardState } from "./referral-rules";

test("invite purchase link carries referrer code and friend email, never a promo code", () => {
  const url = new URL(referralPurchaseLink("ABCDEFGH", " Friend@Mail.com "));
  assert.equal(url.searchParams.get("client_reference_id"), "ABCDEFGH");
  assert.equal(url.searchParams.get("prefilled_email"), "friend@mail.com");
  assert.equal(url.searchParams.get("prefilled_promo_code"), null);
  assert.equal(url.hostname, "buy.stripe.com");
});
test("cannot invite your own email", () => {
  assert.equal(inviteBlockReason("Me@x.com", "me@x.com", false, false), "self");
});
test("cannot invite an email that already has an account", () => {
  assert.equal(inviteBlockReason("a@x.com", "me@x.com", true, false), "has_account");
});
test("cannot invite an email someone already invited", () => {
  assert.equal(inviteBlockReason("a@x.com", "me@x.com", false, true), "already_invited");
});
test("a fresh email can be invited", () => {
  assert.equal(inviteBlockReason("a@x.com", "me@x.com", false, false), null);
});
test("reward codes show used, expired or active", () => {
  const now = Date.parse("2026-11-01T00:00:00Z");
  assert.equal(rewardState("2026-10-01T00:00:00Z", "2027-01-01T00:00:00Z", now), "used");
  assert.equal(rewardState(null, "2026-10-31T00:00:00Z", now), "expired");
  assert.equal(rewardState(null, "2027-01-01T00:00:00Z", now), "active");
});
