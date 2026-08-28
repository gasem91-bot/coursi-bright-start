import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { checkAiAccess } from "@/lib/check-ai-access.functions";
import coursiLogo from "@/assets/arabic-logo.png.asset.json";
import ShaderBackground from "@/components/ui/shader-background";
import { ThemeToggle, useTheme } from "@/lib/theme";

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
  background: "var(--bg-secondary)",
  border: "1.5px solid var(--border)",
  borderRadius: "10px",
  padding: "14px 16px",
  color: "var(--text-primary)",
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

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [showForgotEmail, setShowForgotEmail] = useState(false);

  const passwordRef = useRef<HTMLInputElement>(null);

  // Deep-link from the payment-confirmation email: /login?reset=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("reset") === "1") {
      setShowForgotPassword(true);
      const prefill = params.get("email");
      if (prefill) setResetEmail(prefill);
    }
  }, []);

  // Fail-closed check. Returns null only when explicitly { ok: true }.
  // Any error, network failure, or non-ok result blocks the login.
  const checkAiSubscription = async (emailToCheck: string): Promise<string | null> => {
    let result: Awaited<ReturnType<typeof checkAiAccess>>;
    try {
      result = await checkAiAccess({ data: { email: emailToCheck } });
    } catch {
      return "تعذّر التحقق من الاشتراك. حاول مرة أخرى.";
    }
    if (result && result.ok === true) return null;
    if (result && result.ok === false && result.reason === "no_subscription") {
      return "ليس لديك اشتراك نشط في كورس الذكاء الاصطناعي. للاشتراك: coursi.ai/ai";
    }
    // not_registered or any unexpected shape → block
    return "غير مسجّل — هذا البريد الإلكتروني غير مسجّل في كورسي. تواصل مع الدعم على info@coursi.ai";
  };

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError("");
    try {
      const subError = await checkAiSubscription(email);
      if (subError !== null) {
        setError(subError);
        return; // HARD BLOCK — do not call signInWithPassword
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      } else {
        window.location.href = "/dashboard";
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError("أدخل بريدك الإلكتروني أولاً");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const subError = await checkAiSubscription(email);
      if (subError !== null) {
        setError(subError);
        return; // HARD BLOCK — do not call signInWithOtp
      }
      await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: "https://ai.portal.coursi.ai/dashboard" },
      });
      setMagicSent(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) return;
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: "https://ai.portal.coursi.ai/reset-password",
    });
    setResetLoading(false);
    if (!error) setResetSent(true);
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
      <LoginShader />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(123,53,192,0.18), transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "absolute", top: 16, left: 16, zIndex: 2 }}>
        <ThemeToggle />
      </div>
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "440px",
          background: "var(--bg-card)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          padding: "32px 24px",
        }}
      >
        <img
          src={coursiLogo.url}
          alt="COURSI"
          style={{ display: "block", margin: "0 auto", width: "130px", height: "auto", background: "transparent" }}
        />
        <p style={{ color: "var(--text-secondary)", fontSize: "13px", textAlign: "center", marginTop: "6px" }}>
          بوابة كورس الذكاء الاصطناعي
        </p>

        <div style={{ borderTop: "1px solid var(--border)", margin: "24px 0" }} />

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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                passwordRef.current?.focus();
              }
            }}
            placeholder="بريدك الإلكتروني"
            autoComplete="email"
            style={{ ...inputStyle, marginBottom: "12px" }}
            onFocus={(e) => (e.target.style.borderColor = "#7B35C0")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />

          <input
            ref={passwordRef}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleLogin();
              }
            }}
            placeholder="كلمة المرور"
            autoComplete="current-password"
            style={{ ...inputStyle, marginBottom: "20px" }}
            onFocus={(e) => (e.target.style.borderColor = "#7B35C0")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />

          <button
            type="submit"
            disabled={loading}
            className="login-btn"
          >
            {loading ? (
              <span className="login-spinner">جارٍ الدخول...</span>
            ) : (
              "دخول ←"
            )}
          </button>
        </form>

        {error && (
          <p style={{ color: "#C5545E", fontSize: "13px", textAlign: "center", marginTop: "12px" }}>
            {error}
          </p>
        )}

        <div className="login-recovery">
          <button
            type="button"
            className="recovery-link"
            onClick={() => {
              setShowForgotPassword(true);
              setShowForgotEmail(false);
            }}
          >
            نسيت كلمة المرور؟
          </button>
          <span className="recovery-divider">·</span>
          <button
            type="button"
            className="recovery-link"
            onClick={() => {
              setShowForgotEmail(true);
              setShowForgotPassword(false);
            }}
          >
            نسيت بريدك الإلكتروني؟
          </button>
        </div>

        {showForgotPassword && (
          <div className="recovery-panel">
            <div className="recovery-panel-header">
              <span>إعادة تعيين كلمة المرور</span>
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetSent(false);
                }}
              >
                ✕
              </button>
            </div>
            {resetSent ? (
              <div className="recovery-success">
                ✅ تم إرسال رابط تغيير كلمة المرور&nbsp; إلى بريدك. تحقق من صندوق الوارد.
              </div>
            ) : (
              <>
                <p className="recovery-hint">
                  أدخل بريدك الإلكتروني المسجّل وسنرسل لك رابط إعادة التعيين
                </p>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePasswordReset()}
                  placeholder="بريدك الإلكتروني"
                  className="recovery-input"
                />
                <button
                  type="button"
                  className="recovery-btn"
                  onClick={handlePasswordReset}
                  disabled={resetLoading}
                >
                  {resetLoading ? "جارٍ الإرسال..." : "أرسل رابط الاسترداد ←"}
                </button>
              </>
            )}
          </div>
        )}

        {showForgotEmail && (
          <div className="recovery-panel">
            <div className="recovery-panel-header">
              <span>استرداد البريد الإلكتروني</span>
              <button type="button" onClick={() => setShowForgotEmail(false)}>
                ✕
              </button>
            </div>
            <p className="recovery-hint">
              لاسترداد بريدك الإلكتروني المسجّل، تواصل معنا مباشرة مع ذكر اسمك الكامل ومعرّف الدفع.
            </p>
            <a
              href="mailto:support@coursi.ai?subject=استرداد البريد الإلكتروني"
              className="recovery-btn"
              style={{ display: "block", textAlign: "center", textDecoration: "none" }}
            >
              تواصل مع الدعم ←
            </a>
          </div>
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
          <div style={{ flex: 1, borderTop: "1px solid var(--border)" }} />
          <span>أو</span>
          <div style={{ flex: 1, borderTop: "1px solid var(--border)" }} />
        </div>

        {magicSent ? (
          <p style={{ color: "#3DD6A0", fontSize: "13px", textAlign: "center" }}>
            ✓ تم إرسال الرابط — راجع بريدك الإلكتروني
          </p>
        ) : (
          <button
            type="button"
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

        <a
          href="https://coursi.ai"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            color: "var(--text-secondary)",
            fontSize: "12px",
            textAlign: "center",
            marginTop: "20px",
            textDecoration: "underline",
            cursor: "pointer",
          }}
        >
          مشترك جديد؟
        </a>
      </div>

      <a
        href="https://wa.me/971561016095?text=مرحباً، أحتاج مساعدة في الدخول إلى كورسي"
        target="_blank"
        rel="noopener noreferrer"
        className="admin-chat-btn"
        aria-label="تواصل مع الدعم"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        <span>تواصل مع الدعم</span>
      </a>
    </div>
  );
}

function LoginShader() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  return (
    <div style={{ position: "absolute", inset: 0, opacity: isLight ? 0.7 : 0.55 }}>
      <ShaderBackground variant={isLight ? "light" : "dark"} />
    </div>
  );
}
