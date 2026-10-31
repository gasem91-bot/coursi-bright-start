export const REFERRAL_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const REFERRAL_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{8}$/;
export const REFERRAL_DISCOUNT_CENTS = 500;
export const REFERRAL_CODE_DAYS = 90;
export const REFERRAL_CAPTURE_DAYS = 30;
export const REFERRAL_STORAGE_KEY = "coursi-referral";
export const REFERRAL_COUPON_ID = "referral-discount-5";

export function expiresAfter(days: number, now: number): number {
  return now + days * 86400000;
}

export function chooseReferralCapture(
  existing: { code: string; expiresAt: number } | null,
  incoming: string | null,
  now: number,
): { code: string; expiresAt: number } | null {
  if (existing && REFERRAL_CODE_PATTERN.test(existing.code) && existing.expiresAt > now) return existing;
  const code = incoming?.trim().toUpperCase() ?? "";
  return REFERRAL_CODE_PATTERN.test(code)
    ? { code, expiresAt: expiresAfter(REFERRAL_CAPTURE_DAYS, now) } : null;
}

export function isSuccessfulPaidCheckout(paymentStatus: string, amount: number, currency: string): boolean {
  return paymentStatus === "paid" && amount > 0 && currency.toLowerCase() === "usd";
}

export function canRewardReferral(status: string, firstSession: string, sessionId: string): boolean {
  return firstSession === sessionId && (status === "signed_up" || status === "invited" || status === "purchased");
}
// Existing Beginner AI course Stripe payment link (promotion codes enabled). No promo is ever prefilled.
export const REFERRAL_PURCHASE_BASE = "https://buy.stripe.com/9B69AT8of2UJ93ic1VeQM08";

export function referralPurchaseLink(referralCode: string, friendEmail: string): string {
  const url = new URL(REFERRAL_PURCHASE_BASE);
  url.searchParams.set("client_reference_id", referralCode);
  url.searchParams.set("prefilled_email", friendEmail.trim().toLowerCase());
  return url.toString();
}

export type InviteBlock = "self" | "has_account" | "already_invited" | null;
export function inviteBlockReason(friendEmail: string, ownEmail: string, hasAccount: boolean, alreadyInvited: boolean): InviteBlock {
  const e = friendEmail.trim().toLowerCase();
  if (e === ownEmail.trim().toLowerCase()) return "self";
  if (hasAccount) return "has_account";
  if (alreadyInvited) return "already_invited";
  return null;
}

export type RewardState = "active" | "used" | "expired";
export function rewardState(redeemedAt: string | null, expiresAt: string | null, now: number): RewardState {
  if (redeemedAt) return "used";
  if (expiresAt && new Date(expiresAt).getTime() <= now) return "expired";
  return "active";
}
