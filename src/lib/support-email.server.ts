// Branded support-ticket emails (matches the welcome/certificate email look & feel).

const SHELL_HEAD = `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;700;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Noto Sans Arabic',Arial,sans-serif;background:#0A0A0A;color:#fff;direction:rtl;}
.wrap{background:#0A0A0A;padding:32px 16px;}
.box{max-width:600px;margin:0 auto;background:#0D0D0D;border-radius:24px;overflow:hidden;border:1px solid #1E1E1E;}
.hdr{background:linear-gradient(160deg,#0D0520,#110A24,#071520);padding:40px 40px 32px;text-align:center;border-bottom:1px solid rgba(123,53,192,0.2);}
.logo{font-size:38px;font-weight:900;background:linear-gradient(135deg,#7B35C0,#40C8C8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-family:'Inter','Helvetica Neue',Arial,sans-serif;}
.hero{padding:36px 40px 28px;text-align:center;border-bottom:1px solid #141414;}
.badge{display:inline-block;background:rgba(64,200,200,0.1);border:1px solid rgba(64,200,200,0.3);color:#40C8C8;font-size:12px;font-weight:600;padding:6px 18px;border-radius:20px;margin-bottom:18px;}
.hero h1{font-size:24px;font-weight:900;color:#fff;line-height:1.5;margin-bottom:14px;}
.hero h1 span{background:linear-gradient(135deg,#7B35C0,#40C8C8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.hero p{font-size:14px;color:#888;line-height:1.9;}
.card{margin:26px 32px;background:linear-gradient(160deg,rgba(123,53,192,0.09),rgba(64,200,200,0.04));border:1px solid rgba(123,53,192,0.28);border-radius:18px;padding:22px;}
.row{font-size:13px;color:#888;padding:8px 0;border-bottom:1px solid #1A1A1A;}
.row:last-child{border-bottom:none;}
.row b{color:#fff;font-weight:700;}
.msg{margin-top:12px;background:#111;border-radius:12px;padding:14px 16px;font-size:13px;color:#bbb;line-height:1.9;white-space:pre-wrap;}
.tid{display:inline-block;background:#111;border-radius:10px;padding:10px 16px;font-size:13px;color:#40C8C8;letter-spacing:1px;font-weight:700;}
.footer{background:#080808;border-top:1px solid #141414;padding:26px 32px;text-align:center;}
.footer-brand{font-size:16px;font-weight:900;background:linear-gradient(135deg,#7B35C0,#40C8C8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;display:inline-block;margin-bottom:4px;}
.footer-tag{font-size:11px;color:#3A3A3A;font-style:italic;margin-bottom:12px;}
.fcopy{font-size:10px;color:#222;line-height:1.8;}
</style>`;

const FOOTER = `<div class="footer">
  <div class="footer-brand">COURS!</div><br>
  <div class="footer-tag">لا تتعلّم فقط. تطوّر.</div>
  <div class="fcopy">© 2026 COURS! · coursi.ai · جميع الحقوق محفوظة</div>
</div>`;

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
  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head>${SHELL_HEAD}</head><body>
<div class="wrap"><div class="box">
<div class="hdr"><div class="logo">COURS!</div>
<div style="font-size:11px;color:#555;letter-spacing:3px;margin-top:6px;">كورسي · coursi.ai</div></div>
<div class="hero">
  <div class="badge">🎧 الدعم الفني</div>
  <h1>استلمنا طلبك <span>${esc(t.name)}</span></h1>
  <p>شكراً لتواصلك مع فريق كورسي. تم تسجيل تذكرتك وسيتواصل معك الفريق قريباً على بريدك الإلكتروني.</p>
  <div style="margin-top:16px;"><span class="tid">رقم التذكرة: ${esc(t.ticketRef)}</span></div>
</div>
<div class="card">
  <div class="row">التصنيف: <b>${esc(t.categoryLabel)}</b></div>
  <div class="row">تاريخ الإرسال: <b>${esc(t.dateText)}</b></div>
  <div class="row">البريد: <b>${esc(t.email)}</b></div>
  <div class="msg">${esc(t.message)}</div>
</div>
${FOOTER}
</div></div></body></html>`;
}

export function buildTicketSupportHtml(t: TicketEmailData): string {
  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head>${SHELL_HEAD}</head><body>
<div class="wrap"><div class="box">
<div class="hdr"><div class="logo">COURS!</div>
<div style="font-size:11px;color:#555;letter-spacing:3px;margin-top:6px;">تذكرة دعم جديدة</div></div>
<div class="hero">
  <div class="badge">🆕 تذكرة جديدة</div>
  <h1><span>${esc(t.ticketRef)}</span></h1>
  <p>وردت تذكرة دعم جديدة من مستخدم في البوابة.</p>
</div>
<div class="card">
  <div class="row">الاسم: <b>${esc(t.name)}</b></div>
  <div class="row">البريد: <b>${esc(t.email)}</b></div>
  <div class="row">التصنيف: <b>${esc(t.categoryLabel)}</b></div>
  <div class="row">التاريخ: <b>${esc(t.dateText)}</b></div>
  <div class="msg">${esc(t.message)}</div>
</div>
${FOOTER}
</div></div></body></html>`;
}
