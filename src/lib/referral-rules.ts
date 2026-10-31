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