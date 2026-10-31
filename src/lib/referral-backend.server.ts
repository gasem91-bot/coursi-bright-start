import type Stripe from "stripe";
import { REFERRAL_ALPHABET, REFERRAL_CODE_DAYS, REFERRAL_COUPON_ID, REFERRAL_DISCOUNT_CENTS, expiresAfter, isSuccessfulPaidCheckout, canRewardReferral } from "./referral-rules";
import { buildFriendDiscountHtml, buildReferrerRewardHtml, FRIEND_DISCOUNT_SUBJECT, REFERRER_REWARD_SUBJECT, sendReferralEmail } from "./referral-emails.server";
import type { Database } from "@/integrations/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type Admin = SupabaseClient<Database>;
type Referral = Database["public"]["Tables"]["referrals"]["Row"];
const PURCHASE_LINK = "https://coursi.ai/ai";
function check(error: { message: string } | null) { if (error) throw new Error(error.message); }
function firstName(name: string | null | undefined) { return name?.trim().split(/\s+/)[0] || "صديقنا"; }
function date(iso: string) { return new Date(iso).toLocaleDateString("ar-AE", { timeZone: "UTC" }); }

// Stable readable code + provider idempotency permit retrying after partial failures.
export function promotionCodeFor(id: string, kind: "friend" | "reward") {
  const letters = id.replace(/-/g, "").split("").map((char) => REFERRAL_ALPHABET[parseInt(char, 16)]).join("");
  return `${kind === "friend" ? "FR" : "RW"}-${letters}`;
}

export async function ensurePromotion(key: string, id: string, kind: "friend" | "reward", issuedAt: string) {
  const code = promotionCodeFor(id, kind);
  const expires = Math.floor(expiresAfter(REFERRAL_CODE_DAYS, new Date(issuedAt).getTime()) / 1000);
  const headers = { Authorization: `Bearer ${key}`, "Stripe-Version": "2024-06-20" };
  const existing = await fetch(`https://api.stripe.com/v1/promotion_codes?code=${encodeURIComponent(code)}&limit=1`, { headers });
  if (!existing.ok) throw new Error(`Stripe promotion lookup failed (${existing.status})`);
  const found = (await existing.json() as { data: Array<{ id: string; code: string; expires_at: number }> }).data[0];
  if (found) return found;
  // A delayed retry must not mint an already-expired code.
  if (expires <= Math.floor(Date.now() / 1000)) throw new Error("Referral code issue window expired");
  const coupon = await fetch(`https://api.stripe.com/v1/coupons/${REFERRAL_COUPON_ID}`, { headers });
  if (!coupon.ok) throw new Error(`Required Stripe coupon ${REFERRAL_COUPON_ID} is missing`);
  const details = await coupon.json() as { valid: boolean; amount_off: number; currency: string };
  if (!details.valid || details.amount_off !== REFERRAL_DISCOUNT_CENTS || details.currency !== "usd") throw new Error("Referral coupon must be a valid $5 USD coupon");
  const body = new URLSearchParams({ coupon: REFERRAL_COUPON_ID, code, max_redemptions: "1", expires_at: String(expires) });
  const response = await fetch("https://api.stripe.com/v1/promotion_codes", {
    method: "POST", headers: { ...headers, "Content-Type": "application/x-www-form-urlencoded", "Idempotency-Key": `referral-${kind}-${id}` }, body,
  });
  if (!response.ok) throw new Error(`Stripe referral issuance failed (${response.status})`);
  return response.json() as Promise<{ id: string; code: string; expires_at: number }>;
}

export async function issueFriendCode(admin: Admin, row: Referral, stripeKey: string) {
  if (row.friend_code) return row;
  const { error: issueError } = await admin.from("referrals").update({ friend_issued_at: new Date().toISOString() }).eq("id", row.id).is("friend_issued_at", null);
  check(issueError);
  const { data: current, error: currentError } = await admin.from("referrals").select("friend_issued_at").eq("id", row.id).single();
  check(currentError);
  if (!current?.friend_issued_at) throw new Error("Friend issue timestamp missing");
  const promo = await ensurePromotion(stripeKey, row.id, "friend", current.friend_issued_at);
  const { data, error } = await admin.from("referrals").update({
    friend_code: promo.code, friend_promotion_id: promo.id, friend_code_expires_at: new Date(promo.expires_at * 1000).toISOString(),
  }).eq("id", row.id).select().single();
  check(error);
  if (!data) throw new Error("Referral disappeared during issuance");
  return data;
}

