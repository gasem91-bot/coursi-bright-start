// Branded completion-certificate email (matches the welcome email look & feel).

export function buildCertificateHtml(params: {
  userName: string;
  courseName: string;
  levelLabel: string;
  certId: string;
  dateText: string;
  link: string;
}): string {
  const { userName, courseName, levelLabel, certId, dateText, link } = params;
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;700;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Noto Sans Arabic',Arial,sans-serif;background:#0A0A0A;color:#fff;direction:rtl;}
.wrap{background:#0A0A0A;padding:32px 16px;}
.box{max-width:600px;margin:0 auto;background:#0D0D0D;border-radius:24px;overflow:hidden;border:1px solid #1E1E1E;}
.hdr{background:linear-gradient(160deg,#0D0520,#110A24,#071520);padding:40px 40px 32px;text-align:center;border-bottom:1px solid rgba(123,53,192,0.2);}
.logo{font-size:38px;font-weight:900;background:linear-gradient(135deg,#7B35C0,#40C8C8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-family:'Inter','Helvetica Neue',Arial,sans-serif;}
.hero{padding:40px 40px 32px;text-align:center;border-bottom:1px solid #141414;}
.badge{display:inline-block;background:rgba(123,53,192,0.1);border:1px solid rgba(123,53,192,0.3);color:#9B6ED4;font-size:12px;font-weight:600;padding:6px 18px;border-radius:20px;margin-bottom:20px;}
.hero h1{font-size:26px;font-weight:900;color:#fff;line-height:1.4;margin-bottom:16px;}
.hero h1 span{background:linear-gradient(135deg,#7B35C0,#40C8C8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.hero-sub{background:rgba(64,200,200,0.05);border:1px solid rgba(64,200,200,0.12);border-radius:14px;padding:16px 20px;}
.hero-sub p{font-size:14px;color:#888;line-height:1.9;}
.card{margin:28px 32px;background:linear-gradient(160deg,rgba(123,53,192,0.09),rgba(64,200,200,0.04));border:1px solid rgba(123,53,192,0.28);border-radius:18px;padding:24px;text-align:center;}
.card-label{font-size:11px;font-weight:700;color:#7B35C0;letter-spacing:2px;margin-bottom:12px;}
.card-name{font-size:19px;font-weight:900;color:#fff;margin-bottom:10px;}
.card-level{display:inline-block;background:rgba(61,214,160,0.1);border:1px solid rgba(61,214,160,0.3);color:#3DD6A0;font-size:12px;font-weight:700;padding:4px 14px;border-radius:20px;margin-bottom:14px;}
.card-meta{font-size:12px;color:#555;padding-bottom:14px;border-bottom:1px solid #1A1A1A;margin-bottom:14px;}
.certid{background:#111;border-radius:10px;padding:12px 16px;font-size:12px;color:#888;letter-spacing:1px;}
.cta{padding:28px 40px;text-align:center;border-top:1px solid #141414;}
.btn{display:inline-block;background:linear-gradient(135deg,#7B35C0,#40C8C8);color:#fff!important;text-decoration:none;font-size:16px;font-weight:900;padding:16px 52px;border-radius:50px;box-shadow:0 8px 32px rgba(123,53,192,0.45);}
.cta-note{margin-top:14px;font-size:12px;color:#444;line-height:1.8;}
.footer{background:#080808;border-top:1px solid #141414;padding:28px 32px;text-align:center;}
.footer-brand{font-size:16px;font-weight:900;background:linear-gradient(135deg,#7B35C0,#40C8C8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;display:inline-block;margin-bottom:4px;}
.footer-tag{font-size:11px;color:#3A3A3A;font-style:italic;margin-bottom:14px;}
.srow{margin-bottom:14px;}
.sbtn{display:inline-block;border-radius:8px;background:#111;border:1px solid #1E1E1E;margin:0 3px;text-decoration:none;font-size:11px;font-weight:700;padding:6px 11px;}
.fdiv{width:32px;height:1px;background:linear-gradient(90deg,#7B35C0,#40C8C8);margin:14px auto;}
.flinks{margin-bottom:12px;}
.flink{color:#3A3A3A;text-decoration:none;font-size:11px;margin:0 6px;}
.fcopy{font-size:10px;color:#222;line-height:1.8;}
</style>
</head>
<body>
<div class="wrap"><div class="box">
<div class="hdr">
  <div class="logo">COURS!</div>
  <div style="font-size:11px;color:#555;letter-spacing:3px;margin-top:6px;">كورسي · coursi.ai</div>
</div>
<div class="hero">
  <div class="badge">🏆 إنجاز جديد</div>
  <h1>مبروك ${userName}!<br><span>أكملت ${levelLabel}</span></h1>
  <div class="hero-sub">
    <p>أنهيت جميع فصول مستواك واجتزت اختباراته.<br>
    شهادة الإتمام الخاصة بك جاهزة للتحميل الآن من بوابة كورسي.</p>
  </div>
</div>
<div class="card">
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
</div>
<div class="footer">
  <div class="footer-brand">COURS!</div><br>
  <div class="footer-tag">لا تتعلّم فقط. تطوّر.</div>
  <div class="srow">
    <a href="https://www.youtube.com/@COURSI_AI" class="sbtn"><span style="color:#ff4444;">YouTube</span></a>
    <a href="https://www.instagram.com/coursi.ai" class="sbtn"><span style="color:#e1306c;">Instagram</span></a>
    <a href="https://www.tiktok.com/@coursi.ai" class="sbtn"><span style="color:#ccc;">TikTok</span></a>
    <a href="https://www.facebook.com/coursi.ai" class="sbtn"><span style="color:#1877F2;">Facebook</span></a>
  </div>
  <div class="fdiv"></div>
  <div class="flinks">
    <a href="https://coursi.ai" class="flink">الرئيسية</a>
    <a href="https://ai.portal.coursi.ai/login" class="flink">البوابة</a>
    <a href="https://terms.coursi.ai" class="flink">الشروط والأحكام</a>
    <a href="mailto:info@coursi.ai" class="flink">تواصل معنا</a>
  </div>
  <div class="fcopy">
    تلقّيت هذا البريد لأنك أكملت مستوى في COURS! على coursi.ai<br>
    © 2025 COURS! · coursi.ai · جميع الحقوق محفوظة
  </div>
</div>
</div></div>
</body>
</html>`;
}
