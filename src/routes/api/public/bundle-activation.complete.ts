import { createFileRoute } from "@tanstack/react-router";
import { ALLOWED_ORIGINS } from "@/lib/bundle-activation";

function cors(request: Request): Record<string, string> {
  const origin = request.headers.get("origin") ?? "";
  const base: Record<string, string> = { "Cache-Control": "no-store", Vary: "Origin" };
  if (!ALLOWED_ORIGINS.includes(origin)) return base;
  return {
    ...base,
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "600",
  };
}

// Only this POST grants anything; opening the email link or survey page does not.
export const Route = createFileRoute("/api/public/bundle-activation/complete")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => new Response(null, { status: 204, headers: cors(request) }),
      POST: async ({ request }) => {
        const headers = cors(request);
        try {
          const { runComplete } = await import("@/lib/bundle-activation.server");
          const r = await runComplete(request);
          return Response.json(r.body, { status: r.status, headers });
        } catch {
          return Response.json({ error: "unavailable" }, { status: 503, headers });
        }
      },
    },
  },
});
