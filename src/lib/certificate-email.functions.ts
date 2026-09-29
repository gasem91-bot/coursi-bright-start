import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { CertificateEmailResult } from "./certificate-email-send.server";

export type { CertificateEmailResult };

/** Re-sends (once) the certificate email — only works when the level is fully complete. */
export const sendCertificateEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ level: z.enum(["beginner", "intermediate", "advanced"]) }).parse(input),
  )
  .handler(async ({ data, context }): Promise<CertificateEmailResult> => {
    const { sendCertificateEmailFor } = await import("./certificate-email-send.server");
    return sendCertificateEmailFor(context.userId, data.level);
  });
