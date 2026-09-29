import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const levelSchema = z.enum(["beginner", "intermediate", "advanced"]);
const BUCKET = "task-submissions";

async function levelChaptersDone(userId: string, level: "beginner" | "intermediate" | "advanced") {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { isLevelComplete } = await import("./certificate");
  const { data } = await supabaseAdmin
    .from("course_progress")
    .select("chapter_id")
    .eq("user_id", userId)
    .eq("completed", true);
  return isLevelComplete(level, new Set((data ?? []).map((r) => r.chapter_id)));
}

/** Signed upload URL scoped to the caller's own folder. */
export const getTaskUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({ level: levelSchema, ext: z.string().regex(/^[a-z0-9]{2,5}$/) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const path = `${context.userId}/${data.level}/${Date.now()}.${data.ext}`;
    const { data: signed, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !signed) return { ok: false as const };
    return { ok: true as const, path, token: signed.token };
  });

export type TaskReviewResult =
  | { ok: true; approved: boolean; feedback: string; levelCompleted: boolean }
  | { ok: false; reason: "not_eligible" | "exam_first" | "bad_input" | "ai_unavailable" | "rate_limited" };

export const submitLevelTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        level: levelSchema,
        kind: z.enum(["image", "video", "link"]),
        filePath: z.string().max(300).optional(),
        linkUrl: z.string().url().max(1000).optional(),
        note: z.string().trim().min(10).max(1500),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<TaskReviewResult> => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { TASK_BRIEF } = await import("./level-task");

    if (!(await levelChaptersDone(userId, data.level))) return { ok: false, reason: "not_eligible" };
    const { data: passedRows } = await supabaseAdmin
      .from("exam_attempts")
      .select("id")
      .eq("user_id", userId)
      .eq("level", data.level)
      .eq("passed", true)
      .limit(1);
    if (!passedRows?.length) return { ok: false, reason: "exam_first" };

    if (data.kind === "link" && !data.linkUrl) return { ok: false, reason: "bad_input" };
    if (data.kind !== "link") {
      if (!data.filePath || !data.filePath.startsWith(`${userId}/${data.level}/`)) {
        return { ok: false, reason: "bad_input" };
      }
    }

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ok: false, reason: "ai_unavailable" };

    const brief = TASK_BRIEF[data.level];
    const content: Array<Record<string, unknown>> = [];
    let proofText = "";
    if (data.kind === "image" && data.filePath) {
      const { data: signed } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(data.filePath, 600);
      if (!signed?.signedUrl) return { ok: false, reason: "bad_input" };
      content.push({ type: "image_url", image_url: { url: signed.signedUrl } });
      proofText = "The student attached a screenshot/image (see image).";
    } else if (data.kind === "video") {
      proofText =
        "The student uploaded a video demo (you cannot watch it). Judge from their written description; approve only if the description is specific and credible.";
    } else {
      proofText = `The student submitted this link as proof: ${data.linkUrl}. You cannot open it; judge from the URL and their description.`;
    }

    const system = `You review practical task submissions for an Arabic AI course (brand: كورسي). Be fair but not a rubber stamp: reject empty, off-topic, copy-pasted generic or clearly fake submissions; approve honest attempts that address the task. Reply ONLY via the tool. Feedback must be 1-3 short sentences in Arabic, encouraging, and if rejected say exactly what to fix. Never write the brand in Latin letters.`;
    const userText = `Task: ${brief.title}\n${brief.brief}\nRequired: ${brief.checklist.join(" | ")}\n\nProof: ${proofText}\nStudent note: ${data.note}`;
    content.unshift({ type: "text", text: userText });

    let approved = false;
    let feedback = "";
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: system },
            { role: "user", content },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "review",
                description: "Return the review verdict",
                parameters: {
                  type: "object",
                  properties: { approved: { type: "boolean" }, feedback: { type: "string" } },
                  required: ["approved", "feedback"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "review" } },
        }),
      });
      if (res.status === 429) return { ok: false, reason: "rate_limited" };
      if (!res.ok) {
        console.error("[level-task] AI error", res.status, await res.text());
        return { ok: false, reason: "ai_unavailable" };
      }
      const json = await res.json();
      const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      const parsed = JSON.parse(args ?? "{}") as { approved?: boolean; feedback?: string };
      approved = parsed.approved === true;
      feedback = (parsed.feedback ?? "").slice(0, 600) || (approved ? "عمل رائع!" : "حاول مرة أخرى بتفاصيل أوضح");
    } catch (e) {
      console.error("[level-task] AI call failed", e);
      return { ok: false, reason: "ai_unavailable" };
    }

    await supabaseAdmin.from("task_submissions").insert({
      user_id: userId,
      level: data.level,
      kind: data.kind,
      file_path: data.filePath ?? null,
      link_url: data.linkUrl ?? null,
      note: data.note,
      status: approved ? "approved" : "rejected",
      ai_feedback: feedback,
    });

    let levelCompleted = false;
    if (approved) {
      const { tryCompleteLevel } = await import("./level-completion.server");
      levelCompleted = (await tryCompleteLevel(userId, data.level)).completed;
    }
    return { ok: true, approved, feedback, levelCompleted };
  });

/** Sends the $10 next-level nudge email once per level, when all the level's units are passed. */
export const triggerUpgradeNudge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ level: levelSchema }).parse(input))
  .handler(async ({ data, context }): Promise<{ sent: boolean }> => {
    const { userId } = context;
    if (data.level === "advanced") return { sent: false };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, display_name, level")
      .eq("id", userId)
      .maybeSingle();
    if (!profile?.email || profile.level !== data.level) return { sent: false };
    if (!(await levelChaptersDone(userId, data.level))) return { sent: false };

    const { data: subs } = await supabaseAdmin
      .from("subscriptions")
      .select("tier")
      .eq("user_id", userId)
      .eq("status", "active");
    if (!subs?.length) return { sent: false };

    // Claim the slot first so concurrent calls can't double-send.
    const { error: claimErr } = await supabaseAdmin
      .from("upgrade_nudges")
      .insert({ user_id: userId, level: data.level });
    if (claimErr) return { sent: false };

    const resendApiKey = process.env["RESEND_API_KEY"];
    if (!resendApiKey) return { sent: false };
    const { buildUpgradeNudgeHtml, UPGRADE_NUDGE_SUBJECT } = await import("./upgrade-nudge-email.server");
    const html = buildUpgradeNudgeHtml({
      userName: profile.display_name?.trim() || undefined,
      currentLevel: data.level,
      remainingChapters: 0,
      courseLink: "https://ai.portal.coursi.ai/course/ai?upgrade=1",
    });
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "كورسي <support@coursi.ai>",
        to: [profile.email],
        subject: UPGRADE_NUDGE_SUBJECT,
        html,
      }),
    });
    if (!res.ok) {
      console.error("[upgrade-nudge] Resend error:", res.status, await res.text());
      await supabaseAdmin.from("upgrade_nudges").delete().eq("user_id", userId).eq("level", data.level);
      return { sent: false };
    }
    return { sent: true };
  });
