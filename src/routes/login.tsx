import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import coursiLogo from "@/assets/coursi-logo.png";
import ShaderBackground from "@/components/ui/shader-background";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — COURSI AI Portal" },
      { name: "description", content: "بوابة كورس الذكاء الاصطناعي — تسجيل الدخول" },
    ],
  }),
});

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-card)",
  border: "1.5px solid #1E1E1E",
  borderRadius: "10px",
  padding: "14px 16px",
  color: "white",
  fontSize: "16px",
  direction: "rtl",
  outline: "none",
  fontFamily: "Noto Sans Arabic, sans-serif",
};

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [magicSent, setMagicSent] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      setLoading(false);
    } else {
      window.location.href = "/dashboard";
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError("أدخل بريدك الإلكتروني أولاً");
      return;
    }
    setLoading(true);
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: "https://portal.coursi.ai/dashboard" },
    });
    setLoading(false);
    setMagicSent(true);
  };

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        background: "var(--bg-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0, opacity: 0.55 }}>
        <ShaderBackground />
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(123,53,192,0.18), transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "440px",
          background: "rgba(13,13,13,0.82)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid #1E1E1E",
          borderRadius: "20px",
          padding: "40px 36px",
        }}
      >
        <img
          src={coursiLogo}
          alt="COURSI"
          style={{ display: "block", margin: "0 auto", width: "140px", height: "auto" }}
        />
        <p style={{ color: "var(--text-secondary)", fontSize: "13px", textAlign: "center", marginTop: "6px" }}>
          بوابة كورس الذكاء الاصطناعي
        </p>

        <div style={{ borderTop: "1px solid #1E1E1E", margin: "24px 0" }} />

        <h2 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "22px", textAlign: "center" }}>
          مرحباً بك
        </h2>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "14px",
            textAlign: "center",
            marginTop: "6px",
            marginBottom: "28px",
          }}
        >
          أدخل بياناتك للدخول لكورسك
        </p>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="بريدك الإلكتروني"
          autoComplete="email"
          style={{ ...inputStyle, marginBottom: "12px" }}
          onFocus={(e) => (e.target.style.borderColor = "#7B35C0")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="كلمة المرور"
          autoComplete="current-password"
          style={{ ...inputStyle, marginBottom: "20px" }}
          onFocus={(e) => (e.target.style.borderColor = "#7B35C0")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            background: "linear-gradient(135deg, #7B35C0, #40C8C8)",
            color: "white",
            fontSize: "16px",
            fontWeight: 700,
            padding: "16px",
            borderRadius: "50px",
            border: "none",
            width: "100%",
            boxShadow: "0 0 24px rgba(123,53,192,0.35)",
            fontFamily: "Noto Sans Arabic, sans-serif",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "دخول..." : "دخول ←"}
        </button>

        {error && (
          <p style={{ color: "#C5545E", fontSize: "13px", textAlign: "center", marginTop: "12px" }}>
            {error}
          </p>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            margin: "20px 0",
            color: "var(--text-secondary)",
            fontSize: "13px",
          }}
        >
          <div style={{ flex: 1, borderTop: "1px solid #1E1E1E" }} />
          <span>أو</span>
          <div style={{ flex: 1, borderTop: "1px solid #1E1E1E" }} />
        </div>

        {magicSent ? (
          <p style={{ color: "#3DD6A0", fontSize: "13px", textAlign: "center" }}>
            ✓ تم إرسال الرابط — راجع بريدك الإلكتروني
          </p>
        ) : (
          <button
            onClick={handleMagicLink}
            disabled={loading}
            style={{
              background: "transparent",
              border: "1px solid #1E1E1E",
              color: "var(--text-secondary)",
              fontSize: "14px",
              fontWeight: 600,
              padding: "13px",
              borderRadius: "50px",
              width: "100%",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "Noto Sans Arabic, sans-serif",
            }}
          >
            أرسل لي رابط الدخول بدون كلمة مرور
          </button>
        )}

        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "12px",
            textAlign: "center",
            marginTop: "20px",
          }}
        >
          مشترك جديد؟ تحقق من بريدك الإلكتروني للحصول على رابط الدخول الأول.
        </p>
      </div>
    </div>
  );
}
