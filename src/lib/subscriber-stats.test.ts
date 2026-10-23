import { test } from "node:test";
import assert from "node:assert/strict";
import { countPayingSubscribers, isExcludedStatsUser } from "./subscriber-stats";
import { matchesStatsToken } from "./stats-token.server";
import { BUNDLE_OFFERS, BUNDLE_PRICES } from "./bundle-offers";

const paid = (user_id: string | null, tier = "course", amount_paid_cents: number | null = 6000, amount = 60, status = "active") => ({ user_id, tier, amount_paid_cents, amount, status });
test("bundle prices match the requested current and crossed-out prices", () => {
  assert.deepEqual(BUNDLE_PRICES, { courses: { price: 60, original: 70 }, tutors: { price: 89, original: 99 } });
});
test("all six level/tier links match the supplied Stripe links", () => {
  assert.deepEqual(BUNDLE_OFFERS.map(({ level, coursesUrl, tutorsUrl }) => [level, coursesUrl, tutorsUrl]), [
    ["beginner", "https://buy.stripe.com/28E9ATawn7aZdjyd5ZeQM0k", "https://buy.stripe.com/3cIdR96g78f37Zed5ZeQM0l"],
    ["intermediate", "https://buy.stripe.com/fZuaEXgUL8f3gvK6HBeQM0m", "https://buy.stripe.com/8x23cv7kb1QF2EUc1VeQM0n"],
    ["advanced", "https://buy.stripe.com/28E14ndIz7aZ0wM7LFeQM0o", "https://buy.stripe.com/6oUaEXdIz9j7enC7LFeQM0p"],
  ]);
});
test("count distinct paying active subscribers split into exclusive tiers", () => {
  const users = ["a", "b", "free", "inactive"].map((id) => ({ id, email: `${id}@example.com` }));
  assert.deepEqual(countPayingSubscribers([paid("a"), paid("a"), paid("b"), paid("b", "course_ai"), paid("free", "course", 0), paid("inactive", "course", 6000, 60, "cancelled"), paid(null)], users, []), { total: 2, course: 1, course_ai: 1 });
});
test("legacy amounts count only when cents is absent", () => {
  assert.deepEqual(countPayingSubscribers([paid("a", "course", null, 25), paid("b", "course", 0, 25)], [{ id: "a", email: "a@example.com" }, { id: "b", email: "b@example.com" }], []), { total: 1, course: 1, course_ai: 0 });
});
test("exclude normalized admin allowlist accounts", () => {
  assert.equal(isExcludedStatsUser({ id: "a", email: " Admin@Example.com " }, ["admin@example.com"]), true);
});
test("exclude internal_admin_test in either auth metadata source", () => {
  assert.equal(isExcludedStatsUser({ id: "a", email: "a@example.com", app_metadata: { tags: ["internal_admin_test"] } }, []), true);
  assert.equal(isExcludedStatsUser({ id: "b", email: "b@example.com", user_metadata: { account_type: "internal_admin_test" } }, []), true);
  assert.equal(isExcludedStatsUser({ id: "c", email: "c@example.com", app_metadata: { internal_admin_test: true } }, []), true);
});
test("exclude known QA and deletion test accounts", () => {
  for (const email of ["gasem91+coursiqa@gmail.com", "gasem91+playstoreqa@gmail.com", "gasem91+deletetest@gmail.com", "qa.audit2.test@coursi.ai"]) assert.equal(isExcludedStatsUser({ id: email, email }, []), true);
  assert.equal(isExcludedStatsUser({ id: "real", email: "student@example.com" }, []), false);
});
test("token check rejects missing, invalid and differing-length tokens", () => {
  assert.equal(matchesStatsToken("", "fixture-token"), false);
  assert.equal(matchesStatsToken("fixture-token", undefined), false);
  assert.equal(matchesStatsToken("wrong", "fixture-token"), false);
  assert.equal(matchesStatsToken("fixture-token", "fixture-token"), true);
});