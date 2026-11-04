import { emailShell } from "./email-shell.server";

export const BUNDLE_ACTIVATION_SUBJECT = "فعّل كورس الذكاء الاصطناعي المضمّن في باقتك";

export function buildBundleActivationHtml(link: string): string {
  const safe = link.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const body = `<div class="hero">
  <h1>كورس <span>الذكاء الاصطناعي</span> بانتظارك</h1>
  <p>شكراً لشرائك باقة الذكاء الاصطناعي + التداول من كورسي.<br>
  كورس الذكاء الاصطناعي مضمّن في باقتك، لكنه لم يُفعَّل بعد.<br>
  الخطوة التالية: استبيان قصير لتحديد مستواك، ثم تدخل البوابة مباشرة دون أي دفع.</p>
</div>
<div style="padding:26px 32px 6px;direction:rtl;text-align:center;">
  <div style="background:linear-gradient(135deg,rgba(139,73,206,0.22),rgba(84,210,210,0.16));border:2px solid #8B49CE;border-radius:18px;padding:24px 22px;direction:rtl;text-align:center;">
    <p style="font-size:21px;font-weight:900;color:#FFFFFF;line-height:1.6;margin-bottom:10px;text-align:center;">حدّد مستواك لتفعيل الكورس</p>
    <p style="font-size:15px;color:#D2D2DC;font-weight:500;line-height:1.95;text-align:center;">إجاباتك في الاستبيان تحدّد مستواك في كورس الذكاء الاصطناعي:<br>
    <strong style="color:#7FE3E3;">مبتدئ</strong> / <strong style="color:#C4A6EE;">متوسط</strong> / <strong style="color:#F2C94C;">متقدم</strong></p>
  </div>
</div>
<div class="cta">
  <a href="${safe}" class="btn" style="font-size:18px;padding:18px 44px;">حدّد مستواي وفعّل الكورس</a>
  <p class="cta-note">إذا لم يعمل الزر، انسخ هذا الرابط في المتصفح:<br><a href="${safe}" style="color:#C4A6EE;">${safe}</a></p>
  <p class="cta-note">الرابط شخصي ويُستخدم مرة واحدة، وصالح 30 يوماً. لأي سؤال: support@coursi.ai</p>
</div>`;
  return emailShell({ body, footerReason: "تلقّيت هذا البريد لأنك اشتريت باقة الذكاء الاصطناعي + التداول من كورسي" });
}

export async function sendBundleActivationEmail(to: string, link: string): Promise<boolean> {
  const key = process.env["RESEND_API_KEY"];
  if (!key) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "كورسي <support@coursi.ai>",
        to: [to],
        subject: BUNDLE_ACTIVATION_SUBJECT,
        html: buildBundleActivationHtml(link),
        reply_to: "support@coursi.ai",
      }),
    });
    if (!res.ok) console.error("[bundle-activation] resend status", res.status);
    return res.ok;
  } catch {
    console.error("[bundle-activation] resend failed");
    return false;
  }
}
