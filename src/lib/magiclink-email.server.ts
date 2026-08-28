// Branded magic-link (passwordless sign-in) email — uses the shared COURS! email shell.

import { emailShell } from "./email-shell.server";

export const MAGICLINK_SUBJECT = "🔑 رابط الدخول إلى بوابة كورسي";

export function buildMagicLinkHtml(params: { link: string; email: string }): string {
  const { link, email } = params;
  const body = `<div class="hero">
  <div class="badge-cyan">🔑 دخول بدون كلمة مرور</div>
  <h1>رابط <span>الدخول السريع</span> جاهز</h1>
  <div class="hero-sub">
    <p>اضغط الزر أدناه وسجّل دخولك مباشرة إلى بوابة كورسي<br>
    بدون الحاجة لإدخال كلمة المرور</p>
  </div>
</div>
<div class="card" dir="rtl">
  <div class="card-label">✦ بيانات الدخول</div>
  <div class="row" dir="rtl">اسم المستخدم (بريد الدخول): <b style="unicode-bidi:plaintext;">${email}</b></div>
  <div class="row" dir="rtl">صلاحية الرابط: <b>ساعة واحدة من وقت الإرسال</b></div>
</div>
<div class="cta">
  <a href="${link}" class="btn">ادخل إلى البوابة ←</a>
  <p class="cta-note">
    إذا لم تطلب أنت هذا الرابط، تجاهل هذا البريد وحسابك يبقى آمناً<br>
    إذا لم يفتح الزر، انسخ الرابط التالي وضعه في متصفحك:<br>
    <span style="color:#7FE3E3;word-break:break-all;unicode-bidi:plaintext;">${link}</span>
  </p>
</div>`;
  return emailShell({
    body,
    headerSubtitle: "رابط الدخول السريع",
    footerReason: "تلقّيت هذا البريد لأن أحدهم طلب رابط دخول لحسابك في COURS!",
  });
}
