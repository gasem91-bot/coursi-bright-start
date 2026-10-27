// Database side of a completed Stripe checkout. Kept free of Stripe/email calls
// so it can be exercised with simulated checkouts.
// Pricing/tier rules are unchanged: PRICE_MAP decides level + tier for new
// purchases, the $10 unlock moves the profile to the next level keeping the
// tier, the $14 top-up switches the tier to course_ai.

export const AI_TOPUP_PRICE_ID = "price_1UHJcAHNdqnRfyCH72zIGsP3";
export const AI_TOPUP_PRICE_ID_LEGACY = "price_1UH5mPHNdqnRfyCHMmSUiMiK";
export const LEVEL_UPGRADE_PRICE_ID = "price_1UHK4FHNdqnRfyCHouwRtUrx";
export const NEXT_LEVEL: Record<string, string | undefined> = {
  beginner: "intermediate",
  intermediate: "advanced",
};
export const PRICE_MAP: Record<string, { level: string; tier: string }> = {
  "price_1Ts2H2HNdqnRfyCHpMVU9XNH": { level: "beginner", tier: "course" },
  "price_1Ts2H6HNdqnRfyCHBKNFey1T": { level: "beginner", tier: "course_ai" },
  "price_1Ts2H4HNdqnRfyCHY1GhNcSD": { level: "intermediate", tier: "course" },
  "price_1Ts2H2HNdqnRfyCHROQqDS9c": { level: "intermediate", tier: "course_ai" },
  "price_1Ts2H6HNdqnRfyCHwBAvcaAH": { level: "advanced", tier: "course" },
  "price_1Ts2H2HNdqnRfyCH7YX3CJ6G": { level: "advanced", tier: "course_ai" },
};

export type CheckoutInput = {
  sessionId: string;
  email: string;
  priceId: string;
  metadata: Record<string, string | undefined>;
  clientReferenceId: string | null;
  amountTotal: number | null; // cents
  currency: string | null;
  createdUnix: number | null;
  promoCode: string | null;
};

