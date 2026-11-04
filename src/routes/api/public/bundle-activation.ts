import { createFileRoute } from "@tanstack/react-router";

const headers = { "Cache-Control": "no-store" };

// Called only by the Trading portal, signed with BUNDLE_ACTIVATION_SECRET.
export const Route = createFileRoute("/api/public/bundle-activation")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { runGrant } = await import("@/lib/bundle-activation.server");
          const r = await runGrant(request);
          return Response.json(r.body, { status: r.status, headers });
        } catch {
          return Response.json({ error: "unavailable" }, { status: 503, headers });
        }
      },
    },
  },
});
