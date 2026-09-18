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

const bodySchema = z.object({
  email: z.string().email().max(320),
  vertical: z.enum(["ai", "trading", "fitness"]),
});

export const Route = createFileRoute("/api/public/check-subscription")({
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
          return Response.json(
            { ok: false, error: "invalid_input", details: parsed.error.flatten() },
            { status: 400, headers: CORS },
          );
        }

        const email = parsed.data.email.trim().toLowerCase();
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: profile, error: profileError } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .ilike("email", email)
          .maybeSingle();

        if (profileError) {
          console.error("[check-subscription] profile lookup error:", profileError);
          return Response.json({ active: false, tier: null }, { headers: CORS });
        }
        if (!profile) {
          return Response.json({ active: false, tier: null }, { headers: CORS });
        }

        const { data: subs, error: subError } = await supabaseAdmin
          .from("subscriptions")
          .select("tier")
          .eq("user_id", profile.id)
          .eq("status", "active");

        if (subError) {
          console.error("[check-subscription] subscription lookup error:", subError);
          return Response.json({ active: false, tier: null }, { headers: CORS });
        }

        const tiers = (subs ?? []).map((s) => s.tier as string);
        const verticalTier = `course_${parsed.data.vertical}`; // course_ai / course_trading / course_fitness
        const hasVerticalTier = tiers.includes(verticalTier);

        // For 'ai', report the broadest relevant tier the user holds so the bot can
        // explain what they have ('course') vs what unlocks bot access ('course_ai').
        const tier = hasVerticalTier
          ? verticalTier
          : parsed.data.vertical === "ai" && tiers.includes("course")
            ? "course"
            : null;

        return Response.json(
          { active: hasVerticalTier, tier },
          { headers: CORS },
        );
      },
    },
  },
});
