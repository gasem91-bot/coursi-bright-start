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
