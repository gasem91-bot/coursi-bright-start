import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type CheckAiAccessResult =
  | { ok: true }
  | { ok: false; reason: "not_registered" | "no_subscription" | "misconfigured" };

export const checkAiAccess = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ email: z.string().email() }).parse(input),
  )
  .handler(async ({ data }): Promise<CheckAiAccessResult> => {
    const { createClient } = await import("@supabase/supabase-js");

    const url = process.env.OWN_SUPABASE_URL;
    const serviceRoleKey = process.env.OWN_SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      console.error("[checkAiAccess] missing OWN_SUPABASE_URL or OWN_SUPABASE_SERVICE_ROLE_KEY");
      return { ok: false, reason: "misconfigured" };
    }

    const admin = createClient(url, serviceRoleKey, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });

    const email = data.email.trim().toLowerCase();
    if (!email) return { ok: false, reason: "not_registered" };

    // Look up profile by email in the user's own Supabase project.
    // Fail-closed: any error or no match blocks login.
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    if (profileError) {
      console.error("[checkAiAccess] profile lookup error:", profileError);
      return { ok: false, reason: "not_registered" };
    }
    if (!profile || !profile.id) {
      return { ok: false, reason: "not_registered" };
    }

    const { data: subscription, error: subError } = await admin
      .from("subscriptions")
      .select("id")
      .eq("user_id", profile.id)
      .eq("tier", "course_ai")
      .eq("status", "active")
      .maybeSingle();

    if (subError) {
      console.error("[checkAiAccess] subscription lookup error:", subError);
      return { ok: false, reason: "no_subscription" };
    }
    if (!subscription) return { ok: false, reason: "no_subscription" };

    return { ok: true };
  });
