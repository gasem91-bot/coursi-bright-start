import { emailShell } from "./email-shell.server";

// Referral emails use general كورسي branding only: no per-course name or theme.
export const BRAND_LOGO = "https://ai.portal.coursi.ai/__l5e/assets-v1/4e70392d-96cd-4490-86e4-4e562039be12/coursi-logo.png?v=arabic-wordmark-20261003";
export const REFERRAL_NOTE = "إذا كان هناك عرض جارٍ، يمكنك اختيار العرض أو كود الدعوة، ولا يُجمع الاثنان معاً";
export const REFERRER_REWARD_SUBJECT = "تمت إضافة 5$ إلى محفظتك في كورسي";
export const FRIENDS_LINK = "https://ai.portal.coursi.ai/profile#referrals";
export const WALLET_LINK = "https://ai.portal.coursi.ai/profile#wallet";
export function referralInviteSubject(name: string) { return `${name} دعاك للانضمام إلى كورسي، وخصم 5$ بانتظارك`; }
export function friendJoinedSubject(friendName: string) { return `${friendName} أصبح في قائمة أصدقائك على كورسي`; }

function escape(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}
function safeLink(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || !["coursi.ai", "ai.portal.coursi.ai", "buy.stripe.com"].includes(url.hostname)) throw new Error("Invalid referral purchase link");
  if (url.searchParams.has("prefilled_promo_code")) throw new Error("Referral codes must not be prefilled");
  return escape(url.href);
}
export function displayHost(value: string) { const host = new URL(value).hostname; return host === "buy.stripe.com" ? "coursi.ai" : host; }
function money(value: number) { return `${Number.isInteger(value) ? value : value.toFixed(2)}$`; }
function shell(p: { title: string; text: string; code?: string; button: string; link: string; note?: string }) {
  const href = safeLink(p.link);
  const code = p.code ? `<p dir="ltr" style="text-align:center;margin:12px auto;padding:10px 14px;max-width:100%;box-sizing:border-box;border-radius:10px;background:rgba(255,255,255,0.08);border:1px dashed rgba(255,255,255,0.35);font-family:'Courier New',Courier,monospace;font-size:15px;line-height:1.4;font-weight:700;letter-spacing:0.5px;word-break:break-all;overflow-wrap:anywhere;user-select:all;-webkit-user-select:all;unicode-bidi:isolate">${escape(p.code)}</p>` : "";
  const note = p.note ? `<p class="cta-note">${p.note}</p>` : "";
  return emailShell({
    body: `<div class="hero" dir="rtl"><h1>${p.title}</h1><p>${p.text}</p>${code}</div><div class="cta" dir="rtl"><a class="btn" href="${href}">${p.button}</a>${note}<p class="cta-note"><a class="flink" href="${href}">${escape(displayHost(p.link))}</a></p></div>`,
    headerSubtitle: "كورسي",
    headerLogo: BRAND_LOGO,
    footerReason: "تلقّيت هذا البريد بخصوص دعوتك في كورسي.",
  });
}
export function buildFriendInviteHtml(p: { referrerName: string; friendCode: string; purchaseLink: string }) {
  return shell({ title: "دعوة إلى كورسي", text: "مرحباً، صديقك يدعوك لتجربة كورسي، منصة تعلّم الذكاء الاصطناعي بالعربية. هذا كود خصم 5$ لك، صالح 90 يوماً:", code: p.friendCode, button: "ابدأ الآن", link: p.purchaseLink, note: REFERRAL_NOTE });
}
export function buildFriendJoinedHtml(p: { firstName: string; friendFirstName: string }) {
  return shell({ title: friendJoinedSubject(escape(p.friendFirstName)), text: `أهلاً ${escape(p.firstName)}، ${escape(p.friendFirstName)} سجّل في كورسي عبر دعوتك وأصبح الآن في قائمة أصدقائك. استمتعا بالتعلم معاً. وعندما يُكمل أول عملية شراء، يُضاف 5$ إلى محفظتك`, button: "قائمة أصدقائي", link: FRIENDS_LINK });
}
export function buildReferrerRewardHtml(p: { firstName: string; friendFirstName: string; rewardCode: string; expiryDate: string; balance: number }) {
  return shell({ title: REFERRER_REWARD_SUBJECT, text: `أهلاً ${escape(p.firstName)}، ${escape(p.friendFirstName)} أكمل أول عملية شراء في كورسي عبر دعوتك. أضفنا 5$ إلى محفظتك، ورصيدك الحالي ${money(p.balance)}. كود الخصم أدناه صالح حتى ${escape(p.expiryDate)}، ويُستخدم مرة واحدة عند الدفع في أي دورة أو ترقية`, code: p.rewardCode, button: "افتح محفظتي", link: WALLET_LINK, note: REFERRAL_NOTE });
}

export async function sendReferralEmail(p: { to: string; subject: string; html: string; eventKey: string }, key: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("do_not_contact").select("email").eq("email", p.to.trim().toLowerCase()).maybeSingle();
  if (error) throw error;
  if (data) return;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": p.eventKey },
    body: JSON.stringify({ from: "كورسي <support@coursi.ai>", to: [p.to], subject: p.subject, html: p.html }),
  });
  if (!response.ok) throw new Error(`Referral email failed (${response.status})`);
}
