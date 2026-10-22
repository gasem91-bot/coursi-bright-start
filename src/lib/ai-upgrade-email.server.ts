import { emailBadge, emailShell } from "./email-shell.server";

export const AI_UPGRADE_SUBJECT = "تم تفعيل مساعد كورسي الذكي 🤖 رابط الدخول بالداخل";

export const AI_TUTOR_BOT_LINK = "https://t.me/CoursiAI_bot";

export function buildAiUpgradeHtml(botLink: string = AI_TUTOR_BOT_LINK, level: string = "beginner"): string {
  const body = `<div class="hero">
  ${emailBadge(level, "شارة مستواك في كورسي")}
  <h1>تم تفعيل <span>مساعد الذكاء الاصطناعي</span></h1>
  <div class="hero-sub">
    <p>شكراً لك، تمت إضافة مساعد كورسي الذكي إلى حسابك بنجاح<br>
    اضغط الزر أدناه لبدء المحادثة مع المساعد على تيليجرام، ثم أرسل بريدك الإلكتروني نفسه المسجل لدينا ليتعرّف عليك</p>
  </div>
</div>
<div class="cta">
  <a href="${botLink}" class="btn">افتح مساعد كورسي الذكي</a>
  <p class="cta-note">أو انسخ هذا الرابط:<br><a href="${botLink}" class="flink" dir="ltr">${botLink}</a></p>
</div>`;
  return emailShell({
    body,
    footerReason: "وصلتك هذه الرسالة لأنك أضفت مساعد الذكاء الاصطناعي إلى اشتراكك في كورسي",
  });
}
