import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SyncIapResult =
  | { ok: true; fulfilled: number; hasAccess: boolean }
  | { ok: false; error: "misconfigured" | "lookup_failed" };

type RcNonSubscription = {
  id?: string;
  store_transaction_id?: string;
  purchase_date?: string;
  store?: string;
};

// Reads this user's purchases from RevenueCat (which has already verified the
// receipts with Apple / Google) and grants access for each. Safe to call as
// often as needed: every transaction is fulfilled at most once.
export const syncIapPurchases = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SyncIapResult> => {
    const secret = process.env.REVENUECAT_SECRET_KEY;
    if (!secret) return { ok: false, error: "misconfigured" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { fulfillStorePurchase } = await import("./iap-fulfillment.server");
    const userId = context.userId;

    let nonSubs: Record<string, RcNonSubscription[]> = {};
    try {
      const res = await fetch(
        `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`,
        { headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" } },
      );
      if (!res.ok) {
        console.error("[iap] revenuecat lookup failed:", res.status);
        return { ok: false, error: "lookup_failed" };
      }
      const body = (await res.json()) as {
        subscriber?: { non_subscriptions?: Record<string, RcNonSubscription[]> };
      };
      nonSubs = body.subscriber?.non_subscriptions ?? {};
    } catch (e) {
      console.error("[iap] revenuecat lookup threw:", e);
      return { ok: false, error: "lookup_failed" };
    }

    // Oldest first so a course purchase is applied before tutor / next-level add-ons.
    const purchases = Object.entries(nonSubs)
      .flatMap(([productId, list]) =>
        list.map((p) => ({
          productId,
          transactionId: p.store_transaction_id || p.id || "",
          store: (p.store || "store").toLowerCase(),
          purchasedAtMs: p.purchase_date ? Date.parse(p.purchase_date) : Date.now(),
        })),
      )
      .filter((p) => p.transactionId)
      .sort((a, b) => a.purchasedAtMs - b.purchasedAtMs);

    let fulfilled = 0;
    for (const p of purchases) {
      try {
        const r = await fulfillStorePurchase(supabaseAdmin, userId, p);
        if (r.kind !== "duplicate" && r.kind !== "unknown_product") fulfilled += 1;
      } catch (e) {
        console.error("[iap] fulfil failed:", p.productId, e);
      }
    }

    const { data: subs } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .in("tier", ["course", "course_ai"])
      .eq("status", "active")
      .limit(1);

    return { ok: true, fulfilled, hasAccess: (subs?.length ?? 0) > 0 };
  });

// Does the signed-in user currently hold an active plan? (used by the native
// paywall guard; reads with the service role because subscriptions rows are
// written server-side.)
export const getMyAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(
    async ({
      context,
    }): Promise<{
      hasAccess: boolean;
      tier: "course" | "course_ai" | null;
      level: string | null;
    }> => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: subs } = await supabaseAdmin
        .from("subscriptions")
        .select("tier")
        .eq("user_id", context.userId)
        .in("tier", ["course", "course_ai"])
        .eq("status", "active");
      const tiers = (subs ?? []).map((s) => s.tier as string);
      const tier = tiers.includes("course_ai")
        ? "course_ai"
        : tiers.includes("course")
          ? "course"
          : null;
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("level")
        .eq("id", context.userId)
        .maybeSingle();
      return { hasAccess: tier !== null, tier, level: (profile?.level as string) ?? null };
    },
  );
