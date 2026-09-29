// A level is complete only when BOTH the final exam is passed AND the practical
// task is approved by the AI reviewer. Completing issues the certificate,
// awards level XP (once) and sends the certificate email.
import type { Level } from "./certificate";

export const LEVEL_COMPLETE_XP = 100;

export async function tryCompleteLevel(
  userId: string,
  level: Level,
): Promise<{ completed: boolean; certificateId?: string; newlyCompleted?: boolean }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { certificateId } = await import("./certificate");

  const { data: existing } = await supabaseAdmin
    .from("certificates")
    .select("certificate_id")
    .eq("user_id", userId)
    .eq("level", level)
    .maybeSingle();
  if (existing) return { completed: true, certificateId: existing.certificate_id, newlyCompleted: false };

  const [{ data: attempts }, { data: task }] = await Promise.all([
    supabaseAdmin
      .from("exam_attempts")
      .select("score, total")
      .eq("user_id", userId)
      .eq("level", level)
      .eq("passed", true)
      .order("score", { ascending: false })
      .limit(1),
    supabaseAdmin
      .from("task_submissions")
      .select("id")
      .eq("user_id", userId)
      .eq("level", level)
      .eq("status", "approved")
      .limit(1),
  ]);
  const best = attempts?.[0];
  if (!best || !task?.length) return { completed: false };

  const certId = certificateId(userId, level);
  const { error } = await supabaseAdmin
    .from("certificates")
    .insert({ user_id: userId, level, certificate_id: certId, score: best.score, total: best.total });
  if (error) {
    // Unique conflict = a parallel request already completed it.
    console.error("[level-completion] certificate insert:", error.message);
    return { completed: true, certificateId: certId, newlyCompleted: false };
  }

  const { data: p } = await supabaseAdmin.from("profiles").select("xp_points").eq("id", userId).maybeSingle();
  await supabaseAdmin
    .from("profiles")
    .update({ xp_points: (p?.xp_points ?? 0) + LEVEL_COMPLETE_XP })
    .eq("id", userId);

  const { sendCertificateEmailFor } = await import("./certificate-email-send.server");
  await sendCertificateEmailFor(userId, level).catch((e) => console.error("[level-completion] email:", e));

  return { completed: true, certificateId: certId, newlyCompleted: true };
}
