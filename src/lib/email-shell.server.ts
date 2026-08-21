// Shared branded email shell used by ALL COURS! emails
// (welcome, certificate, support ticket confirmation & notification).

export const LOGO_URL =
  "https://ai.portal.coursi.ai/__l5e/assets-v1/4e70392d-96cd-4490-86e4-4e562039be12/coursi-logo.png";

export const EMAIL_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;700;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Noto Sans Arabic',Arial,sans-serif;background:#0A0A0A;color:#fff;direction:rtl;}
.wrap{background:#0A0A0A;padding:32px 16px;}
.box{max-width:600px;margin:0 auto;background:#0D0D0D;border-radius:24px;overflow:hidden;border:1px solid #1E1E1E;}
.hdr{background:linear-gradient(160deg,#0D0520,#110A24,#071520);padding:36px 40px 28px;text-align:center;border-bottom:1px solid rgba(123,53,192,0.2);}
.logo-img{display:block;margin:0 auto;width:170px;max-width:70%;height:auto;border:0;outline:none;text-decoration:none;}
.hdr-sub{font-size:11px;color:#555;letter-spacing:3px;margin-top:10px;}
.hero{padding:36px 40px 30px;text-align:center;border-bottom:1px solid #141414;}
.badge{display:inline-block;background:rgba(123,53,192,0.1);border:1px solid rgba(123,53,192,0.3);color:#9B6ED4;font-size:12px;font-weight:600;padding:6px 18px;border-radius:20px;margin-bottom:18px;}
.badge-cyan{display:inline-block;background:rgba(64,200,200,0.1);border:1px solid rgba(64,200,200,0.3);color:#40C8C8;font-size:12px;font-weight:600;padding:6px 18px;border-radius:20px;margin-bottom:18px;}
.hero h1{font-size:25px;font-weight:900;color:#fff;line-height:1.45;margin-bottom:15px;}
.hero h1 span{color:#9B6ED4;}
.hero p{font-size:14px;color:#888;line-height:1.9;}
.hero-sub{background:rgba(64,200,200,0.05);border:1px solid rgba(64,200,200,0.12);border-radius:14px;padding:16px 20px;}
.hero-sub p{font-size:14px;color:#888;line-height:1.9;}
.card{margin:26px 32px;background:linear-gradient(160deg,rgba(123,53,192,0.09),rgba(64,200,200,0.04));border:1px solid rgba(123,53,192,0.28);border-radius:18px;padding:24px;}
.card-center{text-align:center;}
.card-label{font-size:11px;font-weight:700;color:#7B35C0;letter-spacing:2px;margin-bottom:12px;}
.card-name{font-size:19px;font-weight:900;color:#fff;margin-bottom:10px;}
.card-level{display:inline-block;background:rgba(61,214,160,0.1);border:1px solid rgba(61,214,160,0.3);color:#3DD6A0;font-size:12px;font-weight:700;padding:4px 14px;border-radius:20px;margin-bottom:14px;}
.card-meta{font-size:12px;color:#555;padding-bottom:14px;border-bottom:1px solid #1A1A1A;margin-bottom:14px;}
.tier-box{background:#111;border-radius:10px;padding:12px 16px;font-size:13px;color:#888;}
.certid{background:#111;border-radius:10px;padding:12px 16px;font-size:12px;color:#888;letter-spacing:1px;}
.row{font-size:13px;color:#888;padding:8px 0;border-bottom:1px solid #1A1A1A;}
.row:last-child{border-bottom:none;}
.row b{color:#fff;font-weight:700;}
.msg{margin-top:12px;background:#111;border-radius:12px;padding:14px 16px;font-size:13px;color:#bbb;line-height:1.9;white-space:pre-wrap;}
.tid{display:inline-block;background:#111;border-radius:10px;padding:10px 16px;font-size:13px;color:#40C8C8;letter-spacing:1px;font-weight:700;}
.cta{padding:28px 40px;text-align:center;border-top:1px solid #141414;}
.btn{display:inline-block;background:linear-gradient(135deg,#7B35C0,#40C8C8);color:#fff!important;text-decoration:none;font-size:16px;font-weight:900;padding:16px 52px;border-radius:50px;box-shadow:0 8px 32px rgba(123,53,192,0.45);}
.cta-note{margin-top:14px;font-size:12px;color:#444;line-height:1.8;}
.footer{background:#080808;border-top:1px solid #141414;padding:26px 32px;text-align:center;}
.footer-logo{display:block;margin:0 auto 8px;width:96px;max-width:45%;height:auto;border:0;outline:none;}
.footer-tag{font-size:11px;color:#3A3A3A;font-style:italic;margin-bottom:14px;}
.srow{margin-bottom:14px;}
.sbtn{display:inline-block;border-radius:8px;background:#111;border:1px solid #1E1E1E;margin:0 3px;text-decoration:none;font-size:11px;font-weight:700;padding:6px 11px;}
.fdiv{width:32px;height:1px;background:linear-gradient(90deg,#7B35C0,#40C8C8);margin:14px auto;}
.flinks{margin-bottom:12px;}
.flink{color:#3A3A3A;text-decoration:none;font-size:11px;margin:0 6px;}
.fcopy{font-size:10px;color:#222;line-height:1.8;}
`;

export function emailHeader(subtitle = "كورسي · coursi.ai"): string {
  return `<div class="hdr">
  <img src="${LOGO_URL}" alt="COURS!" width="170" class="logo-img" />
  <div class="hdr-sub">${subtitle}</div>
</div>`;
}

export function emailFooter(reasonLine: string): string {
  return `<div class="footer">
  <img src="${LOGO_URL}" alt="COURS!" width="96" class="footer-logo" />
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
    ${reasonLine}<br>
    © 2026 COURS! · coursi.ai · جميع الحقوق محفوظة
  </div>
</div>`;
}

export function emailShell(params: {
  body: string;
  headerSubtitle?: string;
  footerReason: string;
}): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>${EMAIL_STYLES}</style>
</head>
<body>
<div class="wrap"><div class="box">
${emailHeader(params.headerSubtitle)}
${params.body}
${emailFooter(params.footerReason)}
</div></div>
</body>
</html>`;
}
