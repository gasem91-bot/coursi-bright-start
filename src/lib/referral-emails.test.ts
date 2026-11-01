import { test } from "node:test";
import assert from "node:assert/strict";
import { buildReferrerRewardHtml } from "./referral-emails.server";

const sample = {
  firstName: "قاسم", friendFirstName: "أحمد", rewardCode: "RW-EXAMPLE",
  expiryDate: "٢٩ يناير ٢٠٢٧", purchaseLink: "https://coursi.ai/ai",
};

test("reward email rejects automatic promotion-code prefill", () => {
  assert.throws(() => buildReferrerRewardHtml({ ...sample, purchaseLink: "https://buy.stripe.com/example?prefilled_promo_code=RW-EXAMPLE" }), /must not be prefilled/);
});

test("reward email rejects unsafe and unrelated checkout destinations", () => {
  for (const purchaseLink of ["javascript:alert(1)", "http://coursi.ai/ai", "https://unrelated.example/checkout"]) {
    assert.throws(() => buildReferrerRewardHtml({ ...sample, purchaseLink }), /Invalid referral purchase link/);
  }
});

test("reward placeholders cannot inject executable content", () => {
  const payload = '<script>alert("fixture")</script>';
  for (const field of ["firstName", "friendFirstName", "rewardCode", "expiryDate"] as const) {
    const html = buildReferrerRewardHtml({ ...sample, [field]: payload });
    assert.equal(html.includes(payload), false);
    assert.equal(html.includes("&lt;script&gt;alert(&quot;fixture&quot;)&lt;/script&gt;"), true);
  }
});