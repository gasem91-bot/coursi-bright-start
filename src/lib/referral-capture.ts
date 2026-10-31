import { chooseReferralCapture, REFERRAL_STORAGE_KEY } from "./referral-rules";

// Called after hydration or in an event handler only; never prefill checkout discounts.
export function captureReferral(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(REFERRAL_STORAGE_KEY);
    let existing = null;
    try { existing = raw ? JSON.parse(raw) : null; } catch { /* discard malformed storage */ }
    const capture = chooseReferralCapture(existing, new URLSearchParams(window.location.search).get("ref"), Date.now());
    if (capture) localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(capture));
    else localStorage.removeItem(REFERRAL_STORAGE_KEY);
    return capture?.code ?? null;
  } catch { return null; }
}