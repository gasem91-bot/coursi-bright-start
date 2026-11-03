import { createFileRoute } from "@tanstack/react-router";

// Called every 5 minutes by the scheduler. It only delivers already-queued,
// signed events to the peer portal, writes nothing else and returns counts only.
export const Route = createFileRoute("/api/public/portal-sync-outbox")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!request.headers.get("authorization")?.startsWith("Bearer ")) {
          return Response.json({ error: "unauthorized" }, { status: 401 });
        }
        try {
          const { processOutbox } = await import("@/lib/portal-sync.server");
          return Response.json(await processOutbox());
        } catch {
          return Response.json({ error: "outbox_unavailable" }, { status: 503 });
        }
      },
    },
  },
});
