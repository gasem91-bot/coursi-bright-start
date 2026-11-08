import { walletStatus, type WalletCode } from "./referral-wallet";

/** Display-only count using the already Stripe-reconciled wallet, not issued-code history. */
export function activeRewardCount(rows: WalletCode[], now = Date.now()): number {
  return rows.filter((row) => row.kind === "reward" && walletStatus(row, now) === "active").length;
}