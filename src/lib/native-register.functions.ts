import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type RegisterResult =
  | { ok: true; otpType: "signup" | "magiclink" }
  | { ok: false; error: "exists" | "invalid" | "failed" };

async function sendCode(
  email: string,
  code: string,
  purpose: "register" | "login",
): Promise<boolean> {
  const resendApiKey = process.env["RESEND_API_KEY"];
  if (!resendApiKey) {
    console.error("[verify-code] RESEND_API_KEY missing");
    return false;
  }
  const { buildVerifyCodeHtml, VERIFY_CODE_SUBJECT } = await import("./verify-code-email.server");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "كورسي <support@coursi.ai>",
      to: [email],
      subject: VERIFY_CODE_SUBJECT,
      html: buildVerifyCodeHtml({ code, email, purpose }),
    }),
  });
  if (!res.ok) console.error("[verify-code] resend error:", res.status, await res.text());
  return res.ok;
}

// Step 1 of in-app registration. Creates an UNVERIFIED auth user (no profile
// yet, so no purchase can ever attach to an unverified account) and emails a
// 6-digit code. Nothing is usable until the code is verified.
export const registerNativeAccount = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        email: z.string().trim().email().max(254),
        password: z.string().min(8).max(72),
        fullName: z.string().trim().min(2).max(80),
        referralCode: z.string().regex(/^[A-HJ-NP-Z2-9]{8}$/).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<RegisterResult> => {
    const email = data.email.toLowerCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .limit(1);
    if (existing && existing.length > 0) return { ok: false, error: "exists" };

    let otpType: "signup" | "magiclink" = "signup";
    let code: string | undefined;
    const created = await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email,
      password: data.password,
      options: { data: { full_name: data.fullName, segment: "ai" } },
    });
    code = created.data?.properties?.email_otp;
    if (!created.error && code && created.data?.user?.id && data.referralCode) {
      const { error } = await supabaseAdmin.from("referral_signup_claims").insert({
        user_id: created.data.user.id, referral_code: data.referralCode,
      });
      if (error) console.error("[register] referral capture failed:", error.message);
    }
    if (created.error || !code) {
      // An earlier, never-verified attempt may already own this address.
      const retry = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email });
      code = retry.data?.properties?.email_otp;
      otpType = "magiclink";
      if (retry.error || !code) {
        console.error(
          "[register] generateLink failed:",
          created.error?.message,
          retry.error?.message,
        );
        return { ok: false, error: "failed" };
      }
    }
    if (!(await sendCode(email, code, "register"))) return { ok: false, error: "failed" };
    return { ok: true, otpType };
  });

// Step 2 (called with the fresh session after the code is verified): creates
// the profile row and records the display name + chosen password.
export const finishNativeRegistration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({ fullName: z.string().trim().min(2).max(80), password: z.string().min(8).max(72) })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;
    const email = String(context.claims?.email ?? "").toLowerCase();
    if (!email) return { ok: false };

    const { error: pwErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: data.password,
    });
    if (pwErr) console.error("[register] set password failed:", pwErr.message);

    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();
    if (!prof) {
      const { error } = await supabaseAdmin.from("profiles").insert({
        id: userId,
        email,
        full_name: data.fullName,
        display_name: data.fullName,
        level: "beginner",
      });
      if (error) {
        console.error("[register] profile insert failed:", error.message);
        return { ok: false };
      }
    }
    const { applySignupReferral } = await import("./referral-backend.server");
    try {
      await applySignupReferral(userId);
    } catch (error) { console.error("[register] referral issuance pending:", error instanceof Error ? error.message : "failed"); }
    return { ok: true };
  });

// Passwordless sign-in for the app WITHOUT leaving it: emails a 6-digit code
// instead of a browser link. Always answers ok so existence is never leaked.
export const sendLoginCode = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ email: z.string().trim().email() }).parse(input))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const email = data.email.toLowerCase();
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: existing } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .ilike("email", email)
        .limit(1);
      if (!existing || existing.length === 0) return { ok: true };
      const link = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email });
      const code = link.data?.properties?.email_otp;
      if (code) await sendCode(email, code, "login");
    } catch (e) {
      console.error("[login-code] threw:", e);
    }
    return { ok: true };
  });
