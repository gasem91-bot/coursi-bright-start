import { createFileRoute } from "@tanstack/react-router";

const headers = { "Cache-Control": "no-store" };

export const Route = createFileRoute("/api/public/portal-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { runSyncRequest } = await import("@/lib/portal-sync.server");
          const r = await runSyncRequest(request);
          return Response.json(r.body, { status: r.status, headers });
        } catch {
          return Response.json({ error: "unauthorized" }, { status: 401, headers });
        }
      },
    },
  },
});
