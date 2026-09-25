import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
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

export type SendTestEmailsResult =
  | { ok: true; to: string; sent: string[]; failed: string[] }
  | { ok: false; reason: "no_email" | "forbidden" | "misconfigured" };

export const sendTestEmails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ key: z.string().optional() }).parse(data))
  .handler(async ({ context, data }): Promise<SendTestEmailsResult> => {
    const { isAdminEmail } = await import("./admin-allowlist.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", context.userId)
      .maybeSingle();

    const email = profile?.email;
    if (!email) return { ok: false, reason: "no_email" };
    if (!isAdminEmail(email)) return { ok: false, reason: "forbidden" };

    const resendApiKey = process.env["RESEND_API_KEY"];
    if (!resendApiKey) return { ok: false, reason: "misconfigured" };

    const { buildEmailPreviews } = await import("./email-previews.server");
    const previews = (await buildEmailPreviews()).filter((preview) => !data.key || preview.key === data.key);
    const sent: string[] = [];
    const failed: string[] = [];

    for (const [index, preview] of previews.entries()) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: preview.from,
            to: [email],
            subject: `[تجربة] ${preview.subject}`,
            html: preview.html,
          }),
        });

        if (response.ok) sent.push(preview.key);
        else failed.push(preview.key);
      } catch {
        failed.push(preview.key);
      }

      if (index < previews.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 700));
      }
    }

    return { ok: true, to: email, sent, failed };
  });

