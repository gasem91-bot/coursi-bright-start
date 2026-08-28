// Branded welcome / purchase-confirmation email — uses the shared COURS! email shell.

import { emailShell } from "./email-shell.server";

export const WELCOME_SUBJECT = "مرحباً بك في كورسي! 🎉 كورسك جاهز";

export const LEVEL_NAMES: Record<string, string> = {
  beginner: "أساسيات الذكاء الاصطناعي من الصفر",
  intermediate: "الذكاء الاصطناعي للمحترفين",
  advanced: "إتقان الذكاء الاصطناعي — بناء منتجات وأعمال",
};

export const LEVEL_META: Record<string, string> = {
  beginner: "٨ فصول · ٤ أسابيع",
  intermediate: "١٠ فصول · ٦ أسابيع",
  advanced: "١٢ فصل · ٨ أسابيع",
};

export const LEVEL_ARABIC: Record<string, string> = {
  beginner: "مبتدئ 🌱",
  intermediate: "متوسط 📈",
  advanced: "متقدم 🔥",
};

export function buildWelcomeHtml(
  level: string,
  tier: string,
  loginLink: string,
  userEmail?: string,
): string {
  const courseName = LEVEL_NAMES[level] || LEVEL_NAMES.beginner;
  const courseMeta = LEVEL_META[level] || LEVEL_META.beginner;
  const levelArabic = LEVEL_ARABIC[level] || LEVEL_ARABIC.beginner;
  const tierText =
    tier === "course_ai"
      ? "<strong>باقة الكورس + مساعد AI</strong> — مساعد ذكي يجاوب على أسئلتك داخل كل درس"
      : "<strong>باقة الكورس</strong> — وصول كامل لجميع فصول مستواك";

  const body = `<div class="hero">
  <div class="badge">✦ رحلتك المهنية بدأت للتو</div>
  <h1>أهلاً بك في مجتمع<br><span>المتعلمين العرب الطموحين</span></h1>
  <div class="hero-sub">
    <p>لقد اتخذت القرار الأذكى اليوم<br>
    كورسك جاهز، مسارك محدد، وفريق كورسي معك في كل خطوة</p>
  </div>
</div>
<div class="card" dir="rtl">
  <div class="card-label">✦ كورسك المخصص</div>
  <div class="card-name">${courseName}</div>
  <div class="card-level">${levelArabic}</div>
  <div class="card-meta">${courseMeta} · اختبار بعد كل فصل · شهادة إتمام</div>
  <div class="tier-box">${tierText}</div>
</div>
<div class="cta">
  <a href="${loginLink}" class="btn">ادخل لكورسك الآن ←</a>
  <p class="cta-note">
    الرابط صالح لمدة ٤٨ ساعة · لا تحتاج كلمة مرور في المرة الأولى<br>
    <span style="color:#2A2A2A;">إذا لم يفتح الرابط، انسخه وضعه في متصفحك</span>
  </p>
</div>
<div class="card" dir="rtl" style="direction:rtl;text-align:right;">
  <div class="card-label">✦ بيانات حسابك</div>
  <div style="direction:rtl;text-align:right;line-height:2;">
    اسم المستخدم (بريد الدخول):<br>
    <strong style="unicode-bidi:plaintext;">${userEmail ?? "بريدك الإلكتروني المستخدم في الدفع"}</strong>
  </div>
  <div style="direction:rtl;text-align:right;margin-top:12px;line-height:2;">
    حسابك محمي بكلمة مرور خاصة بك. تقدر تدخل مباشرة بالرابط أعلاه بدون كلمة مرور،
    وإذا رغبت بالدخول بكلمة مرور أو نسيتها، اضغط الزر التالي لتعيين كلمة مرور جديدة
  </div>
  <div style="text-align:center;margin-top:18px;">
    <a href="https://ai.portal.coursi.ai/login?reset=1" class="btn">نسيت كلمة المرور؟ عيّن كلمة مرور ←</a>
  </div>
</div>`;

  return emailShell({
    body,
    footerReason: "تلقّيت هذا البريد لأنك اشتركت في COURS! على coursi.ai",
  });
}
