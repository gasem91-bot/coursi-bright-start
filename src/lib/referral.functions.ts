import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Backend command for the later account UI; no current page is changed.
export const inviteReferralFriend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ email: z.string().trim().email().max(254), source: z.enum(["link", "whatsapp", "email"]).default("email") }).parse(input))
  .handler(async ({ context, data }) => {
    const stripeKey = process.env["STRIPE_SECRET_KEY"];
    const emailKey = process.env["RESEND_API_KEY"];
    if (!stripeKey || !emailKey) throw new Error("Referral credentials missing");
    const { supabaseAdmin: admin } = await import("@/integrations/supabase/client.server");
    const { data: referrer, error } = await context.supabase.from("profiles").select("email,full_name,display_name,referral_code").eq("id", context.userId).single();
    if (error || !referrer?.email) throw new Error("Profile unavailable");
    const email = data.email.toLowerCase();
    if (email === referrer.email.trim().toLowerCase()) return { ok: true };
    const { data: existing, error: existingError } = await admin.from("profiles").select("id").ilike("email", email).limit(1);
    if (existingError) throw existingError;
    if (existing?.length) return { ok: true };
    const { data: inserted, error: insertError } = await admin.from("referrals").upsert({ referrer_user_id: context.userId, referred_email: email, source: data.source }, { onConflict: "referred_email", ignoreDuplicates: true }).select().maybeSingle();
    if (insertError) throw insertError;
    let invitation = inserted;
    if (!invitation) {
      const { data: pending, error: pendingError } = await admin.from("referrals").select().eq("referred_email", email).eq("referrer_user_id", context.userId).eq("status", "invited").maybeSingle();
      if (pendingError) throw pendingError;
      invitation = pending;
    }
    if (!invitation || invitation.invite_email_sent_at) return { ok: true };
    const { issueFriendCode } = await import("./referral-backend.server");
    const row = await issueFriendCode(admin, invitation, stripeKey);
    const { buildFriendInviteHtml, referralInviteSubject, sendReferralEmail } = await import("./referral-emails.server");
    const name = referrer.full_name || referrer.display_name || "صديقك";
    await sendReferralEmail({ to: email, subject: referralInviteSubject(name), eventKey: `referral-invite-${row.id}`, html: buildFriendInviteHtml({
      referrerName: name, friendCode: row.friend_code || "", purchaseLink: `https://coursi.ai/ai?ref=${encodeURIComponent(referrer.referral_code || "")}`,
    }) }, emailKey);
    const { error: sentError } = await admin.from("referrals").update({ invite_email_sent_at: new Date().toISOString() }).eq("id", row.id);
    if (sentError) throw sentError;
    return { ok: true };
  });

// Only retries a server-recorded new signup; never accepts a user ID or ref from login.
export const finishPendingReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const stripe = process.env["STRIPE_SECRET_KEY"];
    const email = process.env["RESEND_API_KEY"];
    if (!stripe || !email) throw new Error("Referral credentials missing");
    const { applySignupReferral } = await import("./referral-backend.server");
    await applySignupReferral(context.userId, { stripe, email });
    return { ok: true };
  });