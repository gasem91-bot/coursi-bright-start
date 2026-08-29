import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  EXAM_COOLDOWN_HOURS,
  EXAM_PASS_SCORE,
  type ExamState,
  type ExamSubmitResult,
} from "./exam";

const levelSchema = z.enum(["beginner", "intermediate", "advanced"]);

export const getExamState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ level: levelSchema }).parse(input))
  .handler(async ({ data, context }): Promise<ExamState> => {
    const { userId } = context;
    const level = data.level;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { EXAM_BANK } = await import("./exam-bank.server");
    const { isLevelComplete } = await import("./certificate");

    const [{ data: progress }, { data: attempts }, { data: cert }] = await Promise.all([
      supabaseAdmin
        .from("course_progress")
        .select("chapter_id")
        .eq("user_id", userId)
        .eq("completed", true),
      supabaseAdmin
        .from("exam_attempts")
        .select("score, total, passed, created_at")
        .eq("user_id", userId)
        .eq("level", level)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("certificates")
        .select("certificate_id, issued_at, score, total")
        .eq("user_id", userId)
        .eq("level", level)
        .maybeSingle(),
    ]);

    const completedIds = new Set((progress ?? []).map((r) => r.chapter_id));
    const rows = attempts ?? [];
    const last = rows[0] ?? null;
    const passed = rows.some((r) => r.passed);

    let lockedUntil: string | null = null;
    if (last && !last.passed && !passed) {
      const until = new Date(new Date(last.created_at).getTime() + EXAM_COOLDOWN_HOURS * 3600_000);
      if (until.getTime() > Date.now()) lockedUntil = until.toISOString();
    }

    return {
      level,
      eligible: isLevelComplete(level, completedIds),
      questions: EXAM_BANK[level].map((q) => ({ id: q.id, question: q.question, options: q.options })),
      passScore: EXAM_PASS_SCORE,
      lastAttempt: last
        ? { score: last.score, total: last.total, passed: last.passed, createdAt: last.created_at }
        : null,
      bestScore: rows.length ? Math.max(...rows.map((r) => r.score)) : null,
      attempts: rows.length,
      passed,
      certificate: cert
        ? {
            certificateId: cert.certificate_id,
            issuedAt: cert.issued_at,
            score: cert.score,
            total: cert.total,
          }
        : null,
      lockedUntil,
    };
  });

export const submitExam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        level: levelSchema,
        answers: z.array(z.object({ id: z.string(), answer: z.number().int().min(0).max(9) })).max(50),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<ExamSubmitResult> => {
    const { userId } = context;
    const level = data.level;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { EXAM_BANK } = await import("./exam-bank.server");
    const { isLevelComplete, certificateId } = await import("./certificate");

    const questions = EXAM_BANK[level];

    const { data: progress } = await supabaseAdmin
      .from("course_progress")
      .select("chapter_id")
      .eq("user_id", userId)
      .eq("completed", true);
    const completedIds = new Set((progress ?? []).map((r) => r.chapter_id));
    if (!isLevelComplete(level, completedIds)) return { ok: false, reason: "not_eligible" };

    const { data: attempts } = await supabaseAdmin
      .from("exam_attempts")
      .select("passed, created_at")
      .eq("user_id", userId)
      .eq("level", level)
      .order("created_at", { ascending: false });
    const rows = attempts ?? [];
    if (rows.some((r) => r.passed)) return { ok: false, reason: "already_passed" };
    const last = rows[0];
    if (last && !last.passed) {
      const until = new Date(new Date(last.created_at).getTime() + EXAM_COOLDOWN_HOURS * 3600_000);
      if (until.getTime() > Date.now())
        return { ok: false, reason: "cooldown", lockedUntil: until.toISOString() };
    }

    const byId = new Map(data.answers.map((a) => [a.id, a.answer]));
    const results = questions.map((q) => ({ id: q.id, correct: byId.get(q.id) === q.correct }));
    const score = results.filter((r) => r.correct).length;
    const total = questions.length;
    const passed = score >= EXAM_PASS_SCORE;

    await supabaseAdmin
      .from("exam_attempts")
      .insert({ user_id: userId, level, score, total, passed });

    let certId: string | undefined;
    if (passed) {
      certId = certificateId(userId, level);
      const { error } = await supabaseAdmin
        .from("certificates")
        .upsert(
          { user_id: userId, level, certificate_id: certId, score, total },
          { onConflict: "user_id,level" },
        );
      if (error) console.error("[exam] certificate insert failed:", error);
    }

    return { ok: true, score, total, passed, results, certificateId: certId };
  });
