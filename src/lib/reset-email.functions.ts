import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Sends the branded password-reset email. The token mechanism is untouched:
// we still use Supabase Auth's recovery link, only the email design is ours.
// Always returns { ok: true } so account existence is never leaked.
export const sendBrandedPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ email: z.string().trim().email() }).parse(input))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const email = data.email.toLowerCase();
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { buildResetHtml, RESET_SUBJECT } = await import("./reset-email.server");

      const { data: link, error } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo: "https://ai.portal.coursi.ai/reset-password" },
      });
      if (error || !link?.properties?.action_link) {
        console.error("[reset-email] generateLink failed:", error?.message);
        return { ok: true };
      }

      const resendApiKey = process.env["RESEND_API_KEY"];
      if (!resendApiKey) {
        console.error("[reset-email] RESEND_API_KEY missing");
        return { ok: true };
      }

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "كورسي <info@coursi.ai>",
          to: [email],
          subject: RESET_SUBJECT,
          html: buildResetHtml({ link: link.properties.action_link, email }),
        }),
      });
      if (!res.ok) console.error("[reset-email] resend error:", res.status, await res.text());
    } catch (e) {
      console.error("[reset-email] threw:", e);
    }
    return { ok: true };
  });
