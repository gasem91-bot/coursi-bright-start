// Database/auth wiring for bundle activation. Never logs tokens or the secret.
import {
  BUNDLE_TAG, handleComplete, handleGrant, subscriptionTag,
  type ActivationRow, type CompleteDeps, type GrantDeps, type Plan,
} from "./bundle-activation";
import { normalizeEmail } from "./portal-sync";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;
const COLS = "id,email,grant_id,plan,status,used_at,last_email_at";

async function loadAdmin(): Promise<Admin> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function findUserId(admin: Admin, email: string): Promise<string | null> {
  const target = normalizeEmail(email);
  const { data } = await admin.from("profiles").select("id,email").ilike("email", target).limit(20);
  const hit = (data ?? []).find((p: { email: string | null }) => (p.email ?? "").trim().toLowerCase() === target);
  return hit?.id ?? null;
}

function grantDeps(admin: Admin): GrantDeps {
  return {
    async findByGrant(grantId) {
      const { data } = await admin.from("bundle_activations").select(COLS).eq("grant_id", grantId).maybeSingle();
      return (data as ActivationRow) ?? null;
    },
    async paidPlanFor(email) {
      const id = await findUserId(admin, email);
      if (!id) return null;
      const { data } = await admin.from("subscriptions").select("tier")
        .eq("user_id", id).eq("status", "active").not("stripe_session_id", "is", null);
      const tiers = (data ?? []).map((s: { tier: Plan }) => s.tier);
      return tiers.includes("course_ai") ? "course_ai" : tiers.includes("course") ? "course" : null;
    },
    async insert(row) {
      const { data, error } = await admin.from("bundle_activations").insert(row).select(COLS).single();
      if (error?.code === "23505") return null;
      if (error) throw new Error("activation insert failed");
      return data as ActivationRow;
    },
    async rotateToken(id, tokenHash, expiresAt) {
      const { error } = await admin.from("bundle_activations")
        .update({ token_hash: tokenHash, expires_at: expiresAt }).eq("id", id).is("used_at", null);
      if (error) throw new Error("token rotate failed");
    },
    async sendEmail(to, link) {
      const { sendBundleActivationEmail } = await import("./bundle-activation-email.server");
      return sendBundleActivationEmail(to, link);
    },
    async markEmailed(id, at) {
      await admin.from("bundle_activations").update({ last_email_at: at }).eq("id", id);
    },
  };
}

function completeDeps(admin: Admin): CompleteDeps {
  return {
    async claim(tokenHash, nowIso) {
      const { data } = await admin.from("bundle_activations").update({ used_at: nowIso })
        .eq("token_hash", tokenHash).is("used_at", null).eq("status", "pending").gt("expires_at", nowIso)
        .select(COLS).maybeSingle();
      return (data as ActivationRow) ?? null;
    },
    async release(id) {
      await admin.from("bundle_activations").update({ used_at: null }).eq("id", id).eq("status", "pending");
    },
    findUserId: (email) => findUserId(admin, email),
    async createUser(email) {
      const { data, error } = await admin.auth.admin.createUser({
        email, email_confirm: true, user_metadata: { segment: "ai", source: BUNDLE_TAG },
      });
      if (error || !data?.user?.id) throw new Error("create user failed");
      return data.user.id as string;
    },
    async getLevel(userId) {
      const { data } = await admin.from("profiles").select("level").eq("id", userId).maybeSingle();
      return (data?.level as string) ?? null;
    },
    async setLevel(userId, level) {
      const { error } = await admin.from("profiles").update({ level }).eq("id", userId);
      if (error) throw new Error("level update failed");
    },
    async grantPlan(userId, plan, grantId) {
      const tag = subscriptionTag(grantId);
      const { data: done } = await admin.from("subscriptions").select("id").eq("stripe_session_id", tag).limit(1);
      if (done?.length) return; // idempotent
      const { data: active } = await admin.from("subscriptions").select("tier")
        .eq("user_id", userId).eq("status", "active").not("stripe_session_id", "is", null);
      const tiers = (active ?? []).map((s: { tier: string }) => s.tier);
      if (tiers.includes("course_ai") || (plan === "course" && tiers.includes("course"))) return; // never downgrade
      const fields = {
        tier: plan, status: "active", stripe_session_id: tag, amount: 0, currency: "USD",
        promo_code: BUNDLE_TAG, amount_paid_cents: 0, purchased_at: new Date().toISOString(), cancelled_at: null,
      };
      // Reuse the free row a new signup gets; keep any paid row intact for accounting.
      const { data: newest } = await admin.from("subscriptions").select("id,stripe_session_id")
        .eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
      const { error } = newest && !newest.stripe_session_id
        ? await admin.from("subscriptions").update(fields).eq("id", newest.id)
        : await admin.from("subscriptions").insert({ user_id: userId, ...fields });
      if (error) throw new Error("subscription save failed");
    },
    async markActivated(id, level) {
      const { error } = await admin.from("bundle_activations").update({ status: "activated", level }).eq("id", id);
      if (error) throw new Error("mark activated failed");
    },
    async portalUrl(email) {
      const { data } = await admin.auth.admin.generateLink({
        type: "magiclink", email, options: { redirectTo: "https://ai.portal.coursi.ai/dashboard" },
      });
      const hashed = data?.properties?.hashed_token;
      return hashed
        ? `https://ai.portal.coursi.ai/login?token_hash=${encodeURIComponent(hashed)}&type=magiclink&redirect=/dashboard`
        : "https://ai.portal.coursi.ai/login";
    },
  };
}

export async function runGrant(request: Request) {
  return handleGrant({
    secret: process.env["BUNDLE_ACTIVATION_SECRET"] || undefined,
    timestamp: request.headers.get("x-timestamp"),
    signature: request.headers.get("x-signature"),
    rawBody: await request.text(),
    nowMs: Date.now(),
  }, grantDeps(await loadAdmin()));
}

export async function runComplete(request: Request) {
  return handleComplete(await request.text(), Date.now(), completeDeps(await loadAdmin()));
}
