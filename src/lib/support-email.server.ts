// Branded support-ticket emails — uses the shared COURS! email shell.

import { emailShell } from "./email-shell.server";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export interface TicketEmailData {
  ticketRef: string;
  categoryLabel: string;
  message: string;
  name: string;
  email: string;
  dateText: string;
}

export function buildTicketUserHtml(t: TicketEmailData): string {
  const body = `<div class="hero">
  <div class="badge-cyan">🎧 الدعم الفني</div>
  <h1>استلمنا طلبك <span>${esc(t.name)}</span></h1>
  <p>شكراً لتواصلك مع فريق كورسي — تم تسجيل تذكرتك وسيتواصل معك الفريق قريباً على بريدك الإلكتروني</p>
  <div style="margin-top:16px;"><span class="tid">رقم التذكرة: ${esc(t.ticketRef)}</span></div>
</div>
<div class="card" dir="rtl">
  <div class="row" dir="rtl">التصنيف: <b>${esc(t.categoryLabel)}</b></div>
  <div class="row" dir="rtl">تاريخ الإرسال: <b>${esc(t.dateText)}</b></div>
  <div class="row" dir="rtl">البريد: <b>${esc(t.email)}</b></div>
  <div class="msg" dir="rtl">${esc(t.message)}</div>
</div>
<div class="cta">
  <a href="https://ai.portal.coursi.ai/support" class="btn">تابع تذكرتك ←</a>
  <p class="cta-note">يمكنك متابعة حالة جميع تذاكرك من صفحة الدعم في البوابة</p>
</div>`;
  return emailShell({
    body,
    footerReason: "تلقّيت هذا البريد لأنك أرسلت طلب دعم في كورسي على coursi.ai",
  });
}

export function buildTicketSupportHtml(t: TicketEmailData): string {
  const body = `<div class="hero">
  <div class="badge">🆕 تذكرة دعم جديدة</div>
  <h1><span>${esc(t.ticketRef)}</span></h1>
  <p>وردت تذكرة دعم جديدة من مستخدم في البوابة</p>
</div>
<div class="card" dir="rtl">
  <div class="row" dir="rtl">الاسم: <b>${esc(t.name)}</b></div>
  <div class="row" dir="rtl">البريد: <b>${esc(t.email)}</b></div>
  <div class="row" dir="rtl">التصنيف: <b>${esc(t.categoryLabel)}</b></div>
  <div class="row" dir="rtl">التاريخ: <b>${esc(t.dateText)}</b></div>
  <div class="msg" dir="rtl">${esc(t.message)}</div>
</div>`;
  return emailShell({
    body,
    headerSubtitle: "تذكرة دعم جديدة",
    footerReason: "إشعار داخلي لفريق دعم كورسي",
  });
}
