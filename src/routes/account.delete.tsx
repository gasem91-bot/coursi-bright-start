import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { deleteMyAccount } from "@/lib/delete-account.functions";

export const Route = createFileRoute("/account/delete")({
  component: DeleteAccountPage,
  head: () => ({
    meta: [
      { title: "حذف الحساب — كورسي" },
      { name: "description", content: "حذف حسابك في كورسي نهائياً." },
      { property: "og:title", content: "حذف الحساب — كورسي" },
      { property: "og:description", content: "حذف حسابك في كورسي نهائياً." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const font = "Cairo, 'Noto Sans Arabic', sans-serif";
const RED = "#EF4444";
const btn: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", width: "100%", minHeight: 48, borderRadius: 50, fontFamily: font, fontWeight: 700, fontSize: 15, cursor: "pointer", boxSizing: "border-box", marginTop: 10 };

function DeleteAccountPage() {
  const navigate = useNavigate();
  const del = useServerFn(deleteMyAccount);
  const [ready, setReady] = useState(false);
  const [word, setWord] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/login", search: { redirect: "/account/delete" } as never });
      else setReady(true);
    });
  }, [navigate]);

  const canDelete = word.trim() === "حذف" && !busy;

  const onDelete = async () => {
    if (!canDelete) return;
    setBusy(true); setError("");
    try {
      const r = await del();
      if (!r.ok) throw new Error();
      await supabase.auth.signOut().catch(() => {});
      navigate({ to: "/goodbye" });
    } catch {
      setError("تعذّر حذف الحساب الآن. حاول مرة أخرى أو تواصل مع الدعم.");
      setBusy(false);
    }
  };

  const logout = async () => { await supabase.auth.signOut(); navigate({ to: "/login" }); };

  if (!ready) return <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }} />;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", fontFamily: font, direction: "rtl", padding: "32px 16px 64px", boxSizing: "border-box", overflowX: "hidden" }}>
      <main style={{ maxWidth: 480, margin: "0 auto", width: "100%" }}>
        <button onClick={() => navigate({ to: "/profile" })} style={{ ...btn, width: "auto", padding: "0 16px", marginTop: 0, marginBottom: 16, background: "transparent", border: "none", color: "var(--text-secondary)" }}>→ رجوع</button>
        <h1 style={{ color: "var(--text-primary)", fontSize: 26, fontWeight: 800, marginBottom: 8 }}>نأسف لرحيلك</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.9, marginBottom: 20 }}>شكراً لأنك كنت جزءاً من كورسي، سعدنا بمرافقتك في رحلة التعلّم.</p>

        <div style={{ background: "rgba(239,68,68,0.08)", border: `1px solid ${RED}66`, borderRadius: 14, padding: 18, marginBottom: 20 }}>
          <div style={{ color: RED, fontWeight: 800, marginBottom: 10 }}>⚠️ ستفقد نهائياً:</div>
          <ul style={{ color: "var(--text-primary)", fontSize: 14, lineHeight: 2, paddingInlineStart: 20, listStyle: "disc" }}>
            <li>كل تقدمك في الدورات</li>
            <li>نقاط الخبرة والإنجازات والشارات</li>
            <li>جميع الشهادات التي حصلت عليها</li>
            <li>صلاحية الوصول إلى الدورات المدفوعة</li>
          </ul>
          <div style={{ color: RED, fontWeight: 700, marginTop: 10, fontSize: 14 }}>لا يمكن التراجع عن هذا الإجراء</div>
        </div>

        <button onClick={() => navigate({ to: "/support" })} style={{ ...btn, background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>تواصل مع الدعم بدلاً من ذلك</button>
        <button onClick={logout} style={{ ...btn, background: "transparent", border: "1px solid var(--border)", color: "var(--text-primary)" }}>تسجيل الخروج فقط</button>

        <label htmlFor="confirm-word" style={{ display: "block", color: "var(--text-secondary)", fontSize: 14, marginTop: 28, marginBottom: 8 }}>للتأكيد، اكتب كلمة <b style={{ color: RED }}>حذف</b> في الحقل أدناه:</label>
        <input id="confirm-word" value={word} onChange={(e) => setWord(e.target.value)} autoComplete="off" dir="rtl"
          style={{ width: "100%", minHeight: 48, boxSizing: "border-box", borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-primary)", fontFamily: font, fontSize: 16, padding: "0 14px" }} />

        {error && <p role="alert" style={{ color: RED, fontSize: 13, marginTop: 10 }}>{error}</p>}
        <button onClick={onDelete} disabled={!canDelete} style={{ ...btn, marginTop: 16, border: "none", background: RED, color: "#fff", opacity: canDelete ? 1 : 0.4, cursor: canDelete ? "pointer" : "not-allowed" }}>
          {busy ? "جارٍ الحذف…" : "حذف حسابي نهائياً"}
        </button>
      </main>
    </div>
  );
}
