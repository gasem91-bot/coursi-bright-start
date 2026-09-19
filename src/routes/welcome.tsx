import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import arabicLogo from "@/assets/arabic-logo.png.asset.json";
import { sendBrandedMagicLink } from "@/lib/magiclink-email.functions";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "أهلاً بك في COURSI" },
      { name: "description", content: "تم الدفع بنجاح - كورسك في طريقه إليك" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WelcomePage,
});

type Status = "loading" | "ready" | "email";

function WelcomePage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("loading");
  const [email, setEmail] = useState<string>("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("checkout_email") || "";
      setEmail(stored);
    } catch {}

    let attempts = 0;
    let cancelled = false;

    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        if (!cancelled) setStatus("ready");
        return true;
      }
      return false;
    };

    check().then((ok) => {
      if (ok || cancelled) return;
      const interval = setInterval(async () => {
        attempts++;
        const loggedIn = await check();
        if (loggedIn || attempts >= 15) {
          clearInterval(interval);
          if (!loggedIn && !cancelled) setStatus("email");
        }
      }, 2000);
      return () => clearInterval(interval);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session && !cancelled) setStatus("ready");
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleResend = async () => {
    if (!email) {
      toast.error("لا يوجد بريد إلكتروني محفوظ");
      return;
    }
    setResending(true);
    try {
      await sendBrandedMagicLink({
        data: { email, redirectTo: `${window.location.origin}/welcome` },
      });
      toast.success("تم إرسال الرابط إلى بريدك");
    } catch {
      toast.error("تعذّر إرسال الرابط، حاول مجدداً");
    }
    setResending(false);
  };

  return (
    <>
      <style>{`
        @keyframes welcome-pop { 0% { transform: scale(0); } 100% { transform: scale(1); } }
        @keyframes welcome-pulse { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
        @keyframes welcome-progress { 0% { width: 0%; } 100% { width: 100%; } }
        @keyframes welcome-fade { 0% { opacity: 0; transform: translateY(6px); } 100% { opacity: 1; transform: translateY(0); } }
        .welcome-page * { box-sizing: border-box; }
        .welcome-page a { text-decoration: none; }
        @media (max-width: 480px) {
          .welcome-support { flex-direction: column; }
          .welcome-support a { margin: 0 0 8px 0 !important; width: 100%; }
        }
      `}</style>
      <div
        className="welcome-page"
        dir="rtl"
        style={{
          minHeight: "100vh",
          background: "#0A0A0A",
          fontFamily: "'Noto Sans Arabic', sans-serif",
          padding: "40px 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          color: "#fff",
        }}
      >
        <div style={{ width: "100%", maxWidth: 480, textAlign: "center" }}>
          <img
            src={arabicLogo.url}
            alt="COURSI"
            style={{ width: 120, margin: "0 auto 32px", display: "block" }}
          />

          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              margin: "0 auto",
              border: "2px solid transparent",
              background:
                "linear-gradient(#0A0A0A, #0A0A0A) padding-box, linear-gradient(135deg, #7B35C0, #40C8C8) border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 36,
              animation: "welcome-pop 0.5s ease-out",
            }}
          >
            ✓
          </div>

          <h1
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: "#fff",
              marginTop: 24,
              marginBottom: 0,
            }}
          >
            🎉 تم الدفع بنجاح!
          </h1>
          <p style={{ fontSize: 16, color: "#888", marginTop: 8, marginBottom: 32 }}>
            كورسك في طريقه إليك
          </p>

          <div key={status} style={{ animation: "welcome-fade 0.3s ease-out" }}>
            {status === "loading" && <LoadingCard />}
            {status === "ready" && <ReadyCard onGo={() => navigate({ to: "/dashboard" })} />}
            {status === "email" && (
              <EmailCard onResend={handleResend} resending={resending} />
            )}
          </div>

          <div style={{ marginTop: 32, textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "#444", marginBottom: 12 }}>تحتاج مساعدة؟</p>
            <div
              className="welcome-support"
              style={{ display: "flex", justifyContent: "center" }}
            >
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
                style={{
                  background: "rgba(34,158,217,0.1)",
                  border: "1px solid rgba(34,158,217,0.3)",
                  color: "#229ED9",
                  padding: "10px 20px",
                  borderRadius: 50,
                  fontSize: 13,
                  fontWeight: 600,
                  marginLeft: 8,
                }}
              >
                تيليجرام 💬
              </a>
              <a
                href="mailto:info@coursi.ai"
                style={{
                  background: "rgba(123,53,192,0.1)",
                  border: "1px solid rgba(123,53,192,0.3)",
                  color: "#9B6ED4",
                  padding: "10px 20px",
                  borderRadius: 50,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                راسلنا ✉️
              </a>
            </div>
          </div>

          <div style={{ marginTop: 48, textAlign: "center" }}>
            <p style={{ fontSize: 12, color: "#2A2A2A", fontStyle: "italic", margin: 0 }}>
              لا تتعلّم فقط. تطوّر.
            </p>
            <p style={{ fontSize: 10, color: "#1A1A1A", marginTop: 8 }}>
              © 2025 COURS! · coursi.ai
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

const cardBase: React.CSSProperties = {
  background: "#0D0D0D",
  border: "1px solid #1E1E1E",
  borderRadius: 16,
  padding: 28,
  maxWidth: 480,
  margin: "0 auto",
  textAlign: "right",
};

function LoadingCard() {
  return (
    <>
      <div style={cardBase}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#ccc", marginTop: 0, marginBottom: 12 }}>
          ⏳ جارٍ تجهيز حسابك
        </h2>
        <p style={{ fontSize: 14, color: "#666", lineHeight: 1.9, margin: 0 }}>
          نقوم الآن بإنشاء حسابك وتجهيز كورسك المخصص. هذا يستغرق بضع ثوانٍ فقط...
        </p>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 8,
          marginTop: 20,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#7B35C0",
              animation: `welcome-pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      <div
        style={{
          marginTop: 16,
          width: "100%",
          maxWidth: 480,
          marginLeft: "auto",
          marginRight: "auto",
          height: 2,
          borderRadius: 2,
          background: "#1A1A1A",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            background: "linear-gradient(90deg, #7B35C0, #40C8C8)",
            animation: "welcome-progress 30s linear forwards",
          }}
        />
      </div>
    </>
  );
}

function ReadyCard({ onGo }: { onGo: () => void }) {
  return (
    <div style={{ ...cardBase, borderColor: "rgba(64,200,200,0.3)" }}>
      <h2
        style={{
          fontSize: 18,
          fontWeight: 900,
          color: "#40C8C8",
          marginTop: 0,
          marginBottom: 12,
        }}
      >
        ✅ حسابك جاهز!
      </h2>
      <p style={{ fontSize: 14, color: "#888", lineHeight: 1.9, marginTop: 0, marginBottom: 24 }}>
        كورسك المخصص في انتظارك. انقر أدناه للدخول مباشرةً وابدأ أول فصل من رحلتك.
      </p>
      <button
        type="button"
        onClick={onGo}
        style={{
          background: "linear-gradient(135deg, #7B35C0, #40C8C8)",
          color: "white",
          fontSize: 17,
          fontWeight: 900,
          padding: "16px 48px",
          borderRadius: 50,
          border: "none",
          cursor: "pointer",
          width: "100%",
          boxShadow: "0 8px 32px rgba(123,53,192,0.45)",
          fontFamily: "inherit",
        }}
      >
        ادخل لكورسك الآن ←
      </button>
    </div>
  );
}

function EmailCard({ onResend, resending }: { onResend: () => void; resending: boolean }) {
  return (
    <div style={{ ...cardBase, borderColor: "rgba(123,53,192,0.2)" }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "#ccc", marginTop: 0, marginBottom: 12 }}>
        📧 تحقق من بريدك الإلكتروني
      </h2>
      <p style={{ fontSize: 14, color: "#666", lineHeight: 1.9, marginTop: 0, marginBottom: 16 }}>
        أرسلنا لك رابط دخول فوري على البريد الذي استخدمته عند الدفع. انقر عليه
        وستجد نفسك داخل كورسك مباشرةً.
      </p>
      <div
        style={{
          background: "rgba(123,53,192,0.06)",
          border: "1px solid rgba(123,53,192,0.15)",
          borderRadius: 10,
          padding: "12px 16px",
          fontSize: 12,
          color: "#666",
        }}
      >
        ⏱️ الرابط صالح لمدة ٤٨ ساعة · صالح للاستخدام مرة واحدة
      </div>
      <div style={{ borderTop: "1px solid #141414", margin: "20px 0" }} />
      <p style={{ fontSize: 13, color: "#555", marginTop: 0, marginBottom: 12 }}>
        لم يصلك البريد؟
      </p>
      <button
        type="button"
        onClick={onResend}
        disabled={resending}
        style={{
          border: "1px solid #333",
          background: "transparent",
          color: "#888",
          padding: "10px 24px",
          borderRadius: 50,
          fontSize: 13,
          cursor: resending ? "wait" : "pointer",
          fontFamily: "inherit",
        }}
      >
        {resending ? "جارٍ الإرسال..." : "أعد إرسال رابط الدخول"}
      </button>
    </div>
  );
}
