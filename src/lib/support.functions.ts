import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CreateTicketResult =
  | { ok: true; ticketRef: string; id: string }
  | { ok: false; reason: "invalid" | "failed" };

export const createSupportTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        category: z.enum(["billing", "course_access", "technical", "other"]),
        message: z.string().trim().min(5).max(4000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<CreateTicketResult> => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { CATEGORY_LABEL, ticketRef } = await import("./support");
    const { arabicDate } = await import("./certificate");
    const { buildTicketUserHtml, buildTicketSupportHtml } = await import("./support-email.server");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, display_name")
      .eq("id", userId)
      .maybeSingle();

    const email = profile?.email?.trim() ?? "";
    const name = profile?.display_name?.trim() || email.split("@")[0] || "مستخدم كورسي";
    if (!email) return { ok: false, reason: "invalid" };

    const { data: row, error } = await supabaseAdmin
      .from("support_tickets")
      .insert({
        user_id: userId,
        email,
        name,
        category: data.category,
        message: data.message,
        status: "open",
      })
      .select("id, created_at")
      .single();

    if (error || !row) {
      console.error("[support] insert failed:", error);
      return { ok: false, reason: "failed" };
    }

    const ref = ticketRef(row.id);
    const payload = {
      ticketRef: ref,
      categoryLabel: CATEGORY_LABEL[data.category] ?? data.category,
      message: data.message,
      name,
      email,
      dateText: arabicDate(new Date(row.created_at)),
    };

    const resendApiKey = process.env["RESEND_API_KEY"];
    if (resendApiKey) {
      const send = async (to: string, subject: string, html: string, replyTo?: string) => {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "دعم كورسي <info@coursi.ai>",
              to: [to],
              subject,
              html,
              ...(replyTo ? { reply_to: replyTo } : {}),
            }),
          });
          if (!res.ok) console.error("[support] resend error:", res.status, await res.text());
        } catch (e) {
          console.error("[support] resend threw:", e);
        }
      };

      await send(email, `تم استلام طلبك — رقم التذكرة ${ref}`, buildTicketUserHtml(payload));
      await send(
        "support@coursi.ai",
        `🆕 تذكرة دعم جديدة ${ref} — ${payload.categoryLabel}`,
        buildTicketSupportHtml(payload),
        email,
      );
    } else {
      console.error("[support] RESEND_API_KEY missing — emails skipped");
    }

    return { ok: true, ticketRef: ref, id: row.id };
  });
