import { test } from "node:test";
import assert from "node:assert/strict";
import { synchronizeWalletRows, walletPromotion } from "./wallet-stripe.server";
import { availableCredit, type WalletCode } from "./referral-wallet";

test("Stripe-used code persists redemption to ledger and wallet and leaves available balance", async () => {
  const writes: { table: string; value: Record<string, unknown> }[] = [];
  const admin = { from: (table: string) => ({ update: (value: Record<string, unknown>) => {
    writes.push({ table, value });
    const chain = { eq: () => chain, then: (resolve: (r: { error: null }) => void) => resolve({ error: null }) };
    return chain;
  } }) };
  const stripe = { promotionCodes: { list: async () => ({ data: [{ code: "UNIT_USED", active: false, times_redeemed: 1, expires_at: 1800000000 }] }) } };
  const row = { id: "wallet", referral_id: "ref", user_id: "owner", vertical: "ai", kind: "reward", code: "UNIT_USED", amount_cents: 500, issued_at: "2026-11-01", expires_at: "2027-01-01", redeemed_at: null, cancelled_at: null };
  const result = await synchronizeWalletRows(admin as unknown as Parameters<typeof synchronizeWalletRows>[0], stripe as unknown as Parameters<typeof synchronizeWalletRows>[1], [row], true);
  assert.ok(result[0]?.redeemed_at);
  assert.ok(writes.find((w) => w.table === "referrals")?.value.reward_redeemed_at);
  assert.ok(writes.find((w) => w.table === "referral_wallet_codes")?.value.redeemed_at);
  assert.equal(availableCredit(result.map((r) => ({ ...r, kind: "reward", person: "fixture" })) as WalletCode[], "ai"), 0);
});

test("short Stripe cache avoids duplicate reads but forced event reads see redemption", async () => {
  let reads = 0;
  const stripe = { promotionCodes: { list: async () => { reads++; return { data: [{ code: "UNIT_CACHE", active: reads === 1, times_redeemed: reads === 1 ? 0 : 1, expires_at: 1800000000 }] }; } } };
  const client = stripe as unknown as Parameters<typeof walletPromotion>[0];
  assert.equal((await walletPromotion(client, "UNIT_CACHE")).times_redeemed, 0);
  assert.equal((await walletPromotion(client, "UNIT_CACHE")).times_redeemed, 0);
  assert.equal(reads, 1);
  assert.equal((await walletPromotion(client, "UNIT_CACHE", true)).times_redeemed, 1);
  assert.equal(reads, 2);
});