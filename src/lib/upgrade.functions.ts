import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// One-time $14 top-up: adds the AI tutor bot to an existing course-only purchase.
export const AI_TOPUP_PRICE_ID = "price_1UHJcAHNdqnRfyCH72zIGsP3";

// One-time $10: unlock the next level, keeping the buyer's current tier.
export const LEVEL_UPGRADE_PRICE_ID = "price_1UHK4FHNdqnRfyCHouwRtUrx";

export const NEXT_LEVEL: Record<string, "intermediate" | "advanced" | null> = {
  beginner: "intermediate",
  intermediate: "advanced",
  advanced: null,
};

const PORTAL_URL = "https://ai.portal.coursi.ai";

export type UpgradeStatus = {
  email: string | null;
  tier: "course" | "course_ai" | null;
  eligible: boolean;
};

export const getUpgradeStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UpgradeStatus> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .maybeSingle();

    const { data: subs } = await supabaseAdmin
      .from("subscriptions")
      .select("tier")
      .eq("user_id", userId)
      .eq("status", "active");

    const tiers = (subs ?? []).map((s) => s.tier as string);
    const tier = tiers.includes("course_ai") ? "course_ai" : tiers.includes("course") ? "course" : null;

    return {
      email: profile?.email ?? null,
      tier,
      eligible: tier === "course",
    };
  });

export const createAiUpgradeCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ url: string } | { error: string }> => {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) return { error: "misconfigured" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, level")
      .eq("id", userId)
      .maybeSingle();

    const email = profile?.email ?? (context.claims?.email as string | undefined) ?? null;
    if (!email) return { error: "no_email" };

    const { data: subs } = await supabaseAdmin
      .from("subscriptions")
      .select("tier")
      .eq("user_id", userId)
      .eq("status", "active");

    const tiers = (subs ?? []).map((s) => s.tier as string);
    if (tiers.includes("course_ai")) return { error: "already_active" };
    if (!tiers.includes("course")) return { error: "not_eligible" };

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeSecretKey);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: AI_TOPUP_PRICE_ID, quantity: 1 }],
      customer_email: email,
      client_reference_id: userId,
      metadata: {
        upgrade: "course_ai_topup",
        user_id: userId,
        level: (profile?.level as string) ?? "beginner",
      },
      success_url: `${PORTAL_URL}/upgrade?success=1`,
      cancel_url: `${PORTAL_URL}/upgrade?canceled=1`,
    });

    if (!session.url) return { error: "no_session_url" };
    return { url: session.url };
  });

export type LevelUpgradeStatus = {
  currentLevel: "beginner" | "intermediate" | "advanced" | null;
  nextLevel: "intermediate" | "advanced" | null;
  tier: "course" | "course_ai" | null;
  eligible: boolean;
};

// Explicit wallet choice only; the original top-up checkout above stays unchanged.
export const createAiWalletUpgradeCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ url: string } | { error: string }> => {
    const key = process.env["STRIPE_SECRET_KEY"];
    if (!key) return { error: "misconfigured" };
    const [{ data: profile }, { data: subs, error: subsError }] = await Promise.all([
      context.supabase.from("profiles").select("email,level").eq("id", context.userId).maybeSingle(),
      context.supabase.from("subscriptions").select("tier").eq("user_id", context.userId).eq("status", "active"),
    ]);
    if (subsError) throw subsError;
    if (subs?.some((s) => s.tier === "course_ai")) return { error: "already_active" };
    if (!subs?.some((s) => s.tier === "course")) return { error: "not_eligible" };
    const email = profile?.email || String(context.claims.email || "");
    if (!email) return { error: "no_email" };
    const rows: import("@/integrations/supabase/types").Database["public"]["Tables"]["referral_wallet_codes"]["Row"][] = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await context.supabase.from("referral_wallet_codes").select("*").eq("user_id", context.userId).eq("vertical", "ai").order("id").range(offset, offset + 499);
      if (error) throw error;
      rows.push(...(data ?? []));
      if ((data?.length ?? 0) < 500) break;
    }
    const { supabaseAdmin: admin } = await import("@/integrations/supabase/client.server");
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(key);
    const { synchronizeWalletRows, walletPromotion } = await import("./wallet-stripe.server");
    const { earliestWalletCode } = await import("./wallet-credit");
    const synchronized = await synchronizeWalletRows(admin, stripe, rows, true);
    const chosen = earliestWalletCode(synchronized.map((r) => ({ ...r, kind: r.kind === "friend" ? "friend" as const : "reward" as const, person: "" })));
    if (!chosen) return { error: "no_credit" };
    const promo = await walletPromotion(stripe, chosen.code);
    const session = await stripe.checkout.sessions.create({
      mode: "payment", line_items: [{ price: AI_TOPUP_PRICE_ID, quantity: 1 }],
      customer_email: email, client_reference_id: context.userId,
      discounts: [{ promotion_code: promo.id }],
      metadata: { upgrade: "course_ai_topup", user_id: context.userId, level: profile?.level || "beginner" },
      success_url: `${PORTAL_URL}/upgrade?success=1`, cancel_url: `${PORTAL_URL}/upgrade?canceled=1`,
    });
    return session.url ? { url: session.url } : { error: "no_session_url" };
  });

export const getLevelUpgradeStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LevelUpgradeStatus> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("level")
      .eq("id", userId)
      .maybeSingle();

    const { data: subs } = await supabaseAdmin
      .from("subscriptions")
      .select("tier")
      .eq("user_id", userId)
      .eq("status", "active");

    const tiers = (subs ?? []).map((s) => s.tier as string);
    const tier = tiers.includes("course_ai") ? "course_ai" : tiers.includes("course") ? "course" : null;
    const currentLevel = (profile?.level as LevelUpgradeStatus["currentLevel"]) ?? null;
    const nextLevel = currentLevel ? NEXT_LEVEL[currentLevel] : null;

    return { currentLevel, nextLevel, tier, eligible: !!nextLevel && !!tier };
  });

export const createLevelUpgradeCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ url: string } | { error: string }> => {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) return { error: "misconfigured" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, level")
      .eq("id", userId)
      .maybeSingle();

    const email = profile?.email ?? (context.claims?.email as string | undefined) ?? null;
    if (!email) return { error: "no_email" };

    const currentLevel = (profile?.level as string) ?? "beginner";
    const nextLevel = NEXT_LEVEL[currentLevel];
    if (!nextLevel) return { error: "no_next_level" };

    const { data: subs } = await supabaseAdmin
      .from("subscriptions")
      .select("tier")
      .eq("user_id", userId)
      .eq("status", "active");

    const tiers = (subs ?? []).map((s) => s.tier as string);
    const tier = tiers.includes("course_ai") ? "course_ai" : tiers.includes("course") ? "course" : null;
    if (!tier) return { error: "not_eligible" };

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeSecretKey);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: LEVEL_UPGRADE_PRICE_ID, quantity: 1 }],
      customer_email: email,
      client_reference_id: userId,
      metadata: {
        upgrade: "level_upgrade",
        user_id: userId,
        from_level: currentLevel,
        to_level: nextLevel,
        tier,
      },
      success_url: `${PORTAL_URL}/welcome`,
      cancel_url: `${PORTAL_URL}/course/ai?upgrade_canceled=1`,
    });

    if (!session.url) return { error: "no_session_url" };
    return { url: session.url };
  });