export async function applySignupReferral(userId: string, keys: { stripe: string; email: string }) {
  const stripeKey = keys.stripe;
  const emailKey = keys.email;
  if (!stripeKey || !emailKey) throw new Error("Referral Stripe/email credentials missing");
  const { supabaseAdmin: admin } = await import("@/integrations/supabase/client.server");
  const { data: claim, error: claimError } = await admin.from("referral_signup_claims").select().eq("user_id", userId).maybeSingle();
  check(claimError);
  const { data: auth, error: authError } = await admin.auth.admin.getUserById(userId);
  check(authError);
  if (!auth.user?.email_confirmed_at) return;
  // An emailed invite wins: link it and reuse its code; the invite email already carried it.
  const { data: invited, error: inviteError } = await admin.rpc("link_invited_signup", { p_user_id: userId });
  check(inviteError);
  if (invited || !claim) {
    if (claim) { const { error: clearError } = await admin.from("referral_signup_claims").delete().eq("user_id", userId); check(clearError); }
    return;
  }
  const { data: owner, error: ownerError } = await admin.from("profiles").select("id").eq("referral_code", claim.referral_code).maybeSingle();
  check(ownerError);
  if (owner) {
    const { data: referrerAuth, error: referrerAuthError } = await admin.auth.admin.getUserById(owner.id);
    check(referrerAuthError);
    if (auth.user.email?.trim().toLowerCase() === referrerAuth.user?.email?.trim().toLowerCase()) {
      const { error: eraseError } = await admin.from("referral_signup_claims").delete().eq("user_id", userId);
      check(eraseError); return;
    }
  }
  const { data: id, error } = await admin.rpc("claim_signup_referral", { p_user_id: userId, p_code: claim.referral_code, p_source: "link" });
  check(error);
  if (!id) {
    const { error: clearError } = await admin.from("referral_signup_claims").delete().eq("user_id", userId);
    check(clearError); return;
  }
  const { data: row, error: rowError } = await admin.from("referrals").select().eq("id", id).single();
  check(rowError);
  if (!row) return;
  const issued = await issueFriendCode(admin, row, stripeKey);
  if (!issued.friend_email_sent_at && issued.friend_code && issued.friend_code_expires_at) {
    const [{ data: buyer }, { data: referrer }] = await Promise.all([
      admin.from("profiles").select("full_name,display_name").eq("id", userId).single(),
      admin.from("profiles").select("full_name,display_name").eq("id", issued.referrer_user_id).single(),
    ]);
    await sendReferralEmail({ to: issued.referred_email, subject: FRIEND_DISCOUNT_SUBJECT, eventKey: `referral-friend-${id}`, html: buildFriendDiscountHtml({
      firstName: firstName(buyer?.full_name || buyer?.display_name), referrerName: referrer?.full_name || referrer?.display_name || "صديقك",
      friendCode: issued.friend_code, expiryDate: date(issued.friend_code_expires_at), purchaseLink: PURCHASE_LINK,
    }) }, emailKey);
    const { error: sentError } = await admin.from("referrals").update({ friend_email_sent_at: new Date().toISOString() }).eq("id", id);
    check(sentError);
  }
  const { error: clearError } = await admin.from("referral_signup_claims").delete().eq("user_id", userId);
  check(clearError);
}

export async function findCheckoutReferral(admin: Admin, session: Stripe.Checkout.Session, userId: string) {
  const email = (session.customer_email || session.customer_details?.email || "").trim().toLowerCase();
  const reference = session.client_reference_id;
  if (reference) {
    const { data: referrer, error } = await admin.from("profiles").select("id").eq("referral_code", reference).maybeSingle();
    check(error);
    if (referrer) {
      const { data, error: matchError } = await admin.from("referrals").select().eq("referrer_user_id", referrer.id).eq("referred_email", email).maybeSingle();
      check(matchError); if (data && (!data.referred_user_id || data.referred_user_id === userId)) return data;
    }
  }
  const { data: byEmail, error } = await admin.from("referrals").select().eq("referred_email", email).maybeSingle();
  check(error);
  if (byEmail && (!byEmail.referred_user_id || byEmail.referred_user_id === userId)) return byEmail;
  const { data, error: userError } = await admin.from("referrals").select().eq("referred_user_id", userId).maybeSingle();
  check(userError); return data;
}

// Stripe history backs up the durable ledger, including purchases made before this feature.
async function hasEarlierStripePurchase(stripe: Stripe, session: Stripe.Checkout.Session, email: string) {
  let startingAfter: string | undefined;
  do {
    const page = await stripe.checkout.sessions.list({ limit: 100, starting_after: startingAfter });
    for (const prior of page.data) {
      const address = (prior.customer_email || prior.customer_details?.email || "").trim().toLowerCase();
      if (prior.id !== session.id && prior.created <= session.created && address === email && prior.payment_status === "paid" && (prior.amount_total ?? 0) > 0) return true;
    }
    if (!page.has_more) return false;
    startingAfter = page.data.at(-1)?.id;
  } while (startingAfter);
  return false;
}

