// Referral program email — announces the referral program to an existing
// student and gives them their referral link to share.
//
// NOT WIRED UP YET: the referral link/code, tracking of who referred whom,
// the per-account wallet that holds the referrer's $2-per-referral credit,
// and the $5 discount applied to the referred signup all still need to be
// built (see cours-next-actions memory, 28 Sep spec) before this can be sent
// for real. This file only builds the HTML with a placeholder referral link,
// so the template is ready the moment that system exists.

import { emailShell } from "./email-shell.server";

export const REFERRAL_INVITE_SUBJECT = "شارك كورسي مع صديق واكسب رصيد 💰";

export function buildReferralInviteHtml(params: {
  userName?: string;
  referralLink: string;
}): string {
  const { userName, referralLink } = params;
  const greeting = userName ? `يا ${userName}` : "";

  const body = `<div class="hero">
  <div class="badge">💰 برنامج الإحالة</div>
  <h1>شارك كورسي ${greeting}<br><span>واكسب رصيد في محفظتك</span></h1>
  <div class="hero-sub">
    <p>عجبك كورسي؟ شارك رابطك الخاص مع أصدقائك<br>
    كل ما يشترك صديق عن طريقك، ترصّد فلوس في محفظتك داخل الحساب</p>
  </div>
</div>

<div class="card" dir="rtl">
  <div class="card-label">✦ كيف تشتغل الإحالة</div>
  <div class="row" dir="rtl">أنت تكسب: <b style="color:#7CEBC0;">2$ رصيد</b> في محفظتك عن كل صديق يشترك عن طريق رابطك</div>
  <div class="row" dir="rtl">صديقك يكسب: <b style="color:#7FE3E3;">خصم 5$</b> على أول اشتراك له</div>
  <div class="row" dir="rtl">ما في حد أقصى — كل ما تشارك أكثر، ترصّد أكثر</div>
</div>

<div class="cta">
  <a href="${referralLink}" class="btn">شارك رابطك الآن ←</a>
  <p class="cta-note">
    رابطك الخاص لمشاركته مع أصدقائك<br>
    <span style="color:#7FE3E3;word-break:break-all;unicode-bidi:plaintext;">${referralLink}</span>
  </p>
</div>`;

  return emailShell({
    body,
    footerReason: "تلقّيت هذا البريد لأنك مشترك في كورسي على coursi.ai",
  });
}
