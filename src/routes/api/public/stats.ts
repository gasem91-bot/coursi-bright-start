import { createFileRoute } from "@tanstack/react-router";

const headers = { "Cache-Control": "no-store", "Vary": "x-stats-token" };

export const Route = createFileRoute("/api/public/stats")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { matchesStatsToken } = await import("@/lib/stats-token.server");
        if (!matchesStatsToken(request.headers.get("x-stats-token") ?? "", process.env["STATS_API_TOKEN"])) {
          return Response.json({ error: "unauthorized" }, { status: 401, headers });
        }
        try {
          const { getPayingSubscriberStats } = await import("@/lib/subscriber-stats.server");
          return Response.json(await getPayingSubscriberStats(), { headers });
        } catch {
          return Response.json({ error: "stats_unavailable" }, { status: 503, headers });
        }
      },
    },
  },
});