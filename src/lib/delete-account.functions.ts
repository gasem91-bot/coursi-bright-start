import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const exitInput = z.object({
  reason: z.enum(["no_time", "content_fit", "price", "finished", "other"]).nullable().optional(),
  comment: z.string().trim().max(1000).nullable().optional(),
});
type ExitInput = z.infer<typeof exitInput>;

// Anonymous churn record — no name, email or user id is ever stored.
async function recordExit(
  admin: Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"],
  userId: string,
  type: "paused" | "deleted",
  data: ExitInput,
) {
  const [{ data: prof }, { data: sub }, { count: chapters }, { count: certs }] = await Promise.all([
    admin.from("profiles").select("level").eq("id", userId).maybeSingle(),
    admin.from("subscriptions").select("tier").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("course_progress").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("completed", true),
    admin.from("certificates").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);
  const { error } = await admin.from("account_exits").insert({
    exit_type: type,
    level_reached: prof?.level ?? null,
    subscription_tier: sub?.tier ?? null,
    chapters_completed: chapters ?? 0,
    certificates_earned: certs ?? 0,
    reason: data.reason ?? null,
    comment: data.comment || null,
  });
  if (error) console.error("[account-exit] record:", error.message);
}

// Pauses ONLY the signed-in caller. Nothing is deleted.
export const deactivateMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => exitInput.parse(i))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("profiles")
      .update({ is_active: false, deactivated_at: new Date().toISOString() }).eq("id", userId);
    if (error) { console.error("[deactivate]", error.message); return { ok: false }; }
    await recordExit(supabaseAdmin, userId, "paused", data);
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(userId);
    const email = (u?.user?.email ?? "").trim().toLowerCase();
    if (email) {
      const { sendAccountPausedEmail } = await import("./account-deleted-email.server");
      await sendAccountPausedEmail(email);
    }
    return { ok: true };
  });

// Deletes ONLY the signed-in caller. No user id is accepted from the client.
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => exitInput.parse(i ?? {}))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    const email = (authUser?.user?.email ?? "").trim().toLowerCase();

    await recordExit(supabaseAdmin, userId, "deleted", data);

    // Uploaded task files
    const { data: files } = await supabaseAdmin
      .from("task_submissions").select("file_path").eq("user_id", userId);
    const paths = (files ?? []).map((f) => f.file_path).filter((p): p is string => !!p);
    if (paths.length) await supabaseAdmin.storage.from("task-submissions").remove(paths);

    const personal = [
      "course_progress", "exam_attempts", "task_submissions", "certificates",
      "certificate_emails", "level_ratings", "device_tokens", "upgrade_nudges",
      "support_tickets", "user_roles",
    ] as const;
    for (const t of personal) {
      const { error } = await supabaseAdmin.from(t).delete().eq("user_id", userId);
      if (error) { console.error(`[delete-account] ${t}:`, error.message); return { ok: false }; }
    }
    if (email) await supabaseAdmin.from("support_tickets").delete().ilike("email", email);

    // Keep payment records for accounting, but unlink them from the person.
    await supabaseAdmin.from("subscriptions").update({ user_id: null }).eq("user_id", userId);
    await supabaseAdmin.from("stripe_processed_sessions").update({ user_id: null }).eq("user_id", userId);

    await supabaseAdmin.from("profiles").delete().eq("id", userId);
    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authErr) { console.error("[delete-account] auth:", authErr.message); return { ok: false }; }

    if (email) {
      // Suppression list: email only, used purely to avoid contacting them again.
      await supabaseAdmin.from("do_not_contact").upsert({ email }, { onConflict: "email" });
      const { sendAccountDeletedEmail } = await import("./account-deleted-email.server");
      await sendAccountDeletedEmail(email);
    }
    return { ok: true };
  });
