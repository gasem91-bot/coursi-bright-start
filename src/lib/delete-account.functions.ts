import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Deletes ONLY the signed-in caller. No user id is accepted from the client.
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ ok: boolean }> => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    const email = (authUser?.user?.email ?? "").trim().toLowerCase();

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
      const { sendAccountDeletedEmail } = await import("./account-deleted-email.server");
      await sendAccountDeletedEmail(email);
    }
    return { ok: true };
  });
