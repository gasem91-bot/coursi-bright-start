import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { applyStripeWalletTruth } from "./wallet-credit";

type Admin = SupabaseClient<Database>;
type Row = Database["public"]["Tables"]["referral_wallet_codes"]["Row"];
// Per-isolate, bounded short cache. Verified events and checkout selections bypass it.
const cache = new Map<string, { until: number; promo: Stripe.PromotionCode }>();
const inFlight = new Map<string, Promise<Stripe.PromotionCode>>();
export async function walletPromotion(stripe: Stripe, code: string, force = false) {
  const cached = cache.get(code);
  if (!force && cached && cached.until > Date.now()) return cached.promo;
  if (!force) { const pending = inFlight.get(code); if (pending) return pending; }
  const lookup = (async () => {
    const result = await stripe.promotionCodes.list({ code, limit: 1 });
    const promo = result.data[0];
    if (!promo) throw new Error("Wallet promotion not found");
    if (cache.size >= 1000) cache.clear();
    cache.set(code, { until: Date.now() + 60_000, promo });
    return promo;
  })();
  inFlight.set(code, lookup);
  try { return await lookup; } finally { if (inFlight.get(code) === lookup) inFlight.delete(code); }
}

export async function synchronizeWalletRows(admin: Admin, stripe: Stripe, rows: Row[], force = false): Promise<Row[]> {
  const updated: Row[] = [];
  // Batches keep Stripe concurrency modest even for large wallets.
  for (let offset = 0; offset < rows.length; offset += 5) {
    updated.push(...await Promise.all(rows.slice(offset, offset + 5).map(async (row) => {
      const promo = await walletPromotion(stripe, row.code, force);
      const next = applyStripeWalletTruth(row, promo);
      if (next.redeemed_at === row.redeemed_at && next.cancelled_at === row.cancelled_at && next.expires_at === row.expires_at) return row;
      const ledger = row.kind === "friend"
        ? { friend_code_redeemed_at: next.redeemed_at, friend_code_expires_at: next.expires_at }
        : { reward_redeemed_at: next.redeemed_at, reward_expires_at: next.expires_at };
      const { error } = await admin.from("referrals").update(ledger).eq("id", row.referral_id);
      if (error) throw error;
      // Cancellation also covers a promotion disabled directly in Stripe.
      const { error: walletError } = await admin.from("referral_wallet_codes").update({ redeemed_at: next.redeemed_at, cancelled_at: next.cancelled_at, expires_at: next.expires_at }).eq("id", row.id).eq("user_id", row.user_id);
      if (walletError) throw walletError;
      return next;
    })));
  }
  return updated;
}

export async function synchronizeSessionWallets(admin: Admin, stripe: Stripe, session: Stripe.Checkout.Session, promoCode?: string | null) {
  const email = (session.customer_email || session.customer_details?.email || "").trim().toLowerCase();
  const users = new Set<string>();
  if (email) {
    const { data, error } = await admin.from("profiles").select("id").ilike("email", email);
    if (error) throw error;
    for (const p of data ?? []) users.add(p.id);
  }
  const { data: referrals, error } = await admin.from("referrals").select("referrer_user_id,referred_user_id").eq("stripe_session_id", session.id);
  if (error) throw error;
  for (const row of referrals ?? []) { users.add(row.referrer_user_id); if (row.referred_user_id) users.add(row.referred_user_id); }
  if (promoCode) {
    const { data, error: promoError } = await admin.from("referral_wallet_codes").select("user_id").eq("code", promoCode);
    if (promoError) throw promoError;
    for (const row of data ?? []) users.add(row.user_id);
  }
  if (!users.size) return;
  for (let offset = 0; ; offset += 500) {
    const { data, error: walletError } = await admin.from("referral_wallet_codes").select("*").in("user_id", [...users]).order("id").range(offset, offset + 499);
    if (walletError) throw walletError;
    await synchronizeWalletRows(admin, stripe, data ?? [], true);
    if ((data?.length ?? 0) < 500) break;
  }
}