// Branded completion-certificate email — uses the shared COURS! email shell.

import { emailShell } from "./email-shell.server";

export function buildCertificateHtml(params: {
  userName: string;
  courseName: string;
  levelLabel: string;
  certId: string;
  dateText: string;
  link: string;
}): string {
  const { userName, courseName, levelLabel, certId, dateText, link } = params;
  const body = `<div class="hero">
  <div class="badge">🏆 إنجاز جديد</div>
  <h1>مبروك ${userName}!<br><span>أكملت ${levelLabel}</span></h1>
  <div class="hero-sub">
    <p>أنهيت جميع فصول مستواك واجتزت اختباراته<br>
    شهادة الإتمام الخاصة بك جاهزة للتحميل الآن من بوابة كورسي</p>
  </div>
</div>
<div class="card card-center">
  <div class="card-label">✦ شهادة إتمام</div>
  <div class="card-name">${courseName}</div>
  <div class="card-level">${levelLabel}</div>
  <div class="card-meta">تاريخ الإتمام: ${dateText}</div>
  <div class="certid">رقم الشهادة: ${certId}</div>
</div>
<div class="cta">
  <a href="${link}" class="btn">حمّل شهادتك ←</a>
  <p class="cta-note">
    افتح صفحة الإنجازات في البوابة وحمّل الشهادة بصيغة PDF أو صورة<br>
    <span style="color:#2A2A2A;">إذا لم يفتح الرابط، انسخه وضعه في متصفحك</span>
  </p>
</div>`;
  return emailShell({
    body,
    footerReason: "تلقّيت هذا البريد لأنك أكملت مستوى في كورسي على coursi.ai",
  });
}
