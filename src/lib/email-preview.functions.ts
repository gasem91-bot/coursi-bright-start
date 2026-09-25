import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { EmailPreview } from "./email-previews.server";

export type { EmailPreview };

export type EmailPreviewResult =
  | { ok: true; previews: EmailPreview[] }
  | { ok: false; reason: "forbidden" | "empty" | "error"; message?: string };

// POST so no edge/browser cache can ever serve a stale or empty GET response.
export const getEmailPreviews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EmailPreviewResult> => {
    try {
      const { isAdminEmail } = await import("./admin-allowlist.server");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("email")
        .eq("id", context.userId)
        .maybeSingle();

      if (!isAdminEmail(profile?.email)) return { ok: false, reason: "forbidden" };

      const { buildEmailPreviews } = await import("./email-previews.server");
      const previews = await buildEmailPreviews();
      if (!Array.isArray(previews) || previews.length === 0) return { ok: false, reason: "empty" };
      return { ok: true, previews };
    } catch (err) {
      console.error("[getEmailPreviews] failed", err);
      return { ok: false, reason: "error", message: err instanceof Error ? err.message : String(err) };
    }
  });

export type AdminStatus = { signedIn: true; isAdmin: boolean; email: string | null };

export const getEmailAdminStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminStatus> => {
    const { isAdminEmail } = await import("./admin-allowlist.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", context.userId)
      .maybeSingle();
    const email = profile?.email ?? null;
    return { signedIn: true, isAdmin: isAdminEmail(email), email };
  });

export type SendItemResult = { key: string; ok: boolean; error: string | null };

export type SendTestEmailsResult =
  | { ok: true; to: string; results: SendItemResult[] }
  | { ok: false; reason: "no_email" | "forbidden" | "misconfigured" | "error"; message: string };

export const sendTestEmails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ key: z.string().optional() }).parse(data))
  .handler(async ({ context, data }): Promise<SendTestEmailsResult> => {
    try {
      const { isAdminEmail } = await import("./admin-allowlist.server");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("email")
        .eq("id", context.userId)
        .maybeSingle();

      const email = profile?.email;
      if (!email) return { ok: false, reason: "no_email", message: "لا يوجد بريد إلكتروني في حساب المشرف" };
      if (!isAdminEmail(email)) return { ok: false, reason: "forbidden", message: "هذه الصفحة مخصّصة للمشرفين فقط" };

      const resendApiKey = process.env["RESEND_API_KEY"];
      if (!resendApiKey)
        return { ok: false, reason: "misconfigured", message: "مفتاح خدمة إرسال البريد (RESEND_API_KEY) غير مضبوط على الخادم" };

      const { buildEmailPreviews } = await import("./email-previews.server");
      const previews = (await buildEmailPreviews()).filter((p) => !data.key || p.key === data.key);
      if (previews.length === 0)
        return { ok: false, reason: "error", message: `لم يتم العثور على قالب البريد: ${data.key ?? "الكل"}` };

      const results: SendItemResult[] = [];
      for (const [index, preview] of previews.entries()) {
        try {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: preview.from,
              to: [email],
              subject: `[تجربة] ${preview.subject}`,
              html: preview.html,
            }),
          });
          if (response.ok) {
            results.push({ key: preview.key, ok: true, error: null });
          } else {
            const body = await response.text();
            console.error(`[sendTestEmails] Resend failed for ${preview.key} (${response.status})`, body);
            let msg = body;
            try {
              const j = JSON.parse(body) as { message?: string };
              if (j?.message) msg = j.message;
            } catch {
              /* keep raw body */
            }
            results.push({ key: preview.key, ok: false, error: `HTTP ${response.status}: ${msg}` });
          }
        } catch (err) {
          console.error(`[sendTestEmails] send threw for ${preview.key}`, err);
          results.push({ key: preview.key, ok: false, error: err instanceof Error ? err.message : String(err) });
        }
        if (index < previews.length - 1) await new Promise((r) => setTimeout(r, 700));
      }
      return { ok: true, to: email, results };
    } catch (err) {
      console.error("[sendTestEmails] failed", err);
      return { ok: false, reason: "error", message: err instanceof Error ? err.message : String(err) };
    }
  });
