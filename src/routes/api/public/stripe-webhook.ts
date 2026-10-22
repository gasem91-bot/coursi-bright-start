import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

import { fulfillCheckout } from "@/lib/stripe-fulfillment.server";

async function sendWelcomeEmail(
  email: string,
  level: string,
  tier: string,
  loginLink: string,
  resendApiKey: string,
): Promise<void> {
  const { buildWelcomeHtml, WELCOME_SUBJECT } = await import("@/lib/welcome-email.server");
  const html = buildWelcomeHtml(level, tier, loginLink, email);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "كورسي <support@coursi.ai>",
      to: [email],
      subject: WELCOME_SUBJECT,
      html,
    }),
  });
  if (!res.ok) {
    console.error("[stripe-webhook] Resend error:", res.status, await res.text());
  }
}

const INTERNAL_NOTIFY_TO = "info.coursi.ai@gmail.com";

async function sendInternalSaleNotification(
  params: {
    email: string;
    name: string;
    level: string;
    tier: string;
    amount: number;
    currency: string;
    sessionId: string;
    mode: string;
  },
  resendApiKey: string,
): Promise<void> {
  const { email, name, level, tier, amount, currency, sessionId, mode } = params;
  const kind = mode === "subscription" ? "Subscription" : "Purchase";
  const rows: Array<[string, string]> = [
    ["Type", kind],
    ["Name", name || "—"],
    ["Email", email],
    ["Vertical", "AI"],
    ["Level", level],
    ["Tier", tier],
    ["Amount", `${amount.toFixed(2)} ${currency}`],
    ["Stripe session", sessionId],
  ];
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111">
    <h2 style="margin:0 0 12px">New ${kind.toLowerCase()} — Coursi AI</h2>
    <table cellpadding="6" style="border-collapse:collapse">
      ${rows
        .map(
          ([k, v]) =>
            `<tr><td style="border:1px solid #ddd;background:#f6f6f6"><b>${k}</b></td><td style="border:1px solid #ddd">${v}</td></tr>`,
        )
        .join("")}
    </table>
  </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "كورسي <support@coursi.ai>",
      to: [INTERNAL_NOTIFY_TO],
      subject: `New ${kind.toLowerCase()}: ${email} — ${level} / ${tier} — ${amount.toFixed(2)} ${currency}`,
      html,
    }),
  });
  if (!res.ok) {
    console.error("[stripe-webhook] internal notification error:", res.status, await res.text());
  }
}

// Promo/coupon code used on the checkout (e.g. LTO10), or null.
async function lookupPromoCode(stripe: Stripe, sessionId: string): Promise<string | null> {
  try {
    const full = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["total_details.breakdown.discounts.discount.promotion_code"],
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const discounts = ((full.total_details as any)?.breakdown?.discounts ?? []) as any[];
    for (const d of discounts) {
      const pc = d?.discount?.promotion_code;
      const code = typeof pc === "object" && pc ? pc.code : null;
      const promo = code || d?.discount?.coupon?.name || d?.discount?.coupon?.id || null;
      if (promo) return promo;
    }
  } catch (e) {
    console.error("[stripe-webhook] promo lookup failed:", e);
  }
  return null;
}

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        // Must be THIS portal's own database — the same one the portal front-end
        // authenticates against, otherwise the magic link logs into nothing.
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
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
        const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });
        const amount = session.amount_total ? session.amount_total / 100 : 0;
        const currency = session.currency?.toUpperCase() || "USD";
        const name = session.customer_details?.name || "";
        const mode = session.mode || "payment";

        try {
          const result = await fulfillCheckout(admin, {
            sessionId: session.id,
            email,
            priceId,
            metadata: (session.metadata ?? {}) as Record<string, string | undefined>,
            clientReferenceId: session.client_reference_id ?? null,
            amountTotal: session.amount_total ?? null,
            currency: session.currency ?? null,
            createdUnix: session.created ?? null,
            promoCode: await lookupPromoCode(stripe, session.id),
          });

          if (result.kind === "duplicate") {
            console.log(`[stripe-webhook] session ${session.id} already processed — skipped`);
            return Response.json({ received: true, duplicate: true });
          }

          if (result.kind === "level_upgrade") {
            const { fromLevel, toLevel, keptTier } = result;
            const { buildLevelUpgradeHtml, LEVEL_UPGRADE_SUBJECT } = await import(
              "@/lib/level-upgrade-email.server"
            );
            const mailRes = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "كورسي <support@coursi.ai>",
                to: [email],
                subject: LEVEL_UPGRADE_SUBJECT,
                html: buildLevelUpgradeHtml(toLevel, keptTier),
              }),
            });
            if (!mailRes.ok) {
              console.error("[stripe-webhook] level upgrade email error:", mailRes.status, await mailRes.text());
            }
            await sendInternalSaleNotification(
              { email, name, level: `${fromLevel} → ${toLevel}`, tier: `${keptTier} (level upgrade)`, amount, currency, sessionId: session.id, mode },
              resendApiKey,
            );
            console.log(`[stripe-webhook] level upgrade ${fromLevel}→${toLevel} for ${email}`);
            return Response.json({ success: true, upgrade: "level_upgrade" });
          }

          if (result.kind === "topup") {
            const { buildAiUpgradeHtml, AI_UPGRADE_SUBJECT, AI_TUTOR_BOT_LINK } = await import(
              "@/lib/ai-upgrade-email.server"
            );
            const res = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "كورسي <support@coursi.ai>",
                to: [email],
                subject: AI_UPGRADE_SUBJECT,
                html: buildAiUpgradeHtml(AI_TUTOR_BOT_LINK, result.level),
              }),
            });
            if (!res.ok) {
              console.error("[stripe-webhook] top-up email error:", res.status, await res.text());
            }
            await sendInternalSaleNotification(
              { email, name, level: result.level, tier: "course_ai (top-up)", amount, currency, sessionId: session.id, mode },
              resendApiKey,
            );
            console.log(`[stripe-webhook] AI top-up completed for ${email}`);
            return Response.json({ success: true, upgrade: "course_ai_topup" });
          }

          const { level, tier } = result;
          const { data: linkData } = await admin.auth.admin.generateLink({
            type: "magiclink",
            email,
            options: { redirectTo: "https://ai.portal.coursi.ai/dashboard" },
          });
          // Scanner-proof: our /login page redeems the token with JS, so email
          // scanners and in-app browser prefetchers can't burn it.
          const hashed = linkData?.properties?.hashed_token;
          const loginLink = hashed
            ? `https://ai.portal.coursi.ai/login?token_hash=${encodeURIComponent(hashed)}&type=magiclink&redirect=/dashboard`
            : "https://ai.portal.coursi.ai/login";
          await sendWelcomeEmail(email, level, tier, loginLink, resendApiKey);
          await sendInternalSaleNotification(
            { email, name, level, tier, amount, currency, sessionId: session.id, mode },
            resendApiKey,
          );
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
