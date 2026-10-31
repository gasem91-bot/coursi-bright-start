export const BUNDLE_OFFERS = [
  { level: "beginner", label: "المبتدئ", coursesUrl: "https://buy.stripe.com/28E9ATawn7aZdjyd5ZeQM0k", tutorsUrl: "https://buy.stripe.com/3cIdR96g78f37Zed5ZeQM0l" },
  { level: "intermediate", label: "المتوسط", coursesUrl: "https://buy.stripe.com/fZuaEXgUL8f3gvK6HBeQM0m", tutorsUrl: "https://buy.stripe.com/8x23cv7kb1QF2EUc1VeQM0n" },
  { level: "advanced", label: "المتقدم", coursesUrl: "https://buy.stripe.com/28E14ndIz7aZ0wM7LFeQM0o", tutorsUrl: "https://buy.stripe.com/6oUaEXdIz9j7enC7LFeQM0p" },
] as const;

export const BUNDLE_PRICES = {
  courses: { price: 60, original: 70 },
  tutors: { price: 89, original: 99 },
} as const;

// Exclusive cutoff: the offer includes the entire 23:59 minute in Dubai.
export const BUNDLE_LIMITED_TIME_OFFER = {
  endsAt: "2027-01-01T00:00:00+04:00",
  courses: { price: 55, promoCode: "LTO5B" },
  tutors: { price: 79, promoCode: "LTO10B" },
} as const;

export function getBundleOfferState(now = Date.now()) {
  const limitedTime = now < Date.parse(BUNDLE_LIMITED_TIME_OFFER.endsAt);
  return {
    limitedTime,
    prices: {
      courses: { ...BUNDLE_PRICES.courses, price: limitedTime ? BUNDLE_LIMITED_TIME_OFFER.courses.price : BUNDLE_PRICES.courses.price },
      tutors: { ...BUNDLE_PRICES.tutors, price: limitedTime ? BUNDLE_LIMITED_TIME_OFFER.tutors.price : BUNDLE_PRICES.tutors.price },
    },
  };
}

export function getBundleCheckoutUrl(url: string, tier: "courses" | "tutors", now = Date.now()) {
  if (!getBundleOfferState(now).limitedTime) return url;
  const checkout = new URL(url);
  checkout.searchParams.set("prefilled_promo_code", BUNDLE_LIMITED_TIME_OFFER[tier].promoCode);
  return checkout.toString();
}