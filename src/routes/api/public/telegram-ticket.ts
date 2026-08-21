import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "crypto";

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

export const Route = createFileRoute("/api/public/telegram-ticket")({
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

        const { ticketInputSchema, createTicket } = await import("@/lib/support-ticket.server");
        const parsed = ticketInputSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json(
            { ok: false, error: "invalid_input", details: parsed.error.flatten() },
            { status: 400, headers: CORS },
          );
        }
        if (!parsed.data.email) {
          return Response.json({ ok: false, error: "email_required" }, { status: 400, headers: CORS });
        }

        const result = await createTicket({ ...parsed.data, source: "telegram", userId: null });
        if (!result.ok) {
          return Response.json(
            { ok: false, error: result.reason },
            { status: result.reason === "invalid" ? 400 : 500, headers: CORS },
          );
        }

        return Response.json(
          { ok: true, id: result.id, ticket_id: result.ticketRef, ticketRef: result.ticketRef },
          { headers: CORS },
        );
      },
    },
  },
});
