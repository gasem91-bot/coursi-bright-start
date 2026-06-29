import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/offers")({
  component: OffersPage,
  head: () => ({ meta: [{ title: "العروض — COURSI" }] }),
});

const font = "Cairo, 'Noto Sans Arabic', sans-serif";

type Level = "beginner" | "intermediate" | "advanced";
type Tier = "course" | "course_ai";

function OffersPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState<Level>("beginner");
  const [tier, setTier] = useState<Tier>("course");
  const [referralCode, setReferralCode] = useState<string>("");
  const [countdown, setCountdown] = useState({ m: 14, s: 59 });

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate({ to: "/login" });
        return;
      }
      const uid = session.user.id;
      const [{ data: profile }, { data: sub }] = await Promise.all([
        supabase.from("profiles").select("level, referral_code").eq("id", uid).maybeSingle(),
        supabase.from("subscriptions").select("tier, status").eq("user_id", uid).eq("status", "active").maybeSingle(),
      ]);
      setLevel(((profile as { level?: Level })?.level ?? "beginner"));
      setReferralCode(((profile as { referral_code?: string })?.referral_code ?? `COURS-${uid.slice(0, 6).toUpperCase()}`));
      setTier(((sub as { tier?: Tier })?.tier ?? "course"));
      setLoading(false);
    })();
  }, [navigate]);

  useEffect(() => {
    const id = setInterval(() => {
      setCountdown((c) => {
        let { m, s } = c;
        if (s === 0) {
          if (m === 0) return { m: 14, s: 59 };
          m -= 1; s = 59;
        } else s -= 1;
        return { m, s };
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const upgradeTitle =
    level === "beginner" ? "ترقَّ للمستوى المتوسط"
    : level === "intermediate" ? "ترقَّ للمستوى المتقدم"
    : "أنت في أعلى المستويات 🏆";

  const copyReferral = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      toast.success("تم النسخ ✓");
    } catch {
      toast.error("تعذّر النسخ");
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font, color: "var(--text-secondary)" }}>
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="page-content" style={{ minHeight: "100vh", background: "var(--bg-primary)", fontFamily: font, direction: "rtl", padding: "24px 16px", paddingBottom: 100 }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: 28, marginBottom: 18 }}>العروض والتخفيضات</h1>

        {/* Trending */}
        <div style={{ background: "linear-gradient(160deg, rgba(248,113,113,0.07), transparent)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 16, padding: 22, marginBottom: 14 }}>
          <span style={{ display: "inline-block", background: "rgba(248,113,113,0.15)", color: "#f87171", padding: "4px 12px", borderRadius: 30, fontSize: 11, fontWeight: 700 }}>🔥 الأكثر شعبية</span>
          <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 18, marginTop: 12 }}>كورس الذكاء الاصطناعي</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 6 }}>٨٥٪ من المشتركين الجدد هذا الأسبوع اختاروا مسار AI</p>
          <button onClick={() => toast.info("سيتم تفعيل التسجيل قريباً")} style={{ marginTop: 14, background: "transparent", border: "1px solid #f87171", color: "#f87171", padding: "10px 18px", borderRadius: 50, fontFamily: font, fontWeight: 700, cursor: "pointer" }}>
            تسجيل الاهتمام ←
          </button>
        </div>

        {/* Personalized upgrade */}
        <div style={{ background: "linear-gradient(160deg, rgba(123,53,192,0.10), rgba(64,200,200,0.05))", border: "1px solid rgba(123,53,192,0.3)", borderRadius: 16, padding: 22, marginBottom: 14, boxShadow: "0 0 30px rgba(123,53,192,0.1)" }}>
          <span style={{ display: "inline-block", background: "linear-gradient(135deg, #7B35C0, #40C8C8)", color: "white", padding: "4px 14px", borderRadius: 30, fontSize: 11, fontWeight: 700 }}>✦ خاص بك</span>
          <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 18, marginTop: 12 }}>{upgradeTitle}</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 6 }}>وفّر ١٥٪ كمكافأة لإتمامك المستوى الحالي</p>
          {level !== "advanced" && (
            <button onClick={() => toast.info("صفحة الدفع قيد التطوير")} style={{ marginTop: 14, background: "linear-gradient(135deg, #7B35C0, #40C8C8)", color: "white", border: "none", padding: "12px 22px", borderRadius: 50, fontFamily: font, fontWeight: 700, cursor: "pointer", boxShadow: "0 0 20px rgba(123,53,192,0.3)" }}>
              ترقَّ الآن بخصم ١٥٪ ←
            </button>
          )}
        </div>

        {/* AI Assistant upsell */}
        {tier === "course" && (
          <div style={{ background: "rgba(64,200,200,0.04)", border: "1px solid rgba(64,200,200,0.2)", borderRadius: 16, padding: 22, marginBottom: 14 }}>
            <h3 style={{ color: "var(--accent-cyan-text)", fontWeight: 700, fontSize: 18 }}>جرّب مساعد AI داخل كورسك</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 10, lineHeight: 1.8 }}>
              ✓ إجابات فورية بالعربية &nbsp; · &nbsp; ✓ يتذكر مستواك &nbsp; · &nbsp; ✓ متاح ٢٤/٧
            </p>
            <button onClick={() => toast.info("صفحة الدفع قيد التطوير")} style={{ marginTop: 14, background: "transparent", border: "1px solid var(--accent-cyan-text)", color: "var(--accent-cyan-text)", padding: "10px 18px", borderRadius: 50, fontFamily: font, fontWeight: 700, cursor: "pointer" }}>
              ترقَّ للباقة الكاملة $49 ←
            </button>
          </div>
        )}

        {/* Countdown */}
        <div style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 16, padding: 22, marginBottom: 14 }}>
          <span style={{ display: "inline-block", background: "rgba(251,191,36,0.15)", color: "#fbbf24", padding: "4px 12px", borderRadius: 30, fontSize: 11, fontWeight: 700 }}>⏰ عرض محدود</span>
          <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 18, marginTop: 12 }}>سعر الإطلاق — محدود الوقت</h3>
          <div style={{ color: "#fbbf24", fontSize: 32, fontWeight: 800, marginTop: 8, letterSpacing: 2, fontVariantNumeric: "tabular-nums" }}>
            {String(countdown.m).padStart(2, "0")}:{String(countdown.s).padStart(2, "0")}
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 6 }}>هذا السعر لن يدوم. اشترك الآن قبل انتهاء العرض.</p>
        </div>

        {/* Bundle coming */}
        <div style={{ background: "var(--bg-secondary)", border: "1px dashed var(--border)", borderRadius: 16, padding: 22, marginBottom: 14, opacity: 0.55 }}>
          <span style={{ display: "inline-block", background: "var(--bg-card)", color: "var(--text-muted)", padding: "4px 12px", borderRadius: 30, fontSize: 11, fontWeight: 700 }}>قريباً</span>
          <h3 style={{ color: "var(--text-muted)", fontWeight: 700, fontSize: 18, marginTop: 12 }}>حزمة AI + اللياقة البدنية معاً</h3>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 6 }}>اشترك في مسارين وادفع أقل — قريباً</p>
        </div>

        {/* Referral */}
        <div style={{ background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 16, padding: 22 }}>
          <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 18 }}>ادعُ صديقاً واربحا معاً</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 6 }}>شارك رمز الدعوة الخاص بك</p>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, textAlign: "center", margin: "16px 0" }}>
            <div style={{ color: "var(--accent-cyan-text)", fontWeight: 800, fontSize: 20, letterSpacing: 3 }}>{referralCode}</div>
          </div>
          <button onClick={copyReferral} style={{ width: "100%", background: "transparent", border: "1px solid var(--border)", color: "var(--text-primary)", padding: "12px", borderRadius: 50, fontFamily: font, fontWeight: 700, cursor: "pointer" }}>
            نسخ الرمز
          </button>
        </div>
      </div>
    </div>
  );
}
