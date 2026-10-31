import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { registerNativeAccount, finishNativeRegistration } from "@/lib/native-register.functions";
import coursiLogo from "@/assets/arabic-logo.png.asset.json";
import { gradientButton } from "@/components/iap-buy-button";
import { captureReferral } from "@/lib/referral-capture";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
  head: () => ({ meta: [{ title: "إنشاء حساب — كورسي" }] }),
});

const font = "Cairo, 'Noto Sans Arabic', sans-serif";
const input: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-secondary)",
  border: "1.5px solid var(--border)",
  borderRadius: 10,
  padding: "14px 16px",
  color: "var(--text-primary)",
  fontSize: 16,
  direction: "rtl",
  outline: "none",
  fontFamily: font,
  marginBottom: 12,
};

function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"form" | "code">("form");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [otpType, setOtpType] = useState<"signup" | "magiclink">("signup");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const start = async () => {
    setError("");
    if (fullName.trim().length < 2) return setError("اكتب اسمك الكامل");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("أدخل بريداً إلكترونياً صحيحاً");
    if (password.length < 8) return setError("كلمة المرور يجب ألا تقل عن ٨ أحرف");
    setBusy(true);
    try {
      const r = await registerNativeAccount({
        data: { email: email.trim(), password, fullName: fullName.trim(), referralCode: captureReferral() },
      });
      if (!r.ok) {
        setError(
          r.error === "exists"
            ? "هذا البريد مسجّل بالفعل. سجّل الدخول بدلاً من ذلك."
            : "تعذّر إنشاء الحساب، حاول مرة أخرى",
        );
        return;
      }
      setOtpType(r.otpType);
      setStep("code");
    } catch {
      setError("تعذّر إنشاء الحساب، حاول مرة أخرى");
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setError("");
    const token = code.replace(/\D/g, "");
    if (token.length < 6) return setError("أدخل الرمز المكوّن من ٦ أرقام");
    setBusy(true);
    try {
      const { data, error: vErr } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token,
        type: otpType,
      });
      if (vErr || !data.session) {
        setError("الرمز غير صحيح أو انتهت صلاحيته");
        return;
      }
      const fin = await finishNativeRegistration({ data: { fullName: fullName.trim(), password } });
      if (!fin.ok) {
        setError("تم التحقق لكن تعذّر إكمال الحساب. حاول تسجيل الدخول.");
        return;
      }
      toast.success("تم إنشاء حسابك ✓");
      navigate({ to: "/subscribe" });
    } catch {
      setError("حدث خطأ، حاول مرة أخرى");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: font,
        direction: "rtl",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: "32px 24px",
        }}
      >
        <img
          src={coursiLogo.url}
          alt="COURSI"
          style={{ display: "block", margin: "0 auto", width: 130, height: "auto" }}
        />
        <h2
          style={{
            color: "var(--text-primary)",
            fontWeight: 800,
            fontSize: 22,
            textAlign: "center",
            margin: "22px 0 6px",
          }}
        >
          إنشاء حساب جديد
        </h2>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: 14,
            textAlign: "center",
            marginBottom: 22,
            lineHeight: 1.8,
          }}
        >
          {step === "form"
            ? "أنشئ حسابك ثم اختر مستواك"
            : `أرسلنا رمزاً من ٦ أرقام إلى ${email.trim()}`}
        </p>

        {step === "form" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void start();
            }}
          >
            <input
              style={input}
              placeholder="الاسم الكامل"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
            />
            <input
              style={input}
              type="email"
              placeholder="بريدك الإلكتروني"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <input
              style={input}
              type="password"
              placeholder="كلمة المرور (٨ أحرف على الأقل)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            <button
              type="submit"
              disabled={busy}
              style={{ ...gradientButton, marginTop: 6, opacity: busy ? 0.6 : 1 }}
            >
              {busy ? "جارٍ الإنشاء..." : "إنشاء الحساب ←"}
            </button>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void verify();
            }}
          >
            <input
              style={{
                ...input,
                textAlign: "center",
                letterSpacing: 8,
                fontSize: 24,
                direction: "ltr",
              }}
              inputMode="numeric"
              maxLength={8}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="one-time-code"
            />
            <button
              type="submit"
              disabled={busy}
              style={{ ...gradientButton, opacity: busy ? 0.6 : 1 }}
            >
              {busy ? "جارٍ التحقق..." : "تأكيد ←"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("form");
                setCode("");
                setError("");
              }}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                marginTop: 12,
                textDecoration: "underline",
                fontFamily: font,
              }}
            >
              تغيير البريد أو إعادة الإرسال
            </button>
          </form>
        )}

        {error && (
          <p style={{ color: "#C5545E", fontSize: 13, textAlign: "center", marginTop: 12 }}>
            {error}
          </p>
        )}

        <p
          style={{
            textAlign: "center",
            marginTop: 22,
            fontSize: 13,
            color: "var(--text-secondary)",
          }}
        >
          لديك حساب؟{" "}
          <Link to="/login" style={{ color: "var(--accent-cyan-text)", fontWeight: 700 }}>
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
