import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type CheckAiAccessResult =
  | { ok: true }
  | { ok: false; reason: "not_registered" | "no_subscription" };

export const checkAiAccess = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ email: z.string().email() }).parse(input),
  )
  .handler(async ({ data }): Promise<CheckAiAccessResult> => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const email = data.email.trim().toLowerCase();

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) return { ok: false, reason: "not_registered" };

    const { data: subscription, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("user_id", profile.id)
      .eq("tier", "course_ai")
      .eq("status", "active")
      .maybeSingle();

    if (subError) throw subError;
    if (!subscription) return { ok: false, reason: "no_subscription" };

    return { ok: true };
  });
