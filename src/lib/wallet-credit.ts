import { walletStatus, type WalletCode } from "./referral-wallet";

export function earliestWalletCode(rows: WalletCode[], now = Date.now()) {
  return rows.filter((row) => row.amount_cents === 500 && walletStatus(row, now) === "active")
    .sort((a, b) => Date.parse(a.expires_at) - Date.parse(b.expires_at) || a.id.localeCompare(b.id))[0] ?? null;
}

export function buildCreditLink(base: string, code: string, email?: string | null) {
  const url = new URL(base);
  // set replaces all existing occurrences, never stacking the running offer.
  url.searchParams.set("prefilled_promo_code", code);
  if (email) url.searchParams.set("prefilled_email", email.trim().toLowerCase());
  return url.toString();
}

export type StripeWalletTruth = { active: boolean; times_redeemed: number; expires_at: number | null };
export function applyStripeWalletTruth<T extends { redeemed_at: string | null; cancelled_at: string | null; expires_at: string }>(row: T, truth: StripeWalletTruth, now = Date.now()): T {
  const expires = truth.expires_at === null ? row.expires_at : new Date(truth.expires_at * 1000).toISOString();
  return { ...row, expires_at: expires,
    redeemed_at: truth.times_redeemed > 0 ? row.redeemed_at || new Date(now).toISOString() : row.redeemed_at,
    cancelled_at: !truth.active && truth.times_redeemed === 0 && Date.parse(expires) > now
      ? row.cancelled_at || new Date(now).toISOString() : row.cancelled_at,
  };
}