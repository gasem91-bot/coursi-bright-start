import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { EmailPreview } from "./email-previews.server";

export type { EmailPreview };

export type EmailPreviewResult =
  | { ok: true; previews: EmailPreview[] }
  | { ok: false; reason: "forbidden" };

export const getEmailPreviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EmailPreviewResult> => {
    const { isAdminEmail } = await import("./admin-allowlist.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", context.userId)
      .maybeSingle();

    if (!isAdminEmail(profile?.email)) return { ok: false, reason: "forbidden" };

    const { buildEmailPreviews } = await import("./email-previews.server");
    return { ok: true, previews: await buildEmailPreviews() };
  });

