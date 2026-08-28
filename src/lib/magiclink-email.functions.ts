import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Sends the branded magic-link sign-in email. Supabase Auth still mints the
// token (admin.generateLink type=magiclink) — only the design is ours.
// Always returns { ok: true } so account existence is never leaked.
export const sendBrandedMagicLink = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        email: z.string().trim().email(),
        redirectTo: z.string().url().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const email = data.email.toLowerCase();
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { buildMagicLinkHtml, MAGICLINK_SUBJECT } = await import("./magiclink-email.server");

      const { data: link, error } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo: data.redirectTo ?? "https://ai.portal.coursi.ai/dashboard" },
      });
      if (error || !link?.properties?.action_link) {
        console.error("[magiclink-email] generateLink failed:", error?.message);
        return { ok: true };
      }

      const resendApiKey = process.env["RESEND_API_KEY"];
      if (!resendApiKey) {
        console.error("[magiclink-email] RESEND_API_KEY missing");
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
          subject: MAGICLINK_SUBJECT,
          html: buildMagicLinkHtml({ link: link.properties.action_link, email }),
        }),
      });
      if (!res.ok) console.error("[magiclink-email] resend error:", res.status, await res.text());
    } catch (e) {
      console.error("[magiclink-email] threw:", e);
    }
    return { ok: true };
  });
