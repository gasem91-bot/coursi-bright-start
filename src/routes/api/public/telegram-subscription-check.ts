import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "crypto";
import { z } from "zod";

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, x-bot-secret",
};

const bodySchema = z.object({ email: z.string().trim().toLowerCase().email().max(320) });

// Same rule as the /upgrade page: active subscription rows; "course_ai" means
// the AI assistant is on, "course" means course only.
export const Route = createFileRoute("/api/public/telegram-subscription-check")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const secret = process.env["TELEGRAM_BOT_TICKET_SECRET"];
        const provided = request.headers.get("x-bot-secret") ?? "";
        if (!secret || !provided || !safeEqual(provided, secret)) {
          return Response.json({ ok: false, error: "unauthorized" }, { status: 401, headers: CORS });
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ ok: false, error: "invalid_json" }, { status: 400, headers: CORS });
        }
        const parsed = bodySchema.safeParse(body);
        if (!parsed.success) {
          return Response.json({ ok: false, error: "invalid_input" }, { status: 400, headers: CORS });
        }
        const email = parsed.data.email;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const notFound = { found: false, has_course: false, has_ai_assistant: false, level: null };

        const { data: matches, error: pErr } = await supabaseAdmin
          .from("profiles")
          .select("id, email, level")
          .ilike("email", email);
        if (pErr) {
          console.error("[telegram-subscription-check] profile error:", pErr);
          return Response.json({ ok: false, error: "lookup_failed" }, { status: 500, headers: CORS });
        }
        const profile = (matches ?? []).find((p) => (p.email ?? "").trim().toLowerCase() === email);
        if (!profile) return Response.json(notFound, { headers: CORS });

        const { data: subs, error: sErr } = await supabaseAdmin
          .from("subscriptions")
          .select("tier")
          .eq("user_id", profile.id)
          .eq("status", "active");
        if (sErr) {
          console.error("[telegram-subscription-check] subscription error:", sErr);
          return Response.json({ ok: false, error: "lookup_failed" }, { status: 500, headers: CORS });
        }
        const tiers = (subs ?? []).map((s) => s.tier as string);
        const hasAi = tiers.includes("course_ai");

        return Response.json(
          {
            found: true,
            has_course: hasAi || tiers.includes("course"),
            has_ai_assistant: hasAi,
            level: profile.level ?? null,
          },
          { headers: CORS },
        );
      },
    },
  },
});
