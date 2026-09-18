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
      from: "كورسي <info@coursi.ai>",
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
