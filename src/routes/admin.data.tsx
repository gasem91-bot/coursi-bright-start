import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import PortalHeader from "@/components/portal-nav";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getAdminData, type AdminDataResult } from "@/lib/admin-data.functions";

export const Route = createFileRoute("/admin/data")({
  head: () => ({
    meta: [
      { title: "مركز البيانات — لوحة كورسي" },
      { name: "description", content: "صفحة داخلية للمشرفين لعرض بيانات العملاء والشهادات والتقييمات والمدفوعات." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "مركز البيانات — لوحة كورسي" },
      { property: "og:description", content: "بيانات العملاء والشهادات والتقييمات والمدفوعات للمشرفين." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminDataPage,
});

const font = "Cairo, 'Noto Sans Arabic', sans-serif";
const box = { border: "1px solid var(--border-color, rgba(128,128,128,0.25))", borderRadius: 14, background: "var(--bg-secondary, rgba(128,128,128,0.06))" } as const;
const LEVEL_AR: Record<string, string> = { beginner: "مبتدئ", intermediate: "متوسط", advanced: "متقدم" };
const tierAr = (t: string) => (t === "course_ai" ? "كورس + مساعد AI" : "كورس فقط");
const yes = (b: boolean) => (b ? "نعم" : "لا");
const day = (d: string) => (d ? d.slice(0, 10) : "");

type Data = Extract<AdminDataResult, { ok: true }>;
type TabKey = "clients" | "certificates" | "ratings" | "payments";
type Row = Record<string, unknown>;
type Col = { label: string; get: (r: Row) => string | number };

const TABS: { key: TabKey; label: string; dateField: string; cols: Col[] }[] = [
  {
    key: "clients", label: "العملاء", dateField: "signup_date",
    cols: [
      { label: "الاسم الكامل", get: (r) => String(r.full_name || "") },
      { label: "البريد", get: (r) => String(r.email) },
      { label: "الجوال", get: (r) => String(r.mobile || "") },
      { label: "الجنسية", get: (r) => String(r.nationality || "") },
      { label: "المستوى", get: (r) => LEVEL_AR[String(r.level)] ?? String(r.level) },
      { label: "الحالة", get: (r) => (r.active ? "نشط" : "غير نشط") },
      { label: "الباقة", get: (r) => tierAr(String(r.tier)) },
      { label: "المساعد مفعّل", get: (r) => yes(!!r.tutor) },
      { label: "كود خصم", get: (r) => yes(!!r.promo_code) },
      { label: "الكود", get: (r) => String(r.promo_code || "") },
      { label: "المبلغ المدفوع", get: (r) => Number(r.amount_paid) },
      { label: "العملة", get: (r) => String(r.currency) },
      { label: "تاريخ التسجيل", get: (r) => day(String(r.signup_date)) },
      { label: "آخر نشاط", get: (r) => day(String(r.last_activity || "")) },
      { label: "فصول المستوى المكتملة", get: (r) => Number(r.chapters_completed) },
    ],
  },
  {
    key: "certificates", label: "الشهادات", dateField: "issued_at",
    cols: [
      { label: "رمز الشهادة", get: (r) => String(r.certificate_id) },
      { label: "الاسم الكامل", get: (r) => String(r.full_name || "") },
      { label: "البريد", get: (r) => String(r.email) },
      { label: "المستوى", get: (r) => LEVEL_AR[String(r.level)] ?? String(r.level) },
      { label: "الدرجة", get: (r) => `${r.score}/${r.total}` },
      { label: "تاريخ الإصدار", get: (r) => day(String(r.issued_at)) },
    ],
  },
  {
    key: "ratings", label: "التقييمات", dateField: "created_at",
    cols: [
      { label: "الاسم", get: (r) => String(r.full_name || "") },
      { label: "البريد", get: (r) => String(r.email) },
      { label: "المستوى", get: (r) => LEVEL_AR[String(r.level)] ?? String(r.level) },
      { label: "النجوم", get: (r) => Number(r.rating) },
      { label: "التعليق", get: (r) => String(r.comment || "") },
      { label: "التاريخ", get: (r) => day(String(r.created_at)) },
    ],
  },
  {
    key: "payments", label: "المدفوعات", dateField: "purchased_at",
    cols: [
      { label: "تاريخ الشراء", get: (r) => day(String(r.purchased_at)) },
      { label: "المستخدم", get: (r) => String(r.full_name ? `${r.full_name} <${r.email}>` : r.email) },
      { label: "الباقة", get: (r) => tierAr(String(r.tier)) },
      { label: "المبلغ المدفوع", get: (r) => `${Number(r.amount_paid)} ${r.currency}` },
      { label: "كود الخصم", get: (r) => String(r.promo_code || "بدون") },
      { label: "المساعد", get: (r) => yes(!!r.tutor) },
    ],
  },
];

type Filters = { q: string; level: string; status: string; tier: string; tutor: string; promo: string; from: string; to: string };
const EMPTY: Filters = { q: "", level: "", status: "", tier: "", tutor: "", promo: "", from: "", to: "" };

function downloadCsv(name: string, cols: Col[], rows: Row[]) {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [cols.map((c) => esc(c.label)).join(","), ...rows.map((r) => cols.map((c) => esc(c.get(r))).join(","))];
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function AdminDataPage() {
  const load = useServerFn(getAdminData);
  const [state, setState] = useState<"loading" | "signed_out" | "forbidden" | "error" | "ready">("loading");
  const [error, setError] = useState("");
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState<TabKey>("clients");
  const [f, setF] = useState<Filters>(EMPTY);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) { if (!cancelled) setState("signed_out"); return; }
      try {
        const res = await load();
        if (cancelled) return;
        if (res.ok) { setData(res); setState("ready"); }
        else if (res.reason === "forbidden") setState("forbidden");
        else { setError(res.message ?? ""); setState("error"); }
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        if (/unauthor/i.test(msg)) setState("signed_out");
        else { setError(msg); setState("error"); }
      }
    })();
    return () => { cancelled = true; };
  }, [load]);

  const def = TABS.find((t) => t.key === tab)!;
  const rows = useMemo<Row[]>(() => {
    if (!data) return [];
    const src = data[tab] as unknown as Row[];
    const q = f.q.trim().toLowerCase();
    return src.filter((r) => {
      if (f.level && r.level !== f.level) return false;
      if (f.status && (f.status === "active") !== !!r.active) return false;
      if (f.tier && r.tier !== f.tier) return false;
      if (f.tutor && (f.tutor === "yes") !== !!r.tutor) return false;
      if (f.promo && (f.promo === "yes") !== !!r.promo_code) return false;
      const d = day(String(r[def.dateField] ?? ""));
      if (f.from && d < f.from) return false;
      if (f.to && d > f.to) return false;
      if (q && !def.cols.some((c) => String(c.get(r)).toLowerCase().includes(q))) return false;
      return true;
    });
  }, [data, tab, f, def]);

  const averages = useMemo(() => {
    if (!data) return [];
    return ["beginner", "intermediate", "advanced"].map((lv) => {
      const list = data.ratings.filter((r) => r.level === lv);
      const avg = list.length ? list.reduce((n, r) => n + r.rating, 0) / list.length : 0;
      return { lv, avg, count: list.length };
    });
  }, [data]);

  const set = (k: keyof Filters) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));
  const sel = (k: keyof Filters, label: string, opts: [string, string][]): ReactNode => (
    <label className="admin-data-filter">
      <span>{label}</span>
      <select value={f[k]} onChange={set(k)}>
        <option value="">الكل</option>
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );

  return (
    <div dir="rtl" style={{ minHeight: "100vh", fontFamily: font, background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <PortalHeader />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px 64px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>مركز البيانات</h1>
          <Link to="/admin/emails" style={{ color: "var(--accent-cyan-text)", fontSize: 14 }}>رسائل البريد التجريبية ←</Link>
        </div>

        {state === "loading" && <p style={{ color: "var(--text-secondary)" }}>جاري التحميل...</p>}
        {state === "signed_out" && <div style={{ ...box, padding: 20 }}>يجب تسجيل الدخول أولاً. <Link to="/login" style={{ color: "var(--accent-cyan-text)" }}>تسجيل الدخول</Link></div>}
        {state === "forbidden" && <div style={{ ...box, padding: 20 }}>هذه الصفحة مخصّصة للمشرفين فقط.</div>}
        {state === "error" && <div style={{ ...box, padding: 20 }}>تعذّر تحميل البيانات. {error}</div>}

        {state === "ready" && data && (
          <>
            <div role="tablist" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {TABS.map((t) => (
                <Button key={t.key} role="tab" aria-selected={tab === t.key} variant={tab === t.key ? "default" : "outline"} onClick={() => setTab(t.key)}>
                  {t.label} ({(data[t.key] as unknown[]).length})
                </Button>
              ))}
            </div>

            {tab === "ratings" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 16 }}>
                {averages.map((a) => (
                  <div key={a.lv} style={{ ...box, padding: 14 }}>
                    <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{LEVEL_AR[a.lv]}</div>
                    <div style={{ fontSize: 22, fontWeight: 800 }}>{a.count ? a.avg.toFixed(2) : "—"} ★</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{a.count} تقييم</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ ...box, padding: 14, marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
              <label className="admin-data-filter" style={{ flex: "1 1 220px" }}>
                <span>بحث</span>
                <input value={f.q} onChange={set("q")} placeholder="اسم، بريد، كود..." />
              </label>
              {sel("level", "المستوى", [["beginner", "مبتدئ"], ["intermediate", "متوسط"], ["advanced", "متقدم"]])}
              {sel("status", "الحالة", [["active", "نشط"], ["inactive", "غير نشط"]])}
              {sel("tier", "الباقة", [["course", "كورس فقط"], ["course_ai", "كورس + مساعد AI"]])}
              {sel("tutor", "المساعد", [["yes", "نعم"], ["no", "لا"]])}
              {sel("promo", "كود خصم", [["yes", "نعم"], ["no", "لا"]])}
              <label className="admin-data-filter"><span>من</span><input type="date" value={f.from} onChange={set("from")} /></label>
              <label className="admin-data-filter"><span>إلى</span><input type="date" value={f.to} onChange={set("to")} /></label>
              <Button variant="outline" onClick={() => setF(EMPTY)}>مسح</Button>
              <Button onClick={() => downloadCsv(tab, def.cols, rows)}>تنزيل CSV ({rows.length})</Button>
            </div>

            <div style={{ ...box, overflowX: "auto" }}>
              <table className="admin-data-table">
                <thead><tr>{def.cols.map((c) => <th key={c.label}>{c.label}</th>)}</tr></thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr><td colSpan={def.cols.length} style={{ textAlign: "center", color: "var(--text-muted)" }}>لا توجد نتائج</td></tr>
                  ) : rows.map((r, i) => (
                    <tr key={i}>{def.cols.map((c) => <td key={c.label}>{c.get(r)}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
