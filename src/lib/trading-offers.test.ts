import { test } from "node:test";
import assert from "node:assert/strict";
import { TRADING_OFFERS, TRADING_PRICES } from "./trading-offers";

test("trading prices are $35 course-only and $60 with bots, one-time", () => {
  assert.deepEqual(TRADING_PRICES, { course: 35, bots: 60 });
});

test("three trading levels with the exact owner-approved Stripe links", () => {
  assert.equal(TRADING_OFFERS.length, 3);
  const byLevel = Object.fromEntries(TRADING_OFFERS.map((o) => [o.level, o]));
  assert.equal(byLevel.beginner.courseUrl, "https://buy.stripe.com/cNi7sLfQH2UJenC2rleQM0c");
  assert.equal(byLevel.beginner.botsUrl, "https://buy.stripe.com/9B65kD9sjgLz4N22rleQM0d");
  assert.equal(byLevel.intermediate.courseUrl, "https://buy.stripe.com/6oU6oH7kbeDr4N2c1VeQM0f");
  assert.equal(byLevel.intermediate.botsUrl, "https://buy.stripe.com/dRmdR91ZRdzn1AQ4zteQM0e");
  assert.equal(byLevel.advanced.courseUrl, "https://buy.stripe.com/14AeVd6g7dzn4N28PJeQM0h");
  assert.equal(byLevel.advanced.botsUrl, "https://buy.stripe.com/fZudR933V1QF7Zefe7eQM0g");
});

test("trading links carry no prefilled promo code", () => {
  for (const offer of TRADING_OFFERS) {
    for (const url of [offer.courseUrl, offer.botsUrl]) {
      assert.ok(!url.includes("prefilled_promo_code"), url);
    }
  }
});
