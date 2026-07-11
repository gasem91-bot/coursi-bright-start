import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Real Stripe Price IDs → level + tier mapping
const PRICE_MAP: Record<string, { level: string; tier: string }> = {
  "price_1Ts2H2HNdqnRfyCHpMVU9XNH": { level: "beginner", tier: "course" },
  "price_1Ts2H6HNdqnRfyCHBKNFey1T": { level: "beginner", tier: "course_ai" },
  "price_1Ts2H4HNdqnRfyCHY1GhNcSD": { level: "intermediate", tier: "course" },
  "price_1Ts2H2HNdqnRfyCHROQqDS9c": { level: "intermediate", tier: "course_ai" },
  "price_1Ts2H6HNdqnRfyCHwBAvcaAH": { level: "advanced", tier: "course" },
  "price_1Ts2H2HNdqnRfyCH7YX3CJ6G": { level: "advanced", tier: "course_ai" },
};

const LEVEL_NAMES: Record<string, string> = {
  beginner: "أساسيات الذكاء الاصطناعي من الصفر",
  intermediate: "الذكاء الاصطناعي للمحترفين",
  advanced: "إتقان الذكاء الاصطناعي — بناء منتجات وأعمال",
};

const LEVEL_META: Record<string, string> = {
  beginner: "٨ فصول · ٤ أسابيع",
  intermediate: "١٠ فصول · ٦ أسابيع",
  advanced: "١٢ فصل · ٨ أسابيع",
};

const LEVEL_ARABIC: Record<string, string> = {
  beginner: "مبتدئ 🌱",
  intermediate: "متوسط 📈",
  advanced: "متقدم 🔥",
};

