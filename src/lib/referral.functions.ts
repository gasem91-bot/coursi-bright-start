import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CURRENT_VERTICAL } from "./verticals";
import type { WalletCode } from "./referral-wallet";
import { BUNDLE_OFFERS, getBundleCheckoutUrl } from "./bundle-offers";
import { TRADING_OFFERS } from "./trading-offers";
import { buildCreditLink, earliestWalletCode } from "./wallet-credit";
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
      const { data: row, error: insertError } = await admin.from("referrals").insert({ referrer_user_id: context.userId, referred_email: email, source: "email", status: "invited", vertical: CURRENT_VERTICAL }).select().single();
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
    const rows: { id: string; referred_email: string; referred_user_id: string | null; status: string; created_at: string; signed_up_at: string | null; purchased_at: string | null; reward_issued_at: string | null; reward_code: string | null; reward_expires_at: string | null; reward_redeemed_at: string | null }[] = [];
    for (let offset = 0; ; offset += 500) {
    const { data, error } = await context.supabase.from("referrals")
      .select("id,referred_email,referred_user_id,status,created_at,signed_up_at,purchased_at,reward_issued_at,reward_code,reward_expires_at,reward_redeemed_at")
      .eq("vertical", CURRENT_VERTICAL).eq("referrer_user_id", context.userId).order("created_at", { ascending: false }).order("id").range(offset, offset + 499);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if ((data?.length ?? 0) < 500) break;
    }
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

// Wallet rows are read through owner RLS; privileged name lookups use only those authorized row IDs.
export const getMyReferralWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WalletCode[]> => {
    const rows: import("@/integrations/supabase/types").Database["public"]["Tables"]["referral_wallet_codes"]["Row"][] = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await context.supabase.from("referral_wallet_codes").select("*")
        .eq("user_id", context.userId).eq("vertical", CURRENT_VERTICAL).order("issued_at", { ascending: false }).order("id").range(offset, offset + 499);
      if (error) throw new Error(error.message);
      rows.push(...(data ?? []));
      if ((data?.length ?? 0) < 500) break;
    }
    if (!rows.length) return [];
    const { supabaseAdmin: admin } = await import("@/integrations/supabase/client.server");
    const key = process.env["STRIPE_SECRET_KEY"];
    if (!key) throw new Error("Wallet synchronization unavailable");
    const Stripe = (await import("stripe")).default;
    const { synchronizeWalletRows } = await import("./wallet-stripe.server");
    const synchronized = await synchronizeWalletRows(admin, new Stripe(key), rows);
    const { data: referrals, error: referralError } = await admin.from("referrals")
      .select("id,referrer_user_id,referred_user_id,referred_email").in("id", rows.map((r) => r.referral_id));
    if (referralError) throw new Error(referralError.message);
    const ids = [...new Set((referrals ?? []).flatMap((r) => [r.referrer_user_id, r.referred_user_id]).filter((v): v is string => !!v))];
    const { data: profiles, error: namesError } = await admin.from("profiles").select("id,full_name,display_name").in("id", ids);
    if (namesError) throw new Error(namesError.message);
    const names = new Map((profiles ?? []).map((p) => [p.id, p.full_name || p.display_name || "صديقك"]));
    const sources = new Map((referrals ?? []).map((r) => [r.id, r]));
    return synchronized.map((r) => {
      const source = sources.get(r.referral_id);
      const personId = r.kind === "friend" ? source?.referrer_user_id : source?.referred_user_id;
      return { id: r.id, vertical: r.vertical, code: r.code, kind: r.kind === "friend" ? "friend" : "reward",
        amount_cents: r.amount_cents, issued_at: r.issued_at, expires_at: r.expires_at,
        redeemed_at: r.redeemed_at, cancelled_at: r.cancelled_at,
        person: (personId && names.get(personId)) || source?.referred_email || "صديقك" };
    });
  });

const offerLinks: string[] = [
  ...BUNDLE_OFFERS.flatMap((b) => [b.coursesUrl, b.tutorsUrl]),
  ...TRADING_OFFERS.flatMap((b) => [b.courseUrl, b.botsUrl]),
];
let linkCache: { until: number; allowed: string[] } | undefined;
async function promotionEnabledLinks(stripe: import("stripe").default) {
  if (linkCache && linkCache.until > Date.now()) return linkCache.allowed;
  const allowed: string[] = [];
  for await (const link of stripe.paymentLinks.list({ limit: 100 })) {
    if (link.active && link.allow_promotion_codes && offerLinks.includes(link.url)) allowed.push(link.url);
  }
  linkCache = { until: Date.now() + 60_000, allowed };
  return allowed;
}

