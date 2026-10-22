import { emailBadge, emailShell } from "./email-shell.server";

export const LEVEL_UPGRADE_SUBJECT = "تم فتح مستواك الجديد في كورسي 🎓";

const LEVEL_AR: Record<string, string> = {
  beginner: "المستوى المبتدئ",
  intermediate: "المستوى المتوسط",
  advanced: "المستوى المتقدم",
};

export function buildLevelUpgradeHtml(toLevel: string, tier: string): string {
  const levelName = LEVEL_AR[toLevel] ?? toLevel;
  const tierLine =
    tier === "course_ai"
      ? "اشتراكك يشمل مساعد كورسي الذكي، وهو متاح معك في المستوى الجديد أيضاً"
      : "تستطيع في أي وقت إضافة مساعد كورسي الذكي إلى اشتراكك من صفحة الترقية";

  const body = `<div class="hero">
  ${emailBadge(toLevel, `شارة ${levelName}`)}
  <h1>مبروك، تم فتح <span>${levelName}</span></h1>
  <div class="hero-sub">
    <p>تم استلام دفعتك بنجاح وفُتح لك ${levelName} في مسار الذكاء الاصطناعي<br>${tierLine}</p>
  </div>
</div>
<div class="cta">
  <a href="https://ai.portal.coursi.ai/dashboard" class="btn">ابدأ المستوى الجديد</a>
  <p class="cta-note">أو انسخ هذا الرابط:<br><a href="https://ai.portal.coursi.ai/dashboard" class="flink" dir="ltr">https://ai.portal.coursi.ai/dashboard</a></p>
</div>`;
  return emailShell({
    body,
    footerReason: "وصلتك هذه الرسالة لأنك رقّيت مستواك في كورسي",
  });
}
