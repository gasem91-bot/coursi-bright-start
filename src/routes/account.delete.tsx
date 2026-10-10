import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { deleteMyAccount, deactivateMyAccount } from "@/lib/delete-account.functions";

export const Route = createFileRoute("/account/delete")({
  component: DeleteAccountPage,
  head: () => ({
    meta: [
      { title: "حذف الحساب — كورسي" },
      { name: "description", content: "تعطيل أو حذف حسابك في كورسي." },
      { property: "og:title", content: "حذف الحساب — كورسي" },
      { property: "og:description", content: "تعطيل أو حذف حسابك في كورسي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const font = "Cairo, 'Noto Sans Arabic', sans-serif";
const RED = "#EF4444";
const btn: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", width: "100%", minHeight: 48, borderRadius: 50, fontFamily: font, fontWeight: 700, fontSize: 15, cursor: "pointer", boxSizing: "border-box", marginTop: 10 };

type Reason = "no_time" | "content_fit" | "price" | "finished" | "other";
const REASONS: { id: Reason; label: string }[] = [
  { id: "no_time", label: "لم أجد الوقت الكافي" },
  { id: "content_fit", label: "المحتوى لم يناسبني" },
  { id: "price", label: "السعر مرتفع" },
  { id: "finished", label: "أنهيت ما أردت تعلمه" },
  { id: "other", label: "سبب آخر" },
];

function DeleteAccountPage() {
  const navigate = useNavigate();
  const del = useServerFn(deleteMyAccount);
  const pause = useServerFn(deactivateMyAccount);
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState<"choice" | "pause" | "delete">("choice");
  const [choice, setChoice] = useState<"pause" | "delete" | null>(null);
  const [reason, setReason] = useState<Reason | null>(null);
  const [comment, setComment] = useState("");
  const [word, setWord] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/login", search: { redirect: "/account/delete" } as never });
      else setReady(true);
    });
  }, [navigate]);

  const exitData = { reason, comment: comment.trim() || null };
  const canDelete = word.trim() === "حذف" && !busy;

  const onDelete = async () => {
    if (!canDelete) return;
    setBusy(true); setError("");
    try {
      const r = await del({ data: exitData });
      if (!r.ok) throw new Error();
      await supabase.auth.signOut().catch(() => {});
      navigate({ to: "/goodbye" });
    } catch {
      setError("تعذّر حذف الحساب الآن. حاول مرة أخرى أو تواصل مع الدعم.");
      setBusy(false);
    }
  };

  const onPause = async () => {
    setBusy(true); setError("");
    try {
      const r = await pause({ data: exitData });
      if (!r.ok) throw new Error();
      await supabase.auth.signOut().catch(() => {});
      window.location.replace("/login?paused=1");
    } catch {
      setError("تعذّر تعطيل الحساب الآن. حاول مرة أخرى أو تواصل مع الدعم.");
      setBusy(false);
    }
  };

  const logout = async () => { await supabase.auth.signOut(); navigate({ to: "/login" }); };

  if (!ready) return <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }} />;

  const reasonBlock = (
    <div style={{ marginTop: 24 }}>
      <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 15, marginBottom: 10 }}>ما السبب؟ (اختياري)</div>
      <div role="radiogroup" style={{ display: "grid", gap: 8 }}>
        {REASONS.map((r) => {
          const on = reason === r.id;
          return (
            <button key={r.id} role="radio" aria-checked={on} onClick={() => setReason(on ? null : r.id)}
              style={{ minHeight: 48, borderRadius: 12, textAlign: "right", padding: "0 14px", fontFamily: font, fontSize: 14, cursor: "pointer", background: on ? "var(--accent-purple-soft)" : "var(--bg-card)", border: `1px solid ${on ? "var(--accent-purple-border)" : "var(--border)"}`, color: "var(--text-primary)" }}>
              {on ? "● " : "○ "}{r.label}
            </button>
          );
        })}
      </div>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} placeholder="أخبرنا المزيد إن أردت (اختياري)" dir="rtl"
        style={{ width: "100%", minHeight: 90, marginTop: 10, boxSizing: "border-box", borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-primary)", fontFamily: font, fontSize: 16, padding: 12, resize: "vertical" }} />
    </div>
  );

  const back = (to: () => void) => (
    <button onClick={to} style={{ ...btn, width: "auto", padding: "0 16px", marginTop: 0, marginBottom: 16, background: "transparent", border: "none", color: "var(--text-secondary)" }}>→ رجوع</button>
  );

  const card = (id: "pause" | "delete", title: string, desc: string, danger = false) => {
    const on = choice === id;
    return (
      <button role="radio" aria-checked={on} onClick={() => setChoice(id)}
        style={{ display: "block", width: "100%", textAlign: "right", minHeight: 48, padding: 18, borderRadius: 14, marginBottom: 12, cursor: "pointer", fontFamily: font, boxSizing: "border-box", background: on ? (danger ? "rgba(239,68,68,0.08)" : "var(--accent-purple-soft)") : "var(--bg-card)", border: `2px solid ${on ? (danger ? RED : "var(--accent-purple-border)") : "var(--border)"}` }}>
        <div style={{ color: danger ? RED : "var(--text-primary)", fontWeight: 800, fontSize: 16, marginBottom: 6 }}>{on ? "● " : "○ "}{title}</div>
        <div style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.8 }}>{desc}</div>
      </button>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", fontFamily: font, direction: "rtl", padding: "32px 16px 64px", boxSizing: "border-box", overflowX: "hidden" }}>
      <main style={{ maxWidth: 480, margin: "0 auto", width: "100%" }}>
        {step === "choice" && (
          <>
            {back(() => navigate({ to: "/profile" }))}
            <h1 style={{ color: "var(--text-primary)", fontSize: 26, fontWeight: 800, marginBottom: 20 }}>قبل أن تذهب...</h1>
            <div role="radiogroup">
              {card("pause", "تعطيل حسابي مؤقتاً", "نحتفظ بتقدمك وشهاداتك، ويمكنك العودة في أي وقت بتسجيل الدخول مرة أخرى.")}
              {card("delete", "حذف حسابي نهائياً", "تُحذف بياناتك الشخصية نهائياً ولا يمكن استرجاعها.", true)}
            </div>
            <button disabled={!choice} onClick={() => choice && setStep(choice)}
              style={{ ...btn, marginTop: 16, border: "none", background: "linear-gradient(135deg, #7B35C0, #40C8C8)", color: "#fff", opacity: choice ? 1 : 0.4, cursor: choice ? "pointer" : "not-allowed" }}>متابعة</button>
          </>
        )}

        {step === "pause" && (
          <>
            {back(() => setStep("choice"))}
            <h1 style={{ color: "var(--text-primary)", fontSize: 24, fontWeight: 800, marginBottom: 8 }}>تعطيل حسابك مؤقتاً</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.9 }}>سيتم تسجيل خروجك، وسنحتفظ بكل تقدمك وشهاداتك. للعودة، سجّل الدخول مرة أخرى وأكّد إعادة التفعيل.</p>
            {reasonBlock}
            {error && <p role="alert" style={{ color: RED, fontSize: 13, marginTop: 10 }}>{error}</p>}
            <button onClick={onPause} disabled={busy} style={{ ...btn, marginTop: 20, border: "none", background: "linear-gradient(135deg, #7B35C0, #40C8C8)", color: "#fff", opacity: busy ? 0.5 : 1 }}>
              {busy ? "جارٍ التعطيل…" : "تعطيل حسابي مؤقتاً"}
            </button>
          </>
        )}

        {step === "delete" && (
          <>
            {back(() => setStep("choice"))}
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

            {reasonBlock}

            <label htmlFor="confirm-word" style={{ display: "block", color: "var(--text-secondary)", fontSize: 14, marginTop: 28, marginBottom: 8 }}>للتأكيد، اكتب كلمة <b style={{ color: RED }}>حذف</b> في الحقل أدناه:</label>
            <input id="confirm-word" value={word} onChange={(e) => setWord(e.target.value)} autoComplete="off" dir="rtl"
              style={{ width: "100%", minHeight: 48, boxSizing: "border-box", borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-primary)", fontFamily: font, fontSize: 16, padding: "0 14px" }} />

            {error && <p role="alert" style={{ color: RED, fontSize: 13, marginTop: 10 }}>{error}</p>}
            <button onClick={onDelete} disabled={!canDelete} style={{ ...btn, marginTop: 16, border: "none", background: RED, color: "#fff", opacity: canDelete ? 1 : 0.4, cursor: canDelete ? "pointer" : "not-allowed" }}>
              {busy ? "جارٍ الحذف…" : "حذف حسابي نهائياً"}
            </button>
          </>
        )}
      </main>
    </div>
  );
}
