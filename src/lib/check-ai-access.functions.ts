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


    // Look up profile by email (trimmed, case-insensitive, exact — ilike would
    // treat "_" as a wildcard). Fail-closed: any error or no match blocks login.
    const { data: candidates, error: profileError } = await admin
      .from("profiles")
      .select("id, email")
      .ilike("email", email);

    if (profileError) {
      console.error("[checkAiAccess] profile lookup error:", profileError);
      return { ok: false, reason: "not_registered" };
    }
    const profile = (candidates ?? []).find((p) => (p.email ?? "").trim().toLowerCase() === email);
    if (!profile) return { ok: false, reason: "not_registered" };

    // Any active plan grants portal access: Course-only ("course") and
    // Course + AI tutor ("course_ai"). Users may have several rows.
    const { data: subs, error: subError } = await admin
      .from("subscriptions")
      .select("id")
      .eq("user_id", profile.id)
      .in("tier", ["course", "course_ai"])
      .eq("status", "active")
      .limit(1);

    if (subError) {
      console.error("[checkAiAccess] subscription lookup error:", subError);
      return { ok: false, reason: "no_subscription" };
    }
    if (!subs || subs.length === 0) return { ok: false, reason: "no_subscription" };

    return { ok: true };
  });
