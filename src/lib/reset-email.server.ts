// Branded password-reset email — uses the shared COURS! email shell.

import { emailShell } from "./email-shell.server";

export const RESET_SUBJECT = "🔐 إعادة تعيين كلمة المرور — كورسي";

export function buildResetHtml(params: { link: string; email: string }): string {
  const { link, email } = params;
  const body = `<div class="hero">
  <div class="badge-cyan">🔐 أمان الحساب</div>
  <h1>طلب <span>إعادة تعيين كلمة المرور</span></h1>
  <div class="hero-sub">
    <p>وصلنا طلب لإعادة تعيين كلمة المرور لحسابك في بوابة كورسي<br>
    اضغط الزر أدناه لتعيين كلمة مرور جديدة والدخول مباشرة</p>
  </div>
</div>
<div class="card" dir="rtl">
  <div class="card-label">✦ بيانات الحساب</div>
  <div class="row" dir="rtl">اسم المستخدم (بريد الدخول): <b style="unicode-bidi:plaintext;">${email}</b></div>
  <div class="row" dir="rtl">صلاحية الرابط: <b>ساعة واحدة من وقت الإرسال</b></div>
</div>
<div class="cta">
  <a href="${link}" class="btn">عيّن كلمة مرور جديدة ←</a>
  <p class="cta-note">
    إذا لم تطلب أنت إعادة التعيين، تجاهل هذا البريد وكلمة مرورك ستبقى كما هي<br>
    إذا لم يفتح الزر، انسخ الرابط التالي وضعه في متصفحك:<br>
    <span style="color:#7FE3E3;word-break:break-all;unicode-bidi:plaintext;">${link}</span>
  </p>
</div>`;
  return emailShell({
    body,
    headerSubtitle: "إعادة تعيين كلمة المرور",
    footerReason: "تلقّيت هذا البريد لأن أحدهم طلب إعادة تعيين كلمة المرور لحسابك في COURS!",
  });
}
