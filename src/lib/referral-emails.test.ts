import { test } from "node:test";
import assert from "node:assert/strict";
import * as emails from "./referral-emails.server";
import { buildFriendInviteHtml, buildFriendJoinedHtml, buildReferrerRewardHtml, friendJoinedSubject, REFERRER_REWARD_SUBJECT } from "./referral-emails.server";

const sample = { firstName: "قاسم", friendFirstName: "أحمد", rewardCode: "RW-EXAMPLE", expiryDate: "٢٩ يناير ٢٠٢٧", balance: 10 };

test("exactly three referral emails exist; friend-discount email is gone", () => {
  assert.equal("buildFriendDiscountHtml" in emails, false);
  assert.equal("FRIEND_DISCOUNT_SUBJECT" in emails, false);
});

test("friend joined subject and button", () => {
  assert.equal(friendJoinedSubject("أحمد"), "أحمد أصبح في قائمة أصدقائك على كورسي");
  const html = buildFriendJoinedHtml({ firstName: "قاسم", friendFirstName: "أحمد" });
  assert.ok(html.includes("عرض أصدقائي"));
  assert.ok(html.includes("وعندما يُكمل أول عملية شراء، يُضاف 5$ إلى محفظتك"));
});

test("reward email shows subject, balance, button and no-stacking note", () => {
  assert.equal(REFERRER_REWARD_SUBJECT, "تمت إضافة 5$ إلى محفظتك في كورسي");
  const html = buildReferrerRewardHtml(sample);
  assert.ok(html.includes("ورصيدك الحالي 10$"));
  assert.ok(html.includes("افتح محفظتي"));
  assert.ok(html.includes("ولا يُجمع الاثنان معاً"));
});

test("referral emails carry no per-course title", () => {
  for (const html of [buildFriendJoinedHtml({ firstName: "a", friendFirstName: "b" }), buildReferrerRewardHtml(sample), buildFriendInviteHtml({ referrerName: "a", friendCode: "X", purchaseLink: "https://coursi.ai/ai" })]) {
    const h1 = html.match(/<h1>(.*?)<\/h1>/)?.[1] ?? "";
    assert.equal(h1.includes("الذكاء الاصطناعي"), false);
  }
});

test("invite rejects prefilled and unsafe links", () => {
  assert.throws(() => buildFriendInviteHtml({ referrerName: "a", friendCode: "X", purchaseLink: "https://buy.stripe.com/x?prefilled_promo_code=X" }), /must not be prefilled/);
  assert.throws(() => buildFriendInviteHtml({ referrerName: "a", friendCode: "X", purchaseLink: "https://unrelated.example/x" }), /Invalid referral purchase link/);
});

test("placeholders cannot inject executable content", () => {
  const payload = '<script>alert("fixture")</script>';
  for (const field of ["firstName", "friendFirstName", "rewardCode", "expiryDate"] as const) {
    assert.equal(buildReferrerRewardHtml({ ...sample, [field]: payload }).includes(payload), false);
  }
  assert.equal(buildFriendJoinedHtml({ firstName: payload, friendFirstName: payload }).includes(payload), false);
});
