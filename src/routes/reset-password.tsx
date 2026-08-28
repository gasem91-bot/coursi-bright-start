import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import coursiLogo from "@/assets/arabic-logo.png.asset.json";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: "تعيين كلمة مرور جديدة — COURSI AI Portal" },
      { name: "description", content: "أنشئ كلمة مرور جديدة لحسابك في بوابة كورسي" },
      { property: "og:title", content: "تعيين كلمة مرور جديدة — COURSI" },
      { property: "og:description", content: "أنشئ كلمة مرور جديدة لحسابك في بوابة كورسي" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-secondary)",
  border: "1.5px solid var(--border)",
  borderRadius: "10px",
  padding: "14px 16px",
  color: "var(--text-primary)",
  fontSize: "16px",
  direction: "rtl",
  outline: "none",
  fontFamily: "Noto Sans Arabic, sans-serif",
  marginBottom: "12px",
};

function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase recovery links deliver a session (hash or code exchange).
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async () => {
    setError("");
    if (password.length < 8) {
      setError("كلمة المرور يجب أن تكون ٨ أحرف على الأقل");
      return;
    }
    if (password !== confirm) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) {
      setError("تعذّر تحديث كلمة المرور. الرابط قد يكون منتهي الصلاحية — اطلب رابطاً جديداً");
      return;
    }
    setDone(true);
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 2000);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          padding: "32px 24px",
          direction: "rtl",
          textAlign: "right",
        }}
      >
        <img
          src={coursiLogo.url}
          alt="COURSI"
          style={{ display: "block", margin: "0 auto 20px", width: "130px", height: "auto" }}
        />
        <h1
          style={{
            color: "var(--text-primary)",
            fontSize: "20px",
            fontWeight: 700,
            textAlign: "center",
            marginBottom: "20px",
          }}
        >
          تعيين كلمة مرور جديدة
        </h1>

        {done ? (
          <p style={{ color: "#3DD6A0", textAlign: "center", fontSize: "14px" }}>
            ✅ تم تحديث كلمة المرور — يتم تحويلك إلى لوحة التحكم
          </p>
        ) : !ready ? (
          <p style={{ color: "var(--text-secondary)", textAlign: "center", fontSize: "14px" }}>
            جارٍ التحقق من رابط الاسترداد... إذا استمرت هذه الرسالة، اطلب رابطاً جديداً من صفحة
            الدخول
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور الجديدة"
              autoComplete="new-password"
              style={inputStyle}
            />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="تأكيد كلمة المرور"
              autoComplete="new-password"
              style={inputStyle}
            />
            <button type="submit" disabled={loading} className="login-btn">
              {loading ? "جارٍ الحفظ..." : "حفظ كلمة المرور ←"}
            </button>
          </form>
        )}

        {error && (
          <p style={{ color: "#C5545E", fontSize: "13px", textAlign: "center", marginTop: "12px" }}>
            {error}
          </p>
        )}

        <a
          href="/login"
          style={{
            display: "block",
            textAlign: "center",
            marginTop: "20px",
            color: "var(--text-secondary)",
            fontSize: "13px",
          }}
        >
          العودة لصفحة الدخول
        </a>
      </div>
    </div>
  );
}
