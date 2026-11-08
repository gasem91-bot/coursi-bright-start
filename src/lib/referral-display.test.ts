import { test } from "node:test";
import assert from "node:assert/strict";
import { activeRewardCount } from "./referral-display";
import type { WalletCode } from "./referral-wallet";

const now = Date.parse("2026-11-08T18:41:00Z");
const reward: WalletCode = {
  id: "reward", vertical: "ai", code: "TEST", kind: "reward", amount_cents: 500,
  issued_at: "2026-11-01T00:00:00Z", expires_at: "2027-01-30T00:00:00Z",
  redeemed_at: null, cancelled_at: null, person: "fixture",
};

test("discount statistic counts one currently active reward", () => {
  assert.equal(activeRewardCount([reward], now), 1);
});

test("refund voiding drops the reward statistic from one to zero", () => {
  assert.equal(activeRewardCount([reward], now), 1);
  assert.equal(activeRewardCount([{ ...reward, cancelled_at: "2026-11-08T18:40:00Z" }], now), 0);
});

test("pending invitations with only a friend code count as zero reward discounts", () => {
  assert.equal(activeRewardCount([{ ...reward, kind: "friend" }], now), 0);
  assert.equal(activeRewardCount([], now), 0);
});

test("used and expired rewards are not currently valid discounts", () => {
  assert.equal(activeRewardCount([
    { ...reward, redeemed_at: "2026-11-07T00:00:00Z" },
    { ...reward, expires_at: new Date(now).toISOString() },
  ], now), 0);
});