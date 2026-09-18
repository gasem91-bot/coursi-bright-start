import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CertificateEmailResult =
  | { sent: true }
  | { sent: false; reason: "already_sent" | "not_complete" | "no_email" | "misconfigured" | "send_failed" };

export const sendCertificateEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ level: z.enum(["beginner", "intermediate", "advanced"]) }).parse(input),
  )
  .handler(async ({ data, context }): Promise<CertificateEmailResult> => {
    const { userId } = context;
    const level = data.level;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const {
      certificateId,
      courseName,
      LEVEL_LABEL,
      isLevelComplete,
      arabicDate,
    } = await import("./certificate");
    const { buildCertificateHtml } = await import("./certificate-email.server");

    const resendApiKey = process.env["RESEND_API_KEY"];
    if (!resendApiKey) {
      console.error("[certificate-email] RESEND_API_KEY missing");
      return { sent: false, reason: "misconfigured" };
    }

    // Already sent? (idempotency)
    const { data: existing } = await supabaseAdmin
      .from("certificate_emails")
      .select("id")
      .eq("user_id", userId)
      .eq("level", level)
      .maybeSingle();
    if (existing) return { sent: false, reason: "already_sent" };

    // Verify completion server-side.
    const { data: rows, error: progressError } = await supabaseAdmin
      .from("course_progress")
      .select("chapter_id, completed, updated_at")
      .eq("user_id", userId)
      .eq("completed", true);
    if (progressError) {
      console.error("[certificate-email] progress error:", progressError);
      return { sent: false, reason: "misconfigured" };
    }
    const completedIds = new Set((rows ?? []).map((r) => r.chapter_id));
    if (!isLevelComplete(level, completedIds)) return { sent: false, reason: "not_complete" };

    // Recipient + display name.
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, display_name")
      .eq("id", userId)
      .maybeSingle();
    const email = profile?.email?.trim();
    if (!email) return { sent: false, reason: "no_email" };
    const userName =
      profile?.display_name?.trim() || email.split("@")[0] || "طالب كورسي";

    const certId = certificateId(userId, level);
    const levelRows = (rows ?? []).filter((r) => r.chapter_id.startsWith(`ai-${level}-`));
    const latest = levelRows
      .map((r) => new Date(r.updated_at).getTime())
      .filter((t) => !Number.isNaN(t))
      .sort((a, b) => b - a)[0];
    const dateText = arabicDate(latest ? new Date(latest) : new Date());

    const html = buildCertificateHtml({
      userName,
      courseName: courseName(level),
      levelLabel: LEVEL_LABEL[level],
      certId,
      dateText,
      link: "https://ai.portal.coursi.ai/achievements",
    });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "كورسي <support@coursi.ai>",
        to: [email],
        subject: `مبروك! 🏆 شهادة إتمام ${LEVEL_LABEL[level]} جاهزة`,
        html,
      }),
    });
    if (!res.ok) {
      console.error("[certificate-email] Resend error:", res.status, await res.text());
      return { sent: false, reason: "send_failed" };
    }

    const { error: insertError } = await supabaseAdmin
      .from("certificate_emails")
      .insert({ user_id: userId, level, certificate_id: certId });
    if (insertError) console.error("[certificate-email] log insert failed:", insertError);

    return { sent: true };
  });
