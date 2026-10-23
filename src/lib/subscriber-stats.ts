export type StatsSubscription = { user_id: string | null; tier: string; status: string; amount_paid_cents: number | null; amount: number };
export type StatsUser = { id: string; email?: string; app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> };

function hasInternalTag(value: unknown): boolean {
  if (typeof value === "string") return value.trim().toLowerCase() === "internal_admin_test";
  if (Array.isArray(value)) return value.some(hasInternalTag);
  if (value && typeof value === "object") {
    return Object.entries(value).some(([key, item]) =>
      (key === "internal_admin_test" && item !== false && item != null) || hasInternalTag(item));
  }
  return false;
}

export function isExcludedStatsUser(user: StatsUser, adminAllowlist: string[]): boolean {
  const email = (user.email ?? "").trim().toLowerCase();
  return !email || adminAllowlist.some((admin) => admin.trim().toLowerCase() === email)
    || /^qa[._+-]/.test(email) || /\+[^@]*qa[^@]*@/.test(email)
    || email === "gasem91+deletetest@gmail.com"
    || hasInternalTag(user.app_metadata) || hasInternalTag(user.user_metadata);
}

// Count people, not rows. Only active positive-value purchases qualify;
// cents (when present) is authoritative, including a recorded zero payment.
export function countPayingSubscribers(subscriptions: StatsSubscription[], users: StatsUser[], adminAllowlist: string[]) {
  const eligibleUsers = new Set(users.filter((user) => !isExcludedStatsUser(user, adminAllowlist)).map((user) => user.id));
  const tiers = new Map<string, "course" | "course_ai">();
  for (const subscription of subscriptions) {
    const id = subscription.user_id;
    const paid = subscription.amount_paid_cents == null ? Number(subscription.amount) : subscription.amount_paid_cents / 100;
    if (!id || !eligibleUsers.has(id) || subscription.status !== "active" || !(paid > 0)) continue;
    if (subscription.tier !== "course" && subscription.tier !== "course_ai") continue;
    if (subscription.tier === "course_ai" || !tiers.has(id)) tiers.set(id, subscription.tier);
  }
  const course_ai = [...tiers.values()].filter((tier) => tier === "course_ai").length;
  return { total: tiers.size, course: tiers.size - course_ai, course_ai };
}