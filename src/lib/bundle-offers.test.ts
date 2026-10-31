import { test } from "node:test";
import assert from "node:assert/strict";
import { BUNDLE_OFFERS, getBundleOfferState, getBundleCheckoutUrl } from "./bundle-offers";

const active = Date.parse("2026-10-31T14:32:00+04:00");
const lastMinute = Date.parse("2026-12-31T23:59:59.999+04:00");
const expired = Date.parse("2027-01-01T00:00:00+04:00");

test("limited courses price is $55 with original $70", () => {
  assert.deepEqual(getBundleOfferState(active).prices.courses, { price: 55, original: 70 });
});
test("limited tutors price is $79 with original $99", () => {
  assert.deepEqual(getBundleOfferState(active).prices.tutors, { price: 79, original: 99 });
});
test("offer includes the entire final 23:59 Dubai minute", () => {
  assert.equal(getBundleOfferState(lastMinute).limitedTime, true);
  assert.equal(getBundleOfferState(lastMinute).prices.courses.price, 55);
});
test("Dubai midnight restores $60/$89 and removes limited-time state", () => {
  assert.deepEqual(getBundleOfferState(expired), {
    limitedTime: false,
    prices: { courses: { price: 60, original: 70 }, tutors: { price: 89, original: 99 } },
  });
});
test("all three courses-only original links receive only LTO5B during offer", () => {
  for (const bundle of BUNDLE_OFFERS) {
    assert.equal(getBundleCheckoutUrl(bundle.coursesUrl, "courses", active), `${bundle.coursesUrl}?prefilled_promo_code=LTO5B`);
  }
});
test("all three tutor original links receive only LTO10B during offer", () => {
  for (const bundle of BUNDLE_OFFERS) {
    assert.equal(getBundleCheckoutUrl(bundle.tutorsUrl, "tutors", active), `${bundle.tutorsUrl}?prefilled_promo_code=LTO10B`);
  }
});
test("all six links revert without any prefilled promo at Dubai midnight", () => {
  for (const bundle of BUNDLE_OFFERS) {
    assert.equal(getBundleCheckoutUrl(bundle.coursesUrl, "courses", expired), bundle.coursesUrl);
    assert.equal(getBundleCheckoutUrl(bundle.tutorsUrl, "tutors", expired), bundle.tutorsUrl);
  }
});
test("promo appending preserves an existing query string with ampersand", () => {
  assert.equal(getBundleCheckoutUrl(`${BUNDLE_OFFERS[0].coursesUrl}?locale=ar`, "courses", active), `${BUNDLE_OFFERS[0].coursesUrl}?locale=ar&prefilled_promo_code=LTO5B`);
});