import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { inviteBlockReason, referralPurchaseLink, type InviteBlock } from "./referral-rules";

export type InviteResult = { ok: true } | { ok: false; reason: Exclude<InviteBlock, null> | "invalid" | "error" };

// Email-only invites. The referrer is always the signed-in caller.
export const inviteReferralFriend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ email: z.string().trim().max(254) }).parse(input))
  .handler(async ({ context, data }): Promise<InviteResult> => {
    const parsed = z.string().email().safeParse(data.email);
    if (!parsed.success) return { ok: false, reason: "invalid" };
    const stripeKey = process.env["STRIPE_SECRET_KEY"];
    const emailKey = process.env["RESEND_API_KEY"];
    if (!stripeKey || !emailKey) return { ok: false, reason: "error" };
    const { data: referrer, error } = await context.supabase.from("profiles").select("email,full_name,display_name,referral_code").eq("id", context.userId).single();
    if (error || !referrer?.email || !referrer.referral_code) return { ok: false, reason: "error" };
    const email = parsed.data.toLowerCase();
    const own = String(context.claims.email ?? referrer.email);
    if (inviteBlockReason(email, own, false, false) === "self" || inviteBlockReason(email, referrer.email, false, false) === "self") return { ok: false, reason: "self" };
    const { supabaseAdmin: admin } = await import("@/integrations/supabase/client.server");
    const [{ data: account }, { data: invited }] = await Promise.all([
      admin.from("profiles").select("id").ilike("email", email).limit(1),
      admin.from("referrals").select("id").eq("referred_email", email).limit(1),
    ]);
    const block = inviteBlockReason(email, own, !!account?.length, !!invited?.length);
    if (block) return { ok: false, reason: block };
    try {
      const { data: row, error: insertError } = await admin.from("referrals").insert({ referrer_user_id: context.userId, referred_email: email, source: "email", status: "invited" }).select().single();
      if (insertError || !row) return { ok: false, reason: insertError?.code === "23505" ? "already_invited" : "error" };
      const { issueFriendCode } = await import("./referral-backend.server");
      const issued = await issueFriendCode(admin, row, stripeKey);
      const { buildFriendInviteHtml, referralInviteSubject, sendReferralEmail } = await import("./referral-emails.server");
      const name = referrer.full_name || referrer.display_name || "صديقك";
      await sendReferralEmail({ to: email, subject: referralInviteSubject(name), eventKey: `referral-invite-${issued.id}`, html: buildFriendInviteHtml({
        referrerName: name, friendCode: issued.friend_code || "", purchaseLink: referralPurchaseLink(referrer.referral_code, email),
      }) }, emailKey);
      await admin.from("referrals").update({ invite_email_sent_at: new Date().toISOString() }).eq("id", issued.id);
      return { ok: true };
    } catch (e) {
      console.error("[referral] invite failed:", e instanceof Error ? e.message : e);
      return { ok: false, reason: "error" };
    }
  });

export type MyReferral = { id: string; friend: string; status: string; date: string; reward_code: string | null; reward_expires_at: string | null; reward_redeemed_at: string | null };

export const getMyReferrals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyReferral[]> => {
    const { data, error } = await context.supabase.from("referrals")
      .select("id,referred_email,referred_user_id,status,created_at,signed_up_at,purchased_at,reward_issued_at,reward_code,reward_expires_at,reward_redeemed_at")
      .eq("referrer_user_id", context.userId).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    const ids = rows.map((r) => r.referred_user_id).filter((v): v is string => !!v);
    const names = new Map<string, string>();
    if (ids.length) {
      // Only names of friends who joined through this caller's own invites.
      const { supabaseAdmin: admin } = await import("@/integrations/supabase/client.server");
      const { data: profiles } = await admin.from("profiles").select("id,full_name,display_name").in("id", ids);
      for (const p of profiles ?? []) names.set(p.id, p.full_name || p.display_name || "");
    }
    return rows.map((r) => ({
      id: r.id, friend: (r.referred_user_id && names.get(r.referred_user_id)) || r.referred_email, status: r.status,
      date: r.reward_issued_at || r.purchased_at || r.signed_up_at || r.created_at,
      reward_code: r.reward_code, reward_expires_at: r.reward_expires_at, reward_redeemed_at: r.reward_redeemed_at,
    }));
  });

export type AdminReferralRow = {
  referrer_name: string; referrer_email: string; friend_name: string; friend_email: string; status: string;
  friend_code: string; reward_code: string; created_at: string; signed_up_at: string; purchased_at: string; reward_issued_at: string;
};
export type AdminReferralsResult = { ok: true; rows: AdminReferralRow[] } | { ok: false; reason: "forbidden" | "error" };

// Admin RLS on referrals/profiles enforces access; the role check gives a friendly answer.
export const getAdminReferrals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminReferralsResult> => {
    const sb = context.supabase;
    const { data: role } = await sb.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (!role) return { ok: false, reason: "forbidden" };
    const { data, error } = await sb.from("referrals").select("*").order("created_at", { ascending: false });
    if (error) return { ok: false, reason: "error" };
    const ids = [...new Set((data ?? []).flatMap((r) => [r.referrer_user_id, r.referred_user_id]).filter((v): v is string => !!v))];
    const { data: profiles } = ids.length ? await sb.from("profiles").select("id,email,full_name,display_name").in("id", ids) : { data: [] };
    const map = new Map((profiles ?? []).map((p) => [p.id, p]));
    const nm = (id: string | null) => { const p = id ? map.get(id) : undefined; return p ? p.full_name || p.display_name || "" : ""; };
    return { ok: true, rows: (data ?? []).map((r) => ({
      referrer_name: nm(r.referrer_user_id), referrer_email: map.get(r.referrer_user_id)?.email || "",
      friend_name: nm(r.referred_user_id), friend_email: r.referred_email, status: r.status,
      friend_code: r.friend_code || "", reward_code: r.reward_code || "", created_at: r.created_at,
      signed_up_at: r.signed_up_at || "", purchased_at: r.purchased_at || "", reward_issued_at: r.reward_issued_at || "",
    })) };
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
