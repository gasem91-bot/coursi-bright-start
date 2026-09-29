// Sends the branded certificate email once per (user, level).
// Only sends when a certificate row exists — i.e. the level is fully complete
// (final exam passed AND practical task approved).
import type { Level } from "./certificate";

export type CertificateEmailResult =
  | { sent: true }
  | { sent: false; reason: "already_sent" | "not_complete" | "no_email" | "misconfigured" | "send_failed" };

export async function sendCertificateEmailFor(userId: string, level: Level): Promise<CertificateEmailResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { courseName, LEVEL_LABEL, arabicDate } = await import("./certificate");
  const { buildCertificateHtml } = await import("./certificate-email.server");

  const resendApiKey = process.env["RESEND_API_KEY"];
  if (!resendApiKey) {
    console.error("[certificate-email] RESEND_API_KEY missing");
    return { sent: false, reason: "misconfigured" };
  }

  const { data: existing } = await supabaseAdmin
    .from("certificate_emails")
    .select("id")
    .eq("user_id", userId)
    .eq("level", level)
    .maybeSingle();
  if (existing) return { sent: false, reason: "already_sent" };

  const { data: cert } = await supabaseAdmin
    .from("certificates")
    .select("certificate_id, issued_at")
    .eq("user_id", userId)
    .eq("level", level)
    .maybeSingle();
  if (!cert) return { sent: false, reason: "not_complete" };

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("email, display_name")
    .eq("id", userId)
    .maybeSingle();
  const email = profile?.email?.trim();
  if (!email) return { sent: false, reason: "no_email" };
  const userName = profile?.display_name?.trim() || email.split("@")[0] || "طالب كورسي";

  const html = buildCertificateHtml({
    userName,
    courseName: courseName(level),
    levelLabel: LEVEL_LABEL[level],
    certId: cert.certificate_id,
    dateText: arabicDate(new Date(cert.issued_at)),
    link: "https://ai.portal.coursi.ai/achievements",
  });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
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
    .insert({ user_id: userId, level, certificate_id: cert.certificate_id });
  if (insertError) console.error("[certificate-email] log insert failed:", insertError);

  return { sent: true };
}
