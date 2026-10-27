import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sendBrandedPasswordReset } from "@/lib/reset-email.functions";
import { sendBrandedMagicLink } from "@/lib/magiclink-email.functions";
import { sendLoginCode } from "@/lib/native-register.functions";
import { checkAiAccess } from "@/lib/check-ai-access.functions";
import coursiLogo from "@/assets/arabic-logo.png.asset.json";
import ShaderBackground from "@/components/ui/shader-background";
import { ThemeToggle, useTheme } from "@/lib/theme";
import { isNative, openExternal, useIsNative } from "@/lib/native";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — COURSI AI Portal" },
      { name: "description", content: "بوابة كورس الذكاء الاصطناعي — تسجيل الدخول" },
    ],
  }),
});

// Same-origin path from ?redirect=…, defaulting to the dashboard.
function safeRedirect(): string {
  const r = new URLSearchParams(window.location.search).get("redirect") ?? "";
  return r.startsWith("/") && !r.startsWith("//") ? r : "/dashboard";
}

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
  const native = useIsNative();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  // Native app: sign-in code typed inside the app (no browser hop).
  const [loginCode, setLoginCode] = useState("");

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [showForgotEmail, setShowForgotEmail] = useState(false);

  const passwordRef = useRef<HTMLInputElement>(null);

  // Already signed in (persisted session)? Skip the login form.
  // Keep ?reset=1 deep links on the form so password resets still work.
  // Magic links land here as ?token_hash=…&type=magiclink: the token is only
  // redeemed by this page's script, so email link scanners (which fetch the
  // URL without running JS) can no longer burn the single-use token.
  const [pausedPrompt, setPausedPrompt] = useState(false);
  const [pausedNotice, setPausedNotice] = useState(false);

  // Paused accounts keep the session only long enough to confirm reactivation.
  const isActiveAccount = async (): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase.from("profiles").select("is_active").eq("id", user.id).maybeSingle();
    if (data && data.is_active === false) {
      setPausedPrompt(true);
      return false;
    }
    return true;
  };

  const reactivate = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from("profiles").update({ is_active: true, deactivated_at: null }).eq("id", user.id);
      if (!error) { window.location.href = safeRedirect(); return; }
    }
    setError("تعذّر إعادة تفعيل الحساب. حاول مرة أخرى أو تواصل مع الدعم.");
    setLoading(false);
  };

  const cancelReactivate = async () => {
    await supabase.auth.signOut();
    setPausedPrompt(false);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("paused") === "1") setPausedNotice(true);
    if (params.get("reset") === "1") return;
    const tokenHash = params.get("token_hash");
    if (tokenHash) {
      supabase.auth
        .verifyOtp({ token_hash: tokenHash, type: "magiclink" })
        .then(async ({ data, error }) => {
          if (data?.session && !error) {
            if (await isActiveAccount()) window.location.replace(safeRedirect());
          } else setError("انتهت صلاحية رابط الدخول أو استُخدم من قبل. اطلب رابطاً جديداً.");
        });
      return;
    }
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session && (await isActiveAccount())) window.location.replace(safeRedirect());
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


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
    if (isNative() && result && result.ok === false && result.reason === "no_subscription") {
      return null; // signed in without a plan -> in-app plans screen (see useNativePaywall)
    }
    if (isNative() && result && result.ok === false && result.reason === "not_registered") {
      return "لا يوجد حساب بهذا البريد. أنشئ حساباً جديداً من الأسفل.";
    }
    if (result && result.ok === false && result.reason === "no_subscription") {
      return "ليس لديك اشتراك نشط في كورس الذكاء الاصطناعي. للاشتراك: coursi.ai/ai";
    }
    // not_registered or any unexpected shape → block
    return "غير مسجّل — هذا البريد الإلكتروني غير مسجّل في كورسي. تواصل مع الدعم على support@coursi.ai";
  };

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) return;
    setLoading(true);
    setError("");
    try {
      const subError = await checkAiSubscription(cleanEmail);
      if (subError !== null) {
        setError(subError);
        return; // HARD BLOCK — do not call signInWithPassword
      }
      const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      } else if (await isActiveAccount()) {
        window.location.href = safeRedirect();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError("أدخل بريدك الإلكتروني أولاً");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const subError = await checkAiSubscription(cleanEmail);
      if (subError !== null) {
        setError(subError);
        return; // HARD BLOCK — do not call signInWithOtp
      }
      if (isNative()) {
        await sendLoginCode({ data: { email: cleanEmail } });
      } else {
        await sendBrandedMagicLink({
          data: { email: cleanEmail, redirectTo: "https://ai.portal.coursi.ai/dashboard" },
        });
      }
      setMagicSent(true);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLoginCode = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const token = loginCode.replace(/\D/g, "");
    if (!cleanEmail || token.length < 6) { setError("أدخل الرمز المكوّن من ٦ أرقام"); return; }
    setLoading(true);
    setError("");
    try {
      let res = await supabase.auth.verifyOtp({ email: cleanEmail, token, type: "email" });
      if (res.error || !res.data.session) res = await supabase.auth.verifyOtp({ email: cleanEmail, token, type: "magiclink" });
      if (res.error || !res.data.session) { setError("الرمز غير صحيح أو انتهت صلاحيته"); return; }
      if (await isActiveAccount()) window.location.href = safeRedirect();
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) return;
    setResetLoading(true);
    try {
      await sendBrandedPasswordReset({ data: { email: resetEmail } });
      setResetSent(true);
    } finally {
      setResetLoading(false);
    }
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

        {pausedNotice && !pausedPrompt && (
          <p style={{ color: "var(--text-secondary)", fontSize: 13, textAlign: "center", marginTop: 12, lineHeight: 1.8 }}>
            تم تعطيل حسابك مؤقتاً. يمكنك العودة في أي وقت بتسجيل الدخول مرة أخرى.
          </p>
        )}

        {pausedPrompt && (
          <div role="alertdialog" style={{ marginTop: 16, background: "var(--bg-card)", border: "1px solid var(--accent-purple-border)", borderRadius: 14, padding: 18, textAlign: "center" }}>
            <div style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: 16, marginBottom: 6 }}>مرحباً بعودتك! 👋</div>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.8, marginBottom: 12 }}>حسابك متوقف مؤقتاً، وكل تقدمك وشهاداتك محفوظة. هل تريد إعادة تفعيله الآن؟</p>
            <button type="button" onClick={reactivate} disabled={loading} style={{ width: "100%", minHeight: 48, border: "none", borderRadius: 50, background: "linear-gradient(135deg, #7B35C0, #40C8C8)", color: "#fff", fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
              إعادة تفعيل حسابي
            </button>
            <button type="button" onClick={cancelReactivate} style={{ width: "100%", minHeight: 48, marginTop: 8, background: "transparent", border: "1px solid var(--border)", borderRadius: 50, color: "var(--text-primary)", fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
              ليس الآن
            </button>
          </div>
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
                  {resetLoading ? "جارٍ الإرسال..." : "أرسل الرابط ←"}
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

        {magicSent && native ? (
          <div>
            <p style={{ color: "#3DD6A0", fontSize: "13px", textAlign: "center", marginBottom: 10 }}>
              ✓ أرسلنا رمزاً من ٦ أرقام إلى بريدك — اكتبه هنا
            </p>
            <input
              inputMode="numeric"
              maxLength={8}
              value={loginCode}
              onChange={(e) => setLoginCode(e.target.value)}
              placeholder="000000"
              autoComplete="one-time-code"
              style={{ ...inputStyle, textAlign: "center", letterSpacing: 8, fontSize: 22, direction: "ltr", marginBottom: 10 }}
            />
            <button type="button" className="login-btn" disabled={loading} onClick={handleVerifyLoginCode}>
              تأكيد الرمز ←
            </button>
          </div>
        ) : magicSent ? (
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
            {native ? "أرسل لي رمز دخول إلى بريدي" : "أرسل لي رابط الدخول بدون كلمة مرور"}
          </button>
        )}

        {native ? (
          <a
            href="/register"
            style={{
              display: "block",
              color: "var(--accent-cyan-text)",
              fontSize: "14px",
              fontWeight: 700,
              textAlign: "center",
              marginTop: "20px",
            }}
          >
            مستخدم جديد؟ أنشئ حساباً
          </a>
        ) : (
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
        )}
      </div>

      <a
        href="https://t.me/CoursiSupportBot"
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          if (isNative()) {
            e.preventDefault();
            void openExternal("https://t.me/CoursiSupportBot");
          }
        }}
        className="admin-chat-btn"
        aria-label="تواصل مع الدعم عبر تيليجرام"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
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
