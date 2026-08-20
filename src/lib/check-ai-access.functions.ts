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
    // Use THIS project's own Lovable Cloud database (same project as VITE_SUPABASE_URL).
    let admin;
    try {
      ({ supabaseAdmin: admin } = await import("@/integrations/supabase/client.server"));
    } catch (e) {
      console.error("[checkAiAccess] admin client unavailable:", e);
      return { ok: false, reason: "misconfigured" };
    }

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