export const getOfferCreditLinks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const key = process.env["STRIPE_SECRET_KEY"];
    if (!key) throw new Error("Checkout unavailable");
    const Stripe = (await import("stripe")).default;
    return promotionEnabledLinks(new Stripe(key));
  });

// Caller supplies only an allowlisted base offer URL, never a user/code identity.
export const createWalletCreditLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ url: z.string().url() }).parse(input))
  .handler(async ({ context, data }) => {
    if (!offerLinks.includes(data.url)) throw new Error("Invalid offer");
    const key = process.env["STRIPE_SECRET_KEY"];
    if (!key) throw new Error("Checkout unavailable");
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(key);
    if (!(await promotionEnabledLinks(stripe)).includes(data.url)) throw new Error("Promotion codes disabled");
    const rows: import("@/integrations/supabase/types").Database["public"]["Tables"]["referral_wallet_codes"]["Row"][] = [];
    for (let offset = 0; ; offset += 500) {
      const { data: page, error } = await context.supabase.from("referral_wallet_codes").select("*").eq("user_id", context.userId).eq("vertical", CURRENT_VERTICAL).order("id").range(offset, offset + 499);
      if (error) throw error;
      rows.push(...(page ?? []));
      if ((page?.length ?? 0) < 500) break;
    }
    const { supabaseAdmin: admin } = await import("@/integrations/supabase/client.server");
    const { synchronizeWalletRows } = await import("./wallet-stripe.server");
    const synchronized = await synchronizeWalletRows(admin, stripe, rows, true);
    const chosen = earliestWalletCode(synchronized.map((r) => ({ ...r, kind: r.kind === "friend" ? "friend" as const : "reward" as const, person: "" })));
    if (!chosen) return { url: null };
    const { data: profile, error } = await context.supabase.from("profiles").select("email").eq("id", context.userId).maybeSingle();
    if (error) throw error;
    const bundle = BUNDLE_OFFERS.find((b) => b.coursesUrl === data.url || b.tutorsUrl === data.url);
    const base = bundle ? getBundleCheckoutUrl(data.url, bundle.coursesUrl === data.url ? "courses" : "tutors") : data.url;
    return { url: buildCreditLink(base, chosen.code, profile?.email || String(context.claims.email || "")) };
  });

export type AdminReferralRow = {
  vertical: string; referrer_name: string; referrer_email: string; friend_name: string; friend_email: string; status: string;
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
      vertical: r.vertical, referrer_name: nm(r.referrer_user_id), referrer_email: map.get(r.referrer_user_id)?.email || "",
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

// Friends list: caller's own referral rows plus owner-RLS mirror rows; names only for this caller's referred users.
export const getMyFriends = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<import("./referral-friends").FriendRow[]> => {
    const { buildFriendRows } = await import("./referral-friends");
    const { data: own, error } = await context.supabase.from("referrals")
      .select("id,referred_email,referred_user_id,status,vertical,signed_up_at,purchased_at")
      .eq("referrer_user_id", context.userId).order("created_at", { ascending: false }).limit(1000);
    if (error) throw new Error(error.message);
    const { data: mirror } = await context.supabase.from("referral_mirror")
      .select("key,friend_email,friend_name,status,vertical,signed_up_at,purchased_at")
      .eq("owner_user_id", context.userId).order("updated_at", { ascending: false }).limit(1000);
    const ids = (own ?? []).map((r) => r.referred_user_id).filter((v): v is string => !!v);
    const names = new Map<string, string>();
    if (ids.length) {
      const { supabaseAdmin: admin } = await import("@/integrations/supabase/client.server");
      const { data: profiles } = await admin.from("profiles").select("id,full_name,display_name").in("id", ids);
      for (const p of profiles ?? []) names.set(p.id, p.full_name || p.display_name || "");
    }
    return buildFriendRows([
      ...(own ?? []).map((r) => ({ key: r.id, email: r.referred_email, name: r.referred_user_id ? names.get(r.referred_user_id) ?? null : null, vertical: r.vertical, status: r.status, signed_up_at: r.signed_up_at, purchased_at: r.purchased_at })),
      ...(mirror ?? []).map((m) => ({ key: m.key, email: m.friend_email, name: m.friend_name, vertical: m.vertical, status: m.status, signed_up_at: m.signed_up_at, purchased_at: m.purchased_at })),
    ]);
  });