export async function processReferralCheckout(admin: Admin, stripe: Stripe, session: Stripe.Checkout.Session, userId: string, keys: { stripe: string; email: string }, promoCode: string | null) {
  if (!isSuccessfulPaidCheckout(session.payment_status, session.amount_total ?? 0, session.currency ?? "")) return;
  const now = new Date().toISOString();
  if (promoCode) {
    const { error: friendError } = await admin.from("referrals").update({ friend_code_redeemed_at: now }).eq("friend_code", promoCode).is("friend_code_redeemed_at", null);
    check(friendError);
    const { error: rewardError } = await admin.from("referrals").update({ reward_redeemed_at: now }).eq("reward_code", promoCode).is("reward_redeemed_at", null);
    check(rewardError);
  }
  const { data: firstSession, error } = await admin.rpc("record_referral_paid_purchase", {
    p_user_id: userId, p_session_id: session.id, p_paid_at: new Date(session.created * 1000).toISOString(), p_amount: (session.amount_total ?? 0) / 100,
  });
  check(error);
  let row = await findCheckoutReferral(admin, session, userId);
  if (!row || row.referrer_user_id === userId || row.status === "voided") return;
  if (row.status !== "rewarded") {
    if (!canRewardReferral(row.status, firstSession ?? "", session.id)) return;
    if (row.stripe_session_id && row.stripe_session_id !== session.id) return;
    if (await hasEarlierStripePurchase(stripe, session, row.referred_email)) return;
    const { data: legacy, error: legacyError } = await admin.from("subscriptions").select("id,amount,stripe_session_id,purchased_at,created_at").eq("user_id", userId).gt("amount", 0);
    check(legacyError);
    if ((legacy ?? []).some((s) => s.stripe_session_id !== session.id && new Date(s.purchased_at || s.created_at).getTime() <= session.created * 1000)) return;
    const { data: purchased, error: purchasedError } = await admin.from("referrals").update({ status: "purchased", referred_user_id: userId,
      stripe_session_id: session.id, purchased_at: new Date(session.created * 1000).toISOString(), order_amount_usd: (session.amount_total ?? 0) / 100,
    }).eq("id", row.id).in("status", ["invited", "signed_up", "purchased"]).or(`stripe_session_id.is.null,stripe_session_id.eq.${session.id}`).select().maybeSingle();
    check(purchasedError); if (!purchased) return;
    row = purchased;
    const issuedAt = row.reward_issued_at || now;
    const { data: issuance, error: issuanceError } = await admin.from("referrals").update({ reward_issued_at: issuedAt }).eq("id", row.id).is("reward_issued_at", null).select().maybeSingle();
    check(issuanceError);
    const { data: current, error: currentError } = await admin.from("referrals").select().eq("id", row.id).single();
    check(currentError); if (!current || current.status === "voided") return;
    const promo = await ensurePromotion(keys.stripe, row.id, "reward", issuance?.reward_issued_at || current.reward_issued_at || issuedAt);
    const { data: rewarded, error: rewardError } = await admin.from("referrals").update({ status: "rewarded", reward_code: promo.code,
      reward_promotion_id: promo.id, reward_expires_at: new Date(promo.expires_at * 1000).toISOString(),
    }).eq("id", row.id).eq("status", "purchased").select().maybeSingle();
    check(rewardError);
    if (!rewarded) {
      const { data: latest, error: latestError } = await admin.from("referrals").select("status").eq("id", row.id).single();
      check(latestError);
      if (latest?.status === "voided") await deactivateUnusedPromotion(stripe, promo.id);
      return;
    }
    row = rewarded;
  }
  if (row.stripe_session_id !== session.id || row.reward_email_sent_at || !row.reward_code || !row.reward_expires_at) return;
  const [{ data: referrer }, { data: buyer }] = await Promise.all([
    admin.from("profiles").select("email,full_name,display_name").eq("id", row.referrer_user_id).single(),
    admin.from("profiles").select("full_name,display_name").eq("id", userId).single(),
  ]);
  if (!referrer?.email || referrer.email.trim().toLowerCase() === row.referred_email) return;
  await sendReferralEmail({ to: referrer.email, subject: REFERRER_REWARD_SUBJECT, eventKey: `referral-reward-${row.id}`, html: buildReferrerRewardHtml({
    firstName: firstName(referrer.full_name || referrer.display_name), friendFirstName: firstName(buyer?.full_name || buyer?.display_name),
    rewardCode: row.reward_code, expiryDate: date(row.reward_expires_at), purchaseLink: PURCHASE_LINK,
  }) }, keys.email);
  const { error: sentError } = await admin.from("referrals").update({ reward_email_sent_at: now }).eq("id", row.id);
  check(sentError);
}

async function deactivateUnusedPromotion(stripe: Stripe, id: string) {
  const promotion = await stripe.promotionCodes.retrieve(id);
  if (promotion.times_redeemed === 0 && promotion.active) await stripe.promotionCodes.update(id, { active: false });
}

export async function processReferralRefund(admin: Admin, stripe: Stripe, charge: Stripe.Charge) {
  const paymentIntent = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!paymentIntent) return;
  const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntent, limit: 100 });
  for (const session of sessions.data) {
    const { data: row, error } = await admin.from("referrals").select().eq("stripe_session_id", session.id).maybeSingle();
    check(error); if (!row) continue;
    const { error: voidError } = await admin.from("referrals").update({ status: "voided" }).eq("id", row.id);
    check(voidError);
    if (row.reward_promotion_id && !row.reward_redeemed_at) await deactivateUnusedPromotion(stripe, row.reward_promotion_id);
  }
}