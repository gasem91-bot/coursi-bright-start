import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ClientRow = {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  nationality: string;
  level: string;
  active: boolean;
  tier: string;
  tutor: boolean;
  promo_code: string;
  amount_paid: number;
  currency: string;
  signup_date: string;
  last_activity: string;
  chapters_completed: number;
};
export type CertificateRow = { certificate_id: string; full_name: string; email: string; level: string; score: number; total: number; issued_at: string; active: boolean; tier: string; tutor: boolean; promo_code: string };
export type RatingRow = { full_name: string; email: string; level: string; rating: number; comment: string; created_at: string; active: boolean; tier: string; tutor: boolean; promo_code: string };
export type PaymentRow = { purchased_at: string; full_name: string; email: string; level: string; tier: string; tutor: boolean; amount_paid: number; currency: string; promo_code: string; active: boolean };

export type AdminDataResult =
  | { ok: true; clients: ClientRow[]; certificates: CertificateRow[]; ratings: RatingRow[]; payments: PaymentRow[] }
  | { ok: false; reason: "forbidden" | "error"; message?: string };

export const getAdminData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminDataResult> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = context.supabase as any;
    const { data: role } = await sb
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) return { ok: false, reason: "forbidden" };

    // RLS lets admins read every row; page through to avoid the 1000-row cap.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const all = async (table: string, cols: string): Promise<any[]> => {
      const out: unknown[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await sb.from(table).select(cols).range(from, from + 999);
        if (error) throw new Error(`${table}: ${error.message}`);
        out.push(...(data ?? []));
        if (!data || data.length < 1000) break;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return out as any[];
    };

    try {
      const [profiles, subs, certs, ratings, progress] = await Promise.all([
        all("profiles", "id,email,full_name,display_name,mobile,nationality,nationality_name,level,created_at,last_active_date"),
        all("subscriptions", "user_id,tier,status,amount,currency,promo_code,amount_paid_cents,purchased_at,created_at"),
        all("certificates", "user_id,certificate_id,level,score,total,issued_at"),
        all("level_ratings", "user_id,level,rating,comment,created_at"),
        all("course_progress", "user_id,chapter_id,completed,updated_at"),
      ]);

      const subsByUser = new Map<string, typeof subs>();
      for (const s of subs) {
        const arr = subsByUser.get(s.user_id) ?? [];
        arr.push(s);
        subsByUser.set(s.user_id, arr);
      }
      const profById = new Map(profiles.map((p) => [p.id, p]));
      const progByUser = new Map<string, typeof progress>();
      for (const r of progress) {
        const arr = progByUser.get(r.user_id) ?? [];
        arr.push(r);
        progByUser.set(r.user_id, arr);
      }

      const summary = (uid: string) => {
        const list = subsByUser.get(uid) ?? [];
        const activeSubs = list.filter((s) => s.status === "active");
        const active = activeSubs.length > 0;
        const tutor = activeSubs.some((s) => s.tier === "course_ai");
        const latest = [...list].sort((a, b) => String(b.purchased_at ?? b.created_at).localeCompare(String(a.purchased_at ?? a.created_at)))[0];
        const promo = list.find((s) => s.promo_code)?.promo_code ?? "";
        const paid = list.reduce((n, s) => n + (s.amount_paid_cents != null ? s.amount_paid_cents / 100 : Number(s.amount ?? 0)), 0);
        return { active, tutor, tier: tutor ? "course_ai" : "course", promo_code: promo, amount_paid: Math.round(paid * 100) / 100, currency: latest?.currency ?? "USD" };
      };
      const nameOf = (p: { full_name?: string; display_name?: string; email?: string } | undefined) =>
        p?.full_name || p?.display_name || "";

      const clients: ClientRow[] = profiles.map((p) => {
        const s = summary(p.id);
        const prog = progByUser.get(p.id) ?? [];
        const prefix = `ai-${p.level}-`;
        const done = new Set(prog.filter((r) => r.completed && String(r.chapter_id).startsWith(prefix)).map((r) => r.chapter_id)).size;
        const lastProg = prog.reduce((m, r) => (String(r.updated_at) > m ? String(r.updated_at) : m), "");
        const lastActive = [lastProg, p.last_active_date ?? ""].sort().pop() ?? "";
        return {
          id: p.id,
          full_name: nameOf(p),
          email: p.email ?? "",
          mobile: p.mobile ?? "",
          nationality: p.nationality_name || p.nationality || "",
          level: p.level,
          ...s,
          signup_date: p.created_at,
          last_activity: lastActive,
          chapters_completed: Math.min(12, done),
        };
      });

      const certificates: CertificateRow[] = certs.map((c) => {
        const p = profById.get(c.user_id);
        const s = summary(c.user_id);
        return { certificate_id: c.certificate_id, full_name: nameOf(p), email: p?.email ?? "", level: c.level, score: c.score, total: c.total, issued_at: c.issued_at, active: s.active, tier: s.tier, tutor: s.tutor, promo_code: s.promo_code };
      });

      const ratingRows: RatingRow[] = ratings.map((r) => {
        const p = profById.get(r.user_id);
        const s = summary(r.user_id);
        return { full_name: nameOf(p), email: p?.email ?? "", level: r.level, rating: r.rating, comment: r.comment ?? "", created_at: r.created_at, active: s.active, tier: s.tier, tutor: s.tutor, promo_code: s.promo_code };
      });

      const payments: PaymentRow[] = subs.map((s) => {
        const p = profById.get(s.user_id);
        return {
          purchased_at: s.purchased_at ?? s.created_at,
          full_name: nameOf(p),
          email: p?.email ?? "",
          level: p?.level ?? "",
          tier: s.tier,
          tutor: s.tier === "course_ai",
          amount_paid: s.amount_paid_cents != null ? s.amount_paid_cents / 100 : Number(s.amount ?? 0),
          currency: s.currency ?? "USD",
          promo_code: s.promo_code ?? "",
          active: s.status === "active",
        };
      });

      return { ok: true, clients, certificates, ratings: ratingRows, payments };
    } catch (err) {
      console.error("[getAdminData]", err);
      return { ok: false, reason: "error", message: err instanceof Error ? err.message : String(err) };
    }
  });
