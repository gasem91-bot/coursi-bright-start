import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import PortalHeader from "@/components/portal-nav";
import { supabase } from "@/integrations/supabase/client";
import { getAdminReferrals, type AdminReferralRow } from "@/lib/referral.functions";

export const Route = createFileRoute("/admin/referrals")({
  head: () => ({
    meta: [
      { title: "الدعوات — لوحة كورسي" },
      { name: "description", content: "صفحة داخلية للمشرفين لمتابعة دعوات الأصدقاء والخصومات." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "الدعوات — لوحة كورسي" },
      { property: "og:description", content: "متابعة دعوات الأصدقاء والخصومات للمشرفين." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminReferralsPage,
});

const font = "Cairo, 'Noto Sans Arabic', sans-serif";
const box = { border: "1px solid var(--border-color, rgba(128,128,128,0.25))", borderRadius: 14, background: "var(--bg-secondary, rgba(128,128,128,0.06))" } as const;
const STATUS_AR: Record<string, string> = { invited: "تم إرسال الدعوة", signed_up: "انضم", purchased: "اشترى", rewarded: "تم منح الخصم", voided: "ملغاة" };
const day = (d: string) => (d ? d.slice(0, 10) : "");

function AdminReferralsPage() {
  const load = useServerFn(getAdminReferrals);
  const [state, setState] = useState<"loading" | "signed_out" | "forbidden" | "error" | "ready">("loading");
  const [rows, setRows] = useState<AdminReferralRow[]>([]);

  useEffect(() => {
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return setState("signed_out");
      try {
        const res = await load();
        if (!res.ok) return setState(res.reason);
        setRows(res.rows); setState("ready");
      } catch { setState("error"); }
    });
  }, [load]);

  const totals = [
    ["الدعوات", rows.length],
    ["التسجيلات", rows.filter((r) => r.signed_up_at).length],
    ["المشتريات", rows.filter((r) => r.purchased_at).length],
    ["الخصومات الممنوحة", rows.filter((r) => r.reward_code).length],
  ] as const;

  return (
    <div dir="rtl" style={{ minHeight: "100vh", fontFamily: font, background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <PortalHeader />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px 64px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>الدعوات</h1>
          <div style={{ display: "flex", gap: 16 }}>
            <Link to="/admin/data" style={{ color: "var(--accent-cyan-text)", fontSize: 14 }}>مركز البيانات</Link>
            <Link to="/admin/emails" style={{ color: "var(--accent-cyan-text)", fontSize: 14 }}>رسائل البريد التجريبية</Link>
          </div>
        </div>
        {state === "loading" && <p style={{ color: "var(--text-secondary)" }}>جاري التحميل...</p>}
        {state === "signed_out" && <div style={{ ...box, padding: 20 }}>يجب تسجيل الدخول أولاً. <Link to="/login" style={{ color: "var(--accent-cyan-text)" }}>تسجيل الدخول</Link></div>}
        {state === "forbidden" && <div style={{ ...box, padding: 20 }}>هذه الصفحة مخصّصة للمشرفين فقط.</div>}
        {state === "error" && <div style={{ ...box, padding: 20 }}>تعذّر تحميل البيانات.</div>}
        {state === "ready" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 16 }}>
              {totals.map(([l, n]) => (
                <div key={l} style={{ ...box, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{n}</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ ...box, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, whiteSpace: "nowrap" }}>
                <thead>
                  <tr>{["اسم الداعي", "بريد الداعي", "اسم الصديق", "بريد الصديق", "الحالة", "كود الصديق", "كود المكافأة", "تاريخ الدعوة", "تاريخ التسجيل", "تاريخ الشراء", "تاريخ المكافأة"].map((h) => (
                    <th key={h} style={{ textAlign: "right", padding: 10, borderBottom: "1px solid var(--border-color, rgba(128,128,128,0.25))" }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {rows.length === 0 && <tr><td colSpan={11} style={{ padding: 16, color: "var(--text-secondary)" }}>لا توجد دعوات بعد.</td></tr>}
                  {rows.map((r, i) => (
                    <tr key={i}>
                      {[r.referrer_name, r.referrer_email, r.friend_name, r.friend_email, STATUS_AR[r.status] ?? r.status, r.friend_code, r.reward_code, day(r.created_at), day(r.signed_up_at), day(r.purchased_at), day(r.reward_issued_at)].map((v, j) => (
                        <td key={j} style={{ padding: 10, borderBottom: "1px solid var(--border-color, rgba(128,128,128,0.12))" }}>{v}</td>
                      ))}
                    </tr>
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
