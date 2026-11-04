// Pure helpers for the account "قائمة أصدقائي" list (tested in referral-friends.test.ts).
import { getVertical } from "./verticals";

export type FriendStatus = "pending" | "joined" | "purchased";
export type FriendRow = { key: string; name: string; course: string; status: FriendStatus };
export type FriendSource = { key: string; email: string | null; name: string | null; vertical: string; status: string; signed_up_at: string | null; purchased_at: string | null };

export function maskEmail(email: string | null | undefined): string {
  const e = (email ?? "").trim().toLowerCase();
  const at = e.indexOf("@");
  if (at < 1) return "***";
  return `${e[0]}***${e.slice(at)}`;
}

export function friendStatus(s: { status: string; signed_up_at: string | null; purchased_at: string | null }): FriendStatus | null {
  if (s.status === "voided") return null;
  if (s.purchased_at || s.status === "purchased" || s.status === "rewarded") return "purchased";
  if (s.signed_up_at || s.status === "signed_up") return "joined";
  return "pending";
}

export const courseLabel = (vertical: string) => `كورسي ${getVertical(vertical).courseName}`;

export function friendsCountLabel(n: number): string {
  if (n <= 0) return "لا يوجد أصدقاء في قائمتك بعد";
  if (n === 1) return "لديك صديق واحد";
  if (n === 2) return "لديك صديقان";
  if (n <= 10) return `لديك ${n} أصدقاء`;
  return `لديك ${n} صديقاً`;
}

/** Merges local referral rows and mirrored rows; one row per friend email + course. */
export function buildFriendRows(sources: FriendSource[]): FriendRow[] {
  const seen = new Set<string>();
  const out: FriendRow[] = [];
  for (const s of sources) {
    const status = friendStatus(s);
    if (!status) continue;
    const dedupe = `${(s.email ?? s.key).trim().toLowerCase()}|${s.vertical}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    const name = s.name?.trim();
    out.push({ key: s.key, name: name || maskEmail(s.email), course: courseLabel(s.vertical), status });
  }
  return out;
}
