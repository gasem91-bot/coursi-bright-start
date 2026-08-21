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
    const { createTicket } = await import("./support-ticket.server");
    return createTicket({
      userId: context.userId,
      category: data.category,
      message: data.message,
      source: "web",
    });
  });