function buildWelcomeHtml(level: string, tier: string, loginLink: string): string {
  const courseName = LEVEL_NAMES[level] || LEVEL_NAMES.beginner;
  const courseMeta = LEVEL_META[level] || LEVEL_META.beginner;
  const levelArabic = LEVEL_ARABIC[level] || LEVEL_ARABIC.beginner;
  const tierText =
    tier === "course_ai"
      ? "<strong>باقة الكورس + مساعد AI</strong> — مساعد ذكي يجاوب على أسئلتك داخل كل درس"
      : "<strong>باقة الكورس</strong> — وصول كامل لجميع فصول مستواك";

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
.card{margin:28px 32px;background:linear-gradient(160deg,rgba(123,53,192,0.09),rgba(64,200,200,0.04));border:1px solid rgba(123,53,192,0.28);border-radius:18px;padding:24px;}
.card-label{font-size:11px;font-weight:700;color:#7B35C0;letter-spacing:2px;margin-bottom:12px;}
.card-name{font-size:19px;font-weight:900;color:#fff;margin-bottom:10px;}
.card-level{display:inline-block;background:rgba(61,214,160,0.1);border:1px solid rgba(61,214,160,0.3);color:#3DD6A0;font-size:12px;font-weight:700;padding:4px 14px;border-radius:20px;margin-bottom:14px;}
.card-meta{font-size:12px;color:#555;padding-bottom:14px;border-bottom:1px solid #1A1A1A;margin-bottom:14px;}
.tier-box{background:#111;border-radius:10px;padding:12px 16px;font-size:13px;color:#888;}
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
  <div class="badge">✦ رحلتك المهنية بدأت للتو</div>
  <h1>أهلاً بك في مجتمع<br><span>المتعلمين العرب الطموحين</span></h1>
  <div class="hero-sub">
    <p>لقد اتخذت القرار الأذكى اليوم.<br>
    كورسك جاهز، مسارك محدد، وفريق كورسي معك في كل خطوة.</p>
  </div>
</div>
<div class="card">
  <div class="card-label">✦ كورسك المخصص</div>
  <div class="card-name">${courseName}</div>
  <div class="card-level">${levelArabic}</div>
  <div class="card-meta">${courseMeta} · اختبار بعد كل فصل · شهادة إتمام</div>
  <div class="tier-box">${tierText}</div>
</div>
<div class="cta">
  <a href="${loginLink}" class="btn">ادخل لكورسك الآن ←</a>
  <p class="cta-note">
    الرابط صالح لمدة ٤٨ ساعة · لا تحتاج كلمة مرور في المرة الأولى<br>
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
    تلقّيت هذا البريد لأنك اشتركت في COURS! على coursi.ai<br>
    © 2025 COURS! · coursi.ai · جميع الحقوق محفوظة
  </div>
</div>
</div></div>
</body>
</html>`;
}

async function sendWelcomeEmail(
  email: string,
  level: string,
  tier: string,
  loginLink: string,
  resendApiKey: string,
): Promise<void> {
  const html = buildWelcomeHtml(level, tier, loginLink);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "كورسي <info@coursi.ai>",
      to: [email],
      subject: "مرحباً بك في كورسي! 🎉 كورسك جاهز",
      html,
    }),
  });
  if (!res.ok) {
    console.error("[stripe-webhook] Resend error:", res.status, await res.text());
  }
}

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        const supabaseUrl = process.env.OWN_SUPABASE_URL;
        const supabaseServiceRoleKey = process.env.OWN_SUPABASE_SERVICE_ROLE_KEY;
        const resendApiKey = process.env.RESEND_API_KEY;

        if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !supabaseServiceRoleKey || !resendApiKey) {
          console.error("[stripe-webhook] missing required env vars");
          return new Response("Server misconfigured", { status: 500 });
        }

        const signature = request.headers.get("stripe-signature");
        if (!signature) {
          return new Response("Missing signature", { status: 400 });
        }

        const body = await request.text();
        const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" as Stripe.LatestApiVersion });

        let event: Stripe.Event;
        try {
          event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
        } catch (err) {
          console.error("[stripe-webhook] signature verification failed:", err);
          return new Response("Invalid signature", { status: 400 });
        }

        if (event.type !== "checkout.session.completed") {
          return Response.json({ received: true });
        }

        const session = event.data.object as Stripe.Checkout.Session;
        const email = session.customer_email || session.customer_details?.email;
        if (!email) return new Response("No email", { status: 400 });

        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        const priceId = lineItems.data[0]?.price?.id || "";
        const { level, tier } = PRICE_MAP[priceId] || { level: "beginner", tier: "course" };

        const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });

        try {
          // 1. Find or create auth user in the OWN Supabase project
          let userId: string | undefined;
          const { data: existing } = await admin.auth.admin.listUsers();
          const found = existing?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
          if (found) {
            userId = found.id;
          } else {
            const { data: created, error: createErr } = await admin.auth.admin.createUser({
              email,
              email_confirm: true,
              user_metadata: { level, tier, segment: "ai" },
            });
            if (createErr) throw createErr;
            userId = created.user?.id;
          }
          if (!userId) throw new Error("no user id");

          // 2. Upsert profile
          const { error: profileErr } = await admin.from("profiles").upsert(
            {
              id: userId,
              email,
              level,
              segment: "ai",
            },
            { onConflict: "id" },
          );
          if (profileErr) console.error("[stripe-webhook] profile upsert error:", profileErr);

          // 3. Upsert subscription
          const { error: subErr } = await admin.from("subscriptions").upsert(
            {
              user_id: userId,
              level,
              tier,
              segment: "ai",
              status: "active",
              stripe_session_id: session.id,
              amount: session.amount_total ? session.amount_total / 100 : 0,
              currency: session.currency?.toUpperCase() || "USD",
            },
            { onConflict: "user_id" },
          );
          if (subErr) console.error("[stripe-webhook] subscription upsert error:", subErr);

          // 4. Generate magic link
          const { data: linkData } = await admin.auth.admin.generateLink({
            type: "magiclink",
            email,
            options: { redirectTo: "https://ai.portal.coursi.ai/dashboard" },
          });
          const loginLink =
            linkData?.properties?.action_link || "https://ai.portal.coursi.ai/login";

          // 5. Send welcome email
          await sendWelcomeEmail(email, level, tier, loginLink, resendApiKey);

          console.log(`[stripe-webhook] onboarded ${email} — ${level} ${tier}`);
          return Response.json({ success: true });
        } catch (err) {
          console.error("[stripe-webhook] processing error:", err);
          return new Response(JSON.stringify({ error: String(err) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
