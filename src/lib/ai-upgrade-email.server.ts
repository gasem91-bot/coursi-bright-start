import { emailShell } from "./email-shell.server";

export const AI_UPGRADE_SUBJECT = "تم تفعيل مساعد كورسي الذكي 🤖 رابط الدخول بالداخل";

export const AI_TUTOR_BOT_LINK = "https://t.me/CoursiAI_bot";

export function buildAiUpgradeHtml(botLink: string = AI_TUTOR_BOT_LINK): string {
  const body = `
<div style="padding:8px 4px;text-align:right">
  <h2 style="margin:0 0 14px;font-size:22px;color:#0f172a">تم تفعيل مساعد الذكاء الاصطناعي</h2>
  <p style="margin:0 0 14px;font-size:15px;line-height:1.9;color:#1e293b">
    شكراً لك، تمت إضافة مساعد كورسي الذكي إلى حسابك بنجاح
  </p>
  <p style="margin:0 0 18px;font-size:15px;line-height:1.9;color:#1e293b">
    اضغط الزر أدناه لبدء المحادثة مع المساعد على تيليجرام، ثم أرسل بريدك الإلكتروني نفسه المسجل لدينا ليتعرّف عليك
  </p>
  <p style="margin:0 0 18px;text-align:right">
    <a href="${botLink}" style="display:inline-block;background:#229ED9;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 30px;border-radius:50px">
      افتح مساعد كورسي الذكي
    </a>
  </p>
  <p style="margin:0;font-size:13px;line-height:1.9;color:#475569">
    أو انسخ هذا الرابط: <span style="color:#0f172a">${botLink}</span>
  </p>
</div>`;
  return emailShell({
    body,
    footerReason: "وصلتك هذه الرسالة لأنك أضفت مساعد الذكاء الاصطناعي إلى اشتراكك في كورسي",
  });
}
