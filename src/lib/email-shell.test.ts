import { test } from "node:test";
import assert from "node:assert/strict";
import { emailHeader, emailShell, BRAND_AR } from "./email-shell.server";
import { buildFriendInviteHtml } from "./referral-emails.server";

// Everything between the header's own tags: the logo plus nothing else.
const headerInner = (html: string) => html.match(/<div class="hdr">([\s\S]*?)<\/div>/)?.[1] ?? "";
const textOnly = (inner: string) => inner.replace(/<img[^>]*>/g, "").trim();

test("header renders the logo only, with no brand-name text line under it", () => {
  const inner = headerInner(emailHeader());
  assert.ok(inner.includes('class="logo-img"'), "logo image must stay");
  assert.ok(inner.includes('width="170"'), "logo size must stay");
  assert.equal(textOnly(inner), "");
  assert.ok(inner.includes(`alt="${BRAND_AR}"`), "logo alt text stays for accessibility");
  assert.equal(textOnly(inner).includes(BRAND_AR), false, "brand name must not be printed next to the logo");
});

test("a caller subtitle is never printed under the logo", () => {
  for (const subtitle of ["كورسي", "رمز التحقق", "تذكرة دعم جديدة", "إعادة تعيين كلمة المرور"]) {
    assert.equal(textOnly(headerInner(emailHeader(subtitle))), "", subtitle);
  }
});

test("emails built on the shell carry no header text line", () => {
  const html = emailShell({ body: '<div class="hero"><h1>تهنئة</h1></div>', footerReason: "ختبار" });
  assert.equal(html.includes("hdr-sub"), false);
  assert.equal(textOnly(headerInner(html)), "");
});

test("referral invite email has no brand-name line under the logo", () => {
  const html = buildFriendInviteHtml({ referrerName: "قاسم", friendCode: "FR-ABC123", purchaseLink: "https://buy.stripe.com/abc123xyz" });
  assert.equal(html.includes("hdr-sub"), false);
  assert.equal(textOnly(headerInner(html)), "");
});
