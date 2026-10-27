// Branded one-time verification code email (in-app account creation / sign-in).
import { emailShell } from "./email-shell.server";

export const VERIFY_CODE_SUBJECT = "🔐 رمز التحقق الخاص بك في كورسي";

export function buildVerifyCodeHtml(params: {
  code: string;
  email: string;
  purpose: "register" | "login";
}): string {
  const { code, email, purpose } = params;
  const title = purpose === "register" ? "أكّد بريدك لإنشاء حسابك" : "رمز الدخول إلى حسابك";
  const body = `<div class="hero">
  <div class="badge-cyan">🔐 رمز التحقق</div>
  <h1>${title}</h1>
  <div class="hero-sub">
    <p>أدخل هذا الرمز في تطبيق كورسي لإكمال العملية</p>
  </div>
</div>
<div class="card card-center" dir="rtl">
  <div class="card-label">✦ رمزك</div>
  <div style="font-size:38px;font-weight:900;letter-spacing:10px;color:#FFFFFF;direction:ltr;unicode-bidi:plaintext;">${code}</div>
  <div class="row" dir="rtl">البريد: <b style="unicode-bidi:plaintext;">${email}</b></div>
  <div class="row" dir="rtl">صلاحية الرمز: <b>ساعة واحدة</b></div>
</div>
<div class="cta">
  <p class="cta-note">إذا لم تطلب أنت هذا الرمز، تجاهل هذا البريد وحسابك يبقى آمناً</p>
</div>`;
  return emailShell({
    body,
    headerSubtitle: "رمز التحقق",
    footerReason: "تلقّيت هذا البريد لأن أحدهم طلب رمز تحقق لهذا البريد في كورسي",
  });
}
