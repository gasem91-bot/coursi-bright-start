// Shared branded email shell used by ALL COURS! emails
// (welcome, certificate, support ticket confirmation & notification).

// The only way to write the brand in email text.
export const BRAND_AR = "كورسي";

export const LOGO_URL =
  "https://ai.portal.coursi.ai/__l5e/assets-v1/4e70392d-96cd-4490-86e4-4e562039be12/coursi-logo.png";

export const EMAIL_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;700;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box;direction:rtl;unicode-bidi:isolate;}
body{font-family:'Noto Sans Arabic',Arial,sans-serif;background:#0A0A0A;color:#F2F2F5;direction:rtl;text-align:right;}
.wrap{background:#0A0A0A;padding:32px 16px;direction:rtl;text-align:right;}
.box{max-width:600px;margin:0 auto;background:#0D0D0D;border-radius:24px;overflow:hidden;border:1px solid #232323;direction:rtl;text-align:right;}
.hdr{background:linear-gradient(160deg,#0D0520,#110A24,#071520);padding:36px 40px 28px;text-align:center;border-bottom:1px solid rgba(146,86,214,0.28);}
.logo-img{display:block;margin:0 auto;width:170px;max-width:70%;height:auto;border:0;outline:none;text-decoration:none;}
.hdr-sub{font-size:12px;color:#9A9AA8;font-weight:600;letter-spacing:3px;margin-top:10px;}
.hero{padding:36px 40px 30px;text-align:center;direction:rtl;border-bottom:1px solid #1C1C1C;}
.badge{display:inline-block;background:rgba(146,86,214,0.14);border:1px solid rgba(146,86,214,0.42);color:#C4A6EE;font-size:12px;font-weight:700;padding:6px 18px;border-radius:20px;margin-bottom:18px;}
.badge-cyan{display:inline-block;background:rgba(96,214,214,0.14);border:1px solid rgba(96,214,214,0.42);color:#7FE3E3;font-size:12px;font-weight:700;padding:6px 18px;border-radius:20px;margin-bottom:18px;}
.hero h1{font-size:25px;font-weight:900;color:#FFFFFF;line-height:1.45;margin-bottom:15px;direction:rtl;text-align:center;}
.hero h1 span{color:#C4A6EE;}
.hero p{font-size:15px;color:#C9C9D4;font-weight:500;line-height:1.95;direction:rtl;text-align:center;}
.hero-sub{background:rgba(96,214,214,0.07);border:1px solid rgba(96,214,214,0.2);border-radius:14px;padding:16px 20px;direction:rtl;text-align:center;}
.hero-sub p{font-size:15px;color:#D2D2DC;font-weight:500;line-height:1.95;}
.card{margin:26px 32px;background:linear-gradient(160deg,rgba(146,86,214,0.11),rgba(96,214,214,0.05));border:1px solid rgba(146,86,214,0.34);border-radius:18px;padding:24px;direction:rtl;text-align:right;}
.card-center{text-align:center;}
.card-label{font-size:12px;font-weight:800;color:#B98FEA;letter-spacing:2px;margin-bottom:12px;}
.card-name{font-size:19px;font-weight:900;color:#FFFFFF;margin-bottom:10px;}
.card-level{display:inline-block;background:rgba(93,226,176,0.14);border:1px solid rgba(93,226,176,0.42);color:#7CEBC0;font-size:12px;font-weight:800;padding:4px 14px;border-radius:20px;margin-bottom:14px;}
.card-meta{font-size:13px;color:#B4B4C0;font-weight:600;padding-bottom:14px;border-bottom:1px solid #262626;margin-bottom:14px;}
.tier-box{background:#161616;border-radius:10px;padding:12px 16px;font-size:14px;color:#D2D2DC;font-weight:500;line-height:1.9;direction:rtl;text-align:right;}
.certid{background:#161616;border-radius:10px;padding:12px 16px;font-size:13px;color:#C9C9D4;font-weight:600;letter-spacing:1px;}
.row{font-size:14px;color:#C4C4D0;font-weight:600;padding:9px 0;border-bottom:1px solid #262626;direction:rtl;text-align:right;unicode-bidi:plaintext;}
.row:last-child{border-bottom:none;}
.row b{color:#FFFFFF;font-weight:800;}
.msg{margin-top:12px;background:#161616;border-radius:12px;padding:14px 16px;font-size:14px;color:#E2E2EA;font-weight:500;line-height:1.95;white-space:pre-wrap;direction:rtl;text-align:right;unicode-bidi:plaintext;}
.tid{display:inline-block;background:#161616;border-radius:10px;padding:10px 16px;font-size:14px;color:#7FE3E3;letter-spacing:1px;font-weight:800;unicode-bidi:plaintext;}
.cta{padding:28px 40px;text-align:center;border-top:1px solid #1C1C1C;direction:rtl;}
.btn{display:inline-block;background:linear-gradient(135deg,#8B49CE,#54D2D2);color:#fff!important;text-decoration:none;font-size:16px;font-weight:900;padding:16px 52px;border-radius:50px;box-shadow:0 8px 32px rgba(139,73,206,0.4);}
.cta-note{margin-top:14px;font-size:13px;color:#A2A2B0;font-weight:500;line-height:1.85;direction:rtl;text-align:center;}
.footer{background:#080808;border-top:1px solid #1C1C1C;padding:26px 32px;text-align:center;direction:rtl;}
.footer-logo{display:block;margin:0 auto 8px;width:96px;max-width:45%;height:auto;border:0;outline:none;}
.footer-tag{font-size:12px;color:#8F8F9C;font-weight:600;font-style:italic;margin-bottom:14px;}
.srow{margin-bottom:14px;}
.sbtn{display:inline-block;border-radius:8px;background:#161616;border:1px solid #2A2A2A;margin:0 3px;text-decoration:none;font-size:11px;font-weight:700;padding:6px 11px;}
.fdiv{width:32px;height:1px;background:linear-gradient(90deg,#8B49CE,#54D2D2);margin:14px auto;}
.flinks{margin-bottom:12px;}
.flink{color:#9A9AA8;text-decoration:none;font-size:12px;font-weight:600;margin:0 6px;}
.fcopy{font-size:11px;color:#7C7C88;line-height:1.85;}
`;

export function emailHeader(subtitle = `${BRAND_AR} · coursi.ai`): string {
  return `<div class="hdr">
  <img src="${LOGO_URL}" alt="${BRAND_AR}" width="170" class="logo-img" />
  <div class="hdr-sub">${subtitle}</div>
</div>`;
}

export function emailFooter(reasonLine: string): string {
  reasonLine = reasonLine.replace(/COURS!|COURSI(?![\w.-])/g, BRAND_AR);
  return `<div class="footer">
  <img src="${LOGO_URL}" alt="${BRAND_AR}" width="96" class="footer-logo" />
  <div class="footer-tag">لا تتعلّم فقط. تطوّر.</div>
  <div class="srow">
    <a href="https://www.youtube.com/@COURSI_AI" class="sbtn"><span style="color:#FF7A7A;">YouTube</span></a>
    <a href="https://www.instagram.com/coursi.ai" class="sbtn"><span style="color:#F080AE;">Instagram</span></a>
    <a href="https://www.tiktok.com/@coursi.ai" class="sbtn"><span style="color:#E4E4EC;">TikTok</span></a>
    <a href="https://www.facebook.com/coursi.ai" class="sbtn"><span style="color:#7FB5F0;">Facebook</span></a>
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
    © 2026 ${BRAND_AR} · coursi.ai · جميع الحقوق محفوظة
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
