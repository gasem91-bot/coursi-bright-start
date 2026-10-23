export const BUNDLE_OFFERS = [
  { level: "beginner", label: "المبتدئ", coursesUrl: "https://buy.stripe.com/28E9ATawn7aZdjyd5ZeQM0k", tutorsUrl: "https://buy.stripe.com/3cIdR96g78f37Zed5ZeQM0l" },
  { level: "intermediate", label: "المتوسط", coursesUrl: "https://buy.stripe.com/fZuaEXgUL8f3gvK6HBeQM0m", tutorsUrl: "https://buy.stripe.com/8x23cv7kb1QF2EUc1VeQM0n" },
  { level: "advanced", label: "المتقدم", coursesUrl: "https://buy.stripe.com/28E14ndIz7aZ0wM7LFeQM0o", tutorsUrl: "https://buy.stripe.com/6oUaEXdIz9j7enC7LFeQM0p" },
] as const;

export const BUNDLE_PRICES = {
  courses: { price: 60, original: 70 },
  tutors: { price: 89, original: 99 },
} as const;