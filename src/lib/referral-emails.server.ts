import { emailShell } from "./email-shell.server";

export const REFERRAL_NOTE = "إذا كان هناك عرض جارٍ، يمكنك اختيار العرض أو كود الدعوة، ولا يُجمع الاثنان معاً";
export const FRIEND_DISCOUNT_SUBJECT = "خصم الدعوة 5$ جاهز لك";
export const REFERRER_REWARD_SUBJECT = "اشترى صديقك عبر دعوتك، وخصمك 5$ جاهز";
export function referralInviteSubject(name: string) { return `${name} دعاك للانضمام إلى كورسي، وخصم 5$ بانتظارك`; }

function escape(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}
function safeLink(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || !["coursi.ai", "ai.portal.coursi.ai", "buy.stripe.com"].includes(url.hostname)) throw new Error("Invalid referral purchase link");
  if (url.searchParams.has("prefilled_promo_code")) throw new Error("Referral codes must not be prefilled");
  return escape(url.href);
}
function shell(title: string, text: string, code: string, button: string, link: string) {
  const href = safeLink(link);
  return emailShell({
    body: `<div class="hero" dir="rtl"><h1>${title}</h1><p>${text}</p><p dir="ltr" style="text-align:center;font-size:24px;font-weight:900;unicode-bidi:isolate">${escape(code)}</p></div><div class="cta" dir="rtl"><a class="btn" href="${href}">${button}</a><p class="cta-note">${REFERRAL_NOTE}</p><p class="cta-note"><a class="flink" href="${href}">${href}</a></p></div>`,
    footerReason: "تلقّيت هذا البريد بخصوص دعوتك في كورسي.",
  });
}
export function buildFriendInviteHtml(p: { referrerName: string; friendCode: string; purchaseLink: string }) {
  return shell("دعوة إلى كورسي", `مرحباً، ${escape(p.referrerName)} يدعوك لتجربة كورسي، منصة تعلّم الذكاء الاصطناعي بالعربية. هذا كود خصم 5$ لك، صالح 90 يوماً: ${escape(p.friendCode)}`, p.friendCode, "ابدأ الآن", p.purchaseLink);
}
export function buildFriendDiscountHtml(p: { firstName: string; referrerName: string; friendCode: string; expiryDate: string; purchaseLink: string }) {
  return shell("خصم الدعوة 5$ جاهز لك", `أهلاً ${escape(p.firstName)}، انضممت إلى كورسي بدعوة من ${escape(p.referrerName)}. هذا كود خصم 5$ لك: ${escape(p.friendCode)}، صالح حتى ${escape(p.expiryDate)}، ويُستخدم مرة واحدة عند الدفع`, p.friendCode, "ابدأ التعلّم", p.purchaseLink);
}
export function buildReferrerRewardHtml(p: { firstName: string; friendFirstName: string; rewardCode: string; expiryDate: string; purchaseLink: string }) {
  return shell(REFERRER_REWARD_SUBJECT, `أهلاً ${escape(p.firstName)}، ${escape(p.friendFirstName)} انضم إلى كورسي عبر دعوتك وأكمل عملية الشراء. شكراً لك، هذا كود خصم 5$ لمشترياتك القادمة: ${escape(p.rewardCode)}، صالح حتى ${escape(p.expiryDate)}، ويُستخدم مرة واحدة عند الدفع في أي دورة أو ترقية`, p.rewardCode, "استخدم الخصم", p.purchaseLink);
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