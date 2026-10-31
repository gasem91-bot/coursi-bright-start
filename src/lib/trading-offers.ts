// Trading course cross-sell offers shown on the signed-in Offers page.
// One-time prices, no discounts and no promo codes on these links.
export const TRADING_OFFERS = [
  {
    level: "beginner",
    name: "أساسيات التداول — المبتدئ",
    courseUrl: "https://buy.stripe.com/cNi7sLfQH2UJenC2rleQM0c",
    botsUrl: "https://buy.stripe.com/9B65kD9sjgLz4N22rleQM0d",
  },
  {
    level: "intermediate",
    name: "التداول الاحترافي — المتوسط",
    courseUrl: "https://buy.stripe.com/6oU6oH7kbeDr4N2c1VeQM0f",
    botsUrl: "https://buy.stripe.com/dRmdR91ZRdzn1AQ4zteQM0e",
  },
  {
    level: "advanced",
    name: "التداول المتقدم",
    courseUrl: "https://buy.stripe.com/14AeVd6g7dzn4N28PJeQM0h",
    botsUrl: "https://buy.stripe.com/fZudR933V1QF7Zefe7eQM0g",
  },
] as const;

export const TRADING_PRICES = { course: 35, bots: 60 } as const;
