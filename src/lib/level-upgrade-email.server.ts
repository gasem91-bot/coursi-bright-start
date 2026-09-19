import { emailShell } from "./email-shell.server";

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

  const body = `
<div style="padding:8px 4px;text-align:right">
  <h2 style="margin:0 0 14px;font-size:22px;color:#0f172a">مبروك، تم فتح ${levelName}</h2>
  <p style="margin:0 0 14px;font-size:15px;line-height:1.9;color:#1e293b">
    تم استلام دفعتك بنجاح وفُتح لك ${levelName} في مسار الذكاء الاصطناعي
  </p>
  <p style="margin:0 0 18px;font-size:15px;line-height:1.9;color:#1e293b">${tierLine}</p>
  <p style="margin:0 0 18px;text-align:right">
    <a href="https://ai.portal.coursi.ai/dashboard" style="display:inline-block;background:#7B35FF;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 30px;border-radius:50px">
      ابدأ المستوى الجديد
    </a>
  </p>
  <p style="margin:0;font-size:13px;line-height:1.9;color:#475569">
    أو انسخ هذا الرابط: <span style="color:#0f172a">https://ai.portal.coursi.ai/dashboard</span>
  </p>
</div>`;
  return emailShell({
    body,
    footerReason: "وصلتك هذه الرسالة لأنك رقّيت مستواك في كورسي",
  });
}
