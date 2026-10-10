import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "crypto";

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

// Issue text about the AI tutor / bot / assistant (Arabic + English).
const AI_TOPIC =
  /\b(ai|tutor|bot|assistant|chatbot)\b|مساعد|معلم|بوت|المعلم الذكي|الذكاء الاصطناعي/i;

const REPLY_COURSE_ONLY =
  "أنت مشترك في باقة الكورس فقط، والمعلم الذكي إضافة منفصلة غير مشمولة في باقتك. هل ترغب بالاشتراك فيه؟ يمكنك الترقية من هنا: https://ai.portal.coursi.ai/upgrade\nبعد الترقية راسل @CoursiAI_bot ببريدك المسجّل في كورسي.";

const REPLY_NO_SUB =
  "لم نجد اشتراكاً مرتبطاً بهذا البريد. المعلم الذكي يحتاج اشتراكاً فعّالاً في كورس كورسي، ويمكنك الاشتراك من هنا: https://coursi.ai/ai\nإذا كنت تعتقد أن هذا خطأ، رد على هذه الرسالة وسنساعدك.";

// Same rule as telegram-subscription-check. Returns null on any error.
async function lookupPlan(email: string): Promise<{ found: boolean; hasCourse: boolean; hasAi: boolean } | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: matches, error } = await supabaseAdmin.from("profiles").select("id, email").ilike("email", email);
    if (error) return null;
    const profile = (matches ?? []).find((p) => (p.email ?? "").trim().toLowerCase() === email);
    if (!profile) return { found: false, hasCourse: false, hasAi: false };
    const { data: subs, error: sErr } = await supabaseAdmin
      .from("subscriptions").select("tier").eq("user_id", profile.id).eq("status", "active");
    if (sErr) return null;
    const tiers = (subs ?? []).map((s) => s.tier as string);
    const hasAi = tiers.includes("course_ai");
    return { found: true, hasCourse: hasAi || tiers.includes("course"), hasAi };
  } catch {
    return null;
  }
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, x-bot-secret",
};

export const Route = createFileRoute("/api/public/telegram-ticket")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const secret = process.env["TELEGRAM_BOT_TICKET_SECRET"];
        const provided = request.headers.get("x-bot-secret") ?? "";
        if (!secret || !provided || !safeEqual(provided, secret)) {
          return Response.json({ ok: false, error: "unauthorized", reply: "" }, { status: 401, headers: CORS });
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ ok: false, error: "invalid_json", reply: "" }, { status: 400, headers: CORS });
        }

        const { ticketInputSchema, createTicket } = await import("@/lib/support-ticket.server");
        const parsed = ticketInputSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json(
            { ok: false, error: "invalid_input", details: parsed.error.flatten(), reply: "" },
            { status: 400, headers: CORS },
          );
        }
        if (!parsed.data.email) {
          return Response.json({ ok: false, error: "email_required", reply: "" }, { status: 400, headers: CORS });
        }

        if (AI_TOPIC.test(parsed.data.message)) {
          const plan = await lookupPlan(parsed.data.email.trim().toLowerCase());
          if (plan && plan.hasCourse && !plan.hasAi) {
            return Response.json({ ok: true, ticket: false, reply: REPLY_COURSE_ONLY }, { headers: CORS });
          }
          if (plan && !plan.hasCourse) {
            return Response.json({ ok: true, ticket: false, reply: REPLY_NO_SUB }, { headers: CORS });
          }
        }

        const result = await createTicket({ ...parsed.data, source: "telegram", userId: null });
        if (!result.ok) {
          return Response.json(
            { ok: false, error: result.reason, reply: "" },
            { status: result.reason === "invalid" ? 400 : 500, headers: CORS },
          );
        }

        return Response.json(
          { ok: true, id: result.id, ticket_id: result.ticketRef, ticketRef: result.ticketRef, reply: "" },
          { headers: CORS },
        );
      },
    },
  },
});