export type FulfillResult =
  | { kind: "duplicate" }
  | { kind: "level_upgrade"; userId: string; fromLevel: string; toLevel: string; keptTier: string }
  | { kind: "topup"; userId: string; level: string }
  | { kind: "purchase"; userId: string; level: string; tier: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;

async function findUserIdByEmail(admin: Admin, email: string): Promise<string | undefined> {
  const target = email.trim().toLowerCase();
  const { data } = await admin.from("profiles").select("id,email").ilike("email", target).limit(20);
  const hit = (data ?? []).find((p: { email: string | null }) => (p.email ?? "").toLowerCase() === target);
  return hit?.id;
}

async function resolveExistingUserId(admin: Admin, input: CheckoutInput) {
  return input.metadata.user_id || input.clientReferenceId || (await findUserIdByEmail(admin, input.email));
}

// Update the buyer's newest subscription row, or insert one if none exists.
async function saveSubscription(admin: Admin, userId: string, tier: string, input: CheckoutInput) {
  const fields = {
    tier,
    status: "active",
    stripe_session_id: input.sessionId,
    amount: input.amountTotal ? input.amountTotal / 100 : 0,
    currency: input.currency?.toUpperCase() || "USD",
    promo_code: input.promoCode,
    amount_paid_cents: input.amountTotal ?? 0,
    purchased_at: new Date((input.createdUnix ?? Math.floor(Date.now() / 1000)) * 1000).toISOString(),
    cancelled_at: null,
  };
  const { data: row, error: selErr } = await admin
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (selErr) throw new Error(`subscription lookup: ${selErr.message}`);
  const { error } = row?.id
    ? await admin.from("subscriptions").update(fields).eq("id", row.id)
    : await admin.from("subscriptions").insert({ user_id: userId, ...fields });
  if (error) throw new Error(`subscription save: ${error.message}`);
}

export async function fulfillCheckout(admin: Admin, input: CheckoutInput): Promise<FulfillResult> {
  // Idempotency: claim the session id first; a second delivery hits the
  // primary key and is skipped. Also honour sessions recorded before the ledger.
  const { data: seen } = await admin
    .from("subscriptions")
    .select("id")
    .eq("stripe_session_id", input.sessionId)
    .limit(1);
  if (seen && seen.length > 0) return { kind: "duplicate" };
  const { error: claimErr } = await admin
    .from("stripe_processed_sessions")
    .insert({ session_id: input.sessionId });
  if (claimErr) {
    if (claimErr.code === "23505") return { kind: "duplicate" };
    throw new Error(`idempotency claim: ${claimErr.message}`);
  }
  try {
    const result = await fulfillOnce(admin, input);
    if (result.kind !== "duplicate") {
      await admin
        .from("stripe_processed_sessions")
        .update({ user_id: result.userId, kind: result.kind })
        .eq("session_id", input.sessionId);
    }
    return result;
  } catch (err) {
    // Release the claim so Stripe's automatic retry can complete it.
    await admin.from("stripe_processed_sessions").delete().eq("session_id", input.sessionId);
    throw err;
  }
}

async function fulfillOnce(admin: Admin, input: CheckoutInput): Promise<FulfillResult> {
  const { priceId, metadata } = input;

  // $10 next-level unlock — keeps the buyer's current tier.
  if (priceId === LEVEL_UPGRADE_PRICE_ID || metadata.upgrade === "level_upgrade") {
    const userId = await resolveExistingUserId(admin, input);
    if (!userId) throw new Error("no user id for level upgrade");
    const { data: prof } = await admin.from("profiles").select("level").eq("id", userId).maybeSingle();
    const fromLevel = metadata.from_level || (prof?.level as string) || "beginner";
    const toLevel = metadata.to_level || NEXT_LEVEL[fromLevel];
    if (!toLevel) throw new Error("no target level for level upgrade");
    const { data: subs } = await admin.from("subscriptions").select("tier").eq("user_id", userId).eq("status", "active");
    const tiers = (subs ?? []).map((s: { tier: string }) => s.tier);
    const keptTier = metadata.tier || (tiers.includes("course_ai") ? "course_ai" : "course");
    const { error } = await admin.from("profiles").update({ level: toLevel }).eq("id", userId);
    if (error) throw new Error(`level upgrade profile: ${error.message}`);
    await saveSubscription(admin, userId, keptTier, input);
    return { kind: "level_upgrade", userId, fromLevel, toLevel, keptTier };
  }

  // $14 AI tutor top-up — turns the tutor on, level untouched.
  if (priceId === AI_TOPUP_PRICE_ID || priceId === AI_TOPUP_PRICE_ID_LEGACY || metadata.upgrade === "course_ai_topup") {
    const userId = await resolveExistingUserId(admin, input);
    if (!userId) throw new Error("no user id for top-up");
    await saveSubscription(admin, userId, "course_ai", input);
    return { kind: "topup", userId, level: metadata.level || "beginner" };
  }

  // New course purchase.
  const { level, tier } = PRICE_MAP[priceId] || { level: "beginner", tier: "course" };
  let userId = await findUserIdByEmail(admin, input.email);
  if (!userId) {
    const { data: created, error } = await admin.auth.admin.createUser({
      email: input.email,
      email_confirm: true,
      user_metadata: { level, tier, segment: "ai" },
    });
    if (error) {
      // An in-app registration that was never verified owns this address but has
      // no profile. The paying customer takes it over: reset its password so the
      // unverified registrant cannot use the account, and confirm the email.
      const claimed = await admin.auth.admin.generateLink({ type: "magiclink", email: input.email });
      const existingId = claimed.data?.user?.id;
      if (claimed.error || !existingId) throw error;
      const { error: takeErr } = await admin.auth.admin.updateUserById(existingId, {
        password: crypto.randomUUID() + crypto.randomUUID(),
        email_confirm: true,
        user_metadata: { level, tier, segment: "ai" },
      });
      if (takeErr) throw takeErr;
      userId = existingId;
    } else {
      userId = created.user?.id;
    }
  }
  if (!userId) throw new Error("no user id");

  const { data: updated, error: profErr } = await admin
    .from("profiles")
    .update({ level })
    .eq("id", userId)
    .select("id");
  if (profErr) throw new Error(`profile update: ${profErr.message}`);
  if (!updated || updated.length === 0) {
    const { error } = await admin.from("profiles").insert({ id: userId, email: input.email, level });
    if (error) throw new Error(`profile insert: ${error.message}`);
  }
  await saveSubscription(admin, userId, tier, input);
  return { kind: "purchase", userId, level, tier };
}
