import { emailShell } from "./email-shell.server";

export function buildAccountDeletedHtml(): string {
  const body = `<div class="hero">
  <h1>تم حذف حسابك</h1>
  <div class="hero-sub">
    <p>نؤكد لك أن حسابك وجميع بياناتك الشخصية حُذفت نهائياً من كورسي.<br>
    شكراً لأنك كنت جزءاً من رحلتنا، نتمنى لك التوفيق، وبابنا مفتوح دائماً إن أردت العودة.</p>
  </div>
</div>
<div class="cta">
  <a href="https://coursi.ai" class="btn">زيارة كورسي ←</a>
  <p class="cta-note">إذا لم تطلب هذا الحذف، تواصل معنا فوراً على support@coursi.ai</p>
</div>`;
  return emailShell({ body, footerReason: "تلقّيت هذا البريد لتأكيد حذف حسابك في كورسي" });
}

export async function sendAccountDeletedEmail(to: string): Promise<void> {
  const key = process.env["RESEND_API_KEY"];
  if (!key) return;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "كورسي <support@coursi.ai>",
        to: [to],
        subject: "تم حذف حسابك من كورسي",
        html: buildAccountDeletedHtml(),
        reply_to: "support@coursi.ai",
      }),
    });
    if (!res.ok) console.error("[account-deleted] resend:", res.status, await res.text());
  } catch (e) {
    console.error("[account-deleted] resend threw:", e);
  }
}

export function buildAccountPausedHtml(): string {
  const body = `<div class="hero">
  <h1>تم تعطيل حسابك مؤقتاً</h1>
  <div class="hero-sub">
    <p>حسابك في كورسي متوقف الآن، واحتفظنا بكل تقدمك وشهاداتك كما هي.<br>
    للعودة في أي وقت، سجّل الدخول ببريدك وأكّد إعادة التفعيل — وستجد كل شيء بانتظارك.</p>
  </div>
</div>
<div class="cta">
  <a href="https://ai.portal.coursi.ai/login" class="btn">العودة إلى كورسي ←</a>
  <p class="cta-note">إذا لم تطلب هذا، تواصل معنا على support@coursi.ai</p>
</div>`;
  return emailShell({ body, footerReason: "تلقّيت هذا البريد لتأكيد تعطيل حسابك في كورسي" });
}

export async function sendAccountPausedEmail(to: string): Promise<void> {
  const key = process.env["RESEND_API_KEY"];
  if (!key) return;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "كورسي <support@coursi.ai>",
        to: [to],
        subject: "تم تعطيل حسابك في كورسي مؤقتاً",
        html: buildAccountPausedHtml(),
        reply_to: "support@coursi.ai",
      }),
    });
    if (!res.ok) console.error("[account-paused] resend:", res.status, await res.text());
  } catch (e) {
    console.error("[account-paused] resend threw:", e);
  }
}
