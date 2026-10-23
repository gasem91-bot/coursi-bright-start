import { adminEmails } from "./admin-allowlist.server";
import { countPayingSubscribers, type StatsSubscription, type StatsUser } from "./subscriber-stats";

export async function getPayingSubscriberStats() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const subscriptions: StatsSubscription[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabaseAdmin.from("subscriptions")
      .select("user_id,tier,status,amount_paid_cents,amount").eq("status", "active")
      .order("id").range(from, from + 999);
    if (error) throw new Error("Subscriber lookup failed");
    subscriptions.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  const users: StatsUser[] = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error("Account exclusion lookup failed");
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }
  return countPayingSubscribers(subscriptions, users, adminEmails());
}