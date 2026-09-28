// Marketing nudge email — sent to a student who is close to finishing their
// current level but hasn't yet, encouraging them to lock in the existing $10
// next-level unlock (see src/lib/upgrade.functions.ts: LEVEL_UPGRADE_PRICE_ID)
// before they finish. This template only builds the HTML; the trigger
// (detecting "nearly finished" from course_progress and actually sending it,
// e.g. on a schedule) is not wired up yet — see cours-next-actions memory.

import { emailShell } from "./email-shell.server";

export const UPGRADE_NUDGE_SUBJECT = "أنت قريب من إنهاء مستواك 🔥 افتح المستوى التالي بـ $10 فقط";

const LEVEL_AR: Record<string, string> = {
  beginner: "المستوى المبتدئ",
  intermediate: "المستوى المتوسط",
  advanced: "المستوى المتقدم",
};

const NEXT_LEVEL_AR: Record<string, string> = {
  beginner: "المستوى المتوسط",
  intermediate: "المستوى المتقدم",
};

export function buildUpgradeNudgeHtml(params: {
  userName?: string;
  currentLevel: string;
  remainingChapters: number;
  courseLink?: string;
}): string {
  const { userName, currentLevel, remainingChapters } = params;
  const courseLink = params.courseLink ?? "https://ai.portal.coursi.ai/course/ai";
  const levelName = LEVEL_AR[currentLevel] ?? currentLevel;
  const nextLevelName = NEXT_LEVEL_AR[currentLevel] ?? "المستوى التالي";
  const greeting = userName ? `أنت رائع يا ${userName}!` : "أنت رائع!";

  const body = `<div class="hero">
  <div class="badge">🔥 على بعد خطوات قليلة</div>
  <h1>${greeting}<br><span>باقي ${remainingChapters} ${remainingChapters === 1 ? "فصل" : "فصول"} فقط على إنهاء ${levelName}</span></h1>
  <div class="hero-sub">
    <p>إنجاز رائع! وقبل ما تخلص، عندنا عرض خاص لك<br>
    افتح ${nextLevelName} الآن بسعر مخفّض، بدل ما تدفع السعر الكامل لاحقاً</p>
  </div>
</div>

<div class="card" dir="rtl">
  <div class="card-label">✦ عرض فتح المستوى التالي</div>
  <div class="card-name">${nextLevelName}</div>
  <div class="tier-box">
    السعر الكامل لفتح مستوى جديد بشكل منفصل أعلى من ذلك بكثير — وأنت الآن تقدر تفتحه بـ <b style="color:#FFFFFF;">10$ فقط</b>، لأنك بالفعل مشترك معنا.<br><br>
    يبقى المستوى الجديد بانتظارك في حسابك، وتقدر تبدأه فور ما تخلّص ${levelName}.
  </div>
</div>

<div class="cta">
  <a href="${courseLink}" class="btn">افتح ${nextLevelName} الآن — $10 ←</a>
  <p class="cta-note">
    تقدر تكمل ${levelName} الأول، العرض يبقى متاحاً لك من صفحة الكورس<br>
    <span style="color:#A2A2B0;">إذا لم يفتح الرابط، انسخه وضعه في متصفحك: ${courseLink}</span>
  </p>
</div>`;

  return emailShell({
    body,
    footerReason: "تلقّيت هذا البريد لأنك على وشك إنهاء مستوى في كورسي على coursi.ai",
  });
}
