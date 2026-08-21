// Shared server-only ticket creation logic.
// Used by BOTH the /support page server function and the public bot endpoint,
// so validation, ticket refs and the two branded emails are identical.

import { z } from "zod";
import { CATEGORY_LABEL, ticketRef } from "./support";
import { arabicDate } from "./certificate";
import { buildTicketUserHtml, buildTicketSupportHtml } from "./support-email.server";

export const ticketInputSchema = z.object({
  category: z.enum(["billing", "course_access", "technical", "other"]),
  message: z.string().trim().min(5).max(4000),
  name: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().email().max(200).optional(),
  source: z.enum(["web", "telegram"]).default("web"),
});

export type TicketInput = z.infer<typeof ticketInputSchema>;

export type CreateTicketResult =
  | { ok: true; ticketRef: string; id: string }
  | { ok: false; reason: "invalid" | "failed" };

export async function createTicket(
  input: TicketInput & { userId?: string | null },
): Promise<CreateTicketResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  let email = input.email?.trim() ?? "";
  let name = input.name?.trim() ?? "";

  if (input.userId) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, display_name")
      .eq("id", input.userId)
      .maybeSingle();
    email = profile?.email?.trim() || email;
    name = profile?.display_name?.trim() || name;
  }

  if (!email) return { ok: false, reason: "invalid" };
  if (!name) name = email.split("@")[0] || "مستخدم كورسي";

  const { data: row, error } = await supabaseAdmin
    .from("support_tickets")
    .insert({
      user_id: input.userId ?? null,
      email,
      name,
      category: input.category,
      message: input.message,
      status: "open",
      source: input.source,
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
    categoryLabel: CATEGORY_LABEL[input.category] ?? input.category,
    message: input.message,
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

    const channelTag = input.source === "telegram" ? " (تليجرام)" : "";
    await send(email, `تم استلام طلبك — رقم التذكرة ${ref}`, buildTicketUserHtml(payload));
    await send(
      "support@coursi.ai",
      `🆕 تذكرة دعم جديدة ${ref}${channelTag} — ${payload.categoryLabel}`,
      buildTicketSupportHtml(payload),
      email,
    );
  } else {
    console.error("[support] RESEND_API_KEY missing — emails skipped");
  }

  return { ok: true, ticketRef: ref, id: row.id };
}
