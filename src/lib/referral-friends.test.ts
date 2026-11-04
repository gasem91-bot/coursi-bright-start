import { test } from "node:test";
import assert from "node:assert/strict";
import { buildFriendRows, friendsCountLabel, maskEmail } from "./referral-friends";

test("masks email, never full address", () => {
  assert.equal(maskEmail("Ahmed@Gmail.com"), "a***@gmail.com");
});

test("Arabic count wording for 0, 1, 2, 3-10, 11+", () => {
  assert.equal(friendsCountLabel(0), "لا يوجد أصدقاء في قائمتك بعد");
  assert.equal(friendsCountLabel(1), "لديك صديق واحد");
  assert.equal(friendsCountLabel(2), "لديك صديقان");
  assert.equal(friendsCountLabel(3), "لديك 3 أصدقاء");
  assert.equal(friendsCountLabel(10), "لديك 10 أصدقاء");
  assert.equal(friendsCountLabel(11), "لديك 11 صديقاً");
});

test("statuses, course names, masking and dedupe", () => {
  const base = { signed_up_at: null, purchased_at: null };
  const rows = buildFriendRows([
    { key: "1", email: "a@x.com", name: "أحمد", vertical: "ai", status: "signed_up", ...base, signed_up_at: "t" },
    { key: "2", email: "b@x.com", name: null, vertical: "ai", status: "rewarded", ...base },
    { key: "3", email: "c@x.com", name: null, vertical: "trading", status: "invited", ...base },
    { key: "4", email: "a@x.com", name: "أحمد", vertical: "ai", status: "signed_up", ...base },
    { key: "5", email: "d@x.com", name: null, vertical: "ai", status: "voided", ...base },
  ]);
  assert.deepEqual(rows.map((r) => [r.name, r.course, r.status]), [
    ["أحمد", "كورسي الذكاء الاصطناعي", "joined"],
    ["b***@x.com", "كورسي الذكاء الاصطناعي", "purchased"],
    ["c***@x.com", "كورسي التداول", "pending"],
  ]);
});
