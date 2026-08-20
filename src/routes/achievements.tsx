import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/contexts/ProfileContext";
import PortalHeader from "@/components/portal-nav";
import CertificateCard from "@/components/certificate-card";
import { completedCount, isLevelComplete, totalChapters, type Level as CertLevel } from "@/lib/certificate";


export const Route = createFileRoute("/achievements")({
  component: AchievementsPage,
  head: () => ({ meta: [{ title: "إنجازاتي — COURSI" }] }),
});

const font = "Cairo, 'Noto Sans Arabic', sans-serif";

type Level = "beginner" | "intermediate" | "advanced";

interface Badge {
  id: string;
  icon: string;
  name: string;
  earned: boolean;
}

function AchievementsPage() {
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useProfile();
  const [completedChapters, setCompletedChapters] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate({ to: "/login" });
        return;
      }
      const { data: progress } = await supabase
        .from("course_progress")
        .select("completed")
        .eq("user_id", session.user.id)
        .eq("completed", true);
      setCompletedChapters((progress ?? []).length);
      setLoadingProgress(false);
    })();
  }, [navigate]);

  const streak = profile?.streak_days ?? 0;
  const xp = profile?.xp_points ?? 0;
  const level: Level = (profile?.level as Level) ?? "beginner";
  const loading = profileLoading || loadingProgress;

  const totals = { beginner: 8, intermediate: 10, advanced: 12 } as const;
  const certificates =
    (level === "intermediate" || level === "advanced" ? 1 : 0) +
    (level === "advanced" ? 1 : 0) +
    (completedChapters >= totals[level] ? 1 : 0);

  const badges: Badge[] = [
    { id: "beginner_ai", icon: "🌱", name: "مبتدئ AI", earned: true },
    { id: "intermediate_ai", icon: "📈", name: "متوسط AI", earned: level === "intermediate" || level === "advanced" },
    { id: "advanced_ai", icon: "🔥", name: "متقدم AI", earned: level === "advanced" },
    { id: "streak_7", icon: "🔥", name: "٧ أيام متواصلة", earned: streak >= 7 },
    { id: "streak_30", icon: "⚡", name: "٣٠ يوم متواصل", earned: streak >= 30 },
    { id: "perfect_quiz", icon: "💯", name: "اختبار مثالي", earned: xp >= 30 },
    { id: "first_cert", icon: "🏆", name: "أول شهادة", earned: certificates > 0 },
    { id: "early_bird", icon: "🐦", name: "من الأوائل", earned: true },
  ];

  const nextMilestone = Math.max(100, Math.ceil((xp + 1) / 100) * 100);
  const progressPct = ((xp % 100) / 100) * 100;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font, color: "var(--text-secondary)" }}>
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="page-content" style={{ minHeight: "100vh", background: "var(--bg-primary)", fontFamily: font, direction: "rtl", paddingBottom: 100 }}>
      <PortalHeader />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>
        <h1 style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: 28, marginBottom: 18 }}>إنجازاتي</h1>

        {/* Streak */}
        <div style={{ background: "linear-gradient(160deg, rgba(251,113,36,0.08), transparent)", border: "1px solid rgba(251,113,36,0.2)", borderRadius: 16, padding: 28, marginBottom: 14, textAlign: "center" }}>
          <div style={{ fontSize: 48 }}>🔥</div>
          <div style={{ background: "linear-gradient(135deg, #7B35C0, #40C8C8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", fontSize: 56, fontWeight: 900, lineHeight: 1 }}>
            {streak}
          </div>
          <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 16, marginTop: 6 }}>أيام متواصلة من التعلّم</div>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 6 }}>
            {streak === 0 ? "ابدأ اليوم وابنِ سلسلتك" : "استمر يومياً للحفاظ على سلسلتك 🔥"}
          </p>
        </div>

        {/* XP */}
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 16, padding: 22, marginBottom: 14 }}>
          <div style={{ color: "var(--text-primary)", fontSize: 14, fontWeight: 700 }}>⭐ مجموع نقاط XP</div>
          <div style={{ background: "linear-gradient(135deg, #7B35C0, #40C8C8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", fontSize: 48, fontWeight: 900, marginTop: 6, lineHeight: 1 }}>
            {xp}
          </div>
          <div style={{ width: "100%", height: 8, background: "var(--border)", borderRadius: 4, margin: "14px 0 8px", overflow: "hidden" }}>
            <div style={{ height: "100%", background: "linear-gradient(90deg, #7B35C0, #40C8C8)", width: `${progressPct}%`, transition: "width 0.8s" }} />
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: 12 }}>{nextMilestone - xp} نقطة حتى المستوى التالي</p>
        </div>

        {/* Badges */}
        <div style={{ color: "var(--accent-purple-text)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, margin: "20px 0 12px" }}>✦ الشارات</div>
        <div className="badges-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
          {badges.map((b) =>
            b.earned ? (
              <div key={b.id} style={{ background: "linear-gradient(160deg, rgba(123,53,192,0.08), rgba(64,200,200,0.05))", border: "1px solid rgba(123,53,192,0.25)", borderRadius: 12, padding: 16, textAlign: "center" }}>
                <div style={{ fontSize: 32 }}>{b.icon}</div>
                <div style={{ color: "var(--text-primary)", fontSize: 12, fontWeight: 700, marginTop: 6 }}>{b.name}</div>
              </div>
            ) : (
              <div key={b.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, textAlign: "center", opacity: 0.35, filter: "grayscale(100%)" }}>
                <div style={{ fontSize: 32 }}>{b.icon}</div>
                <div style={{ color: "var(--text-primary)", fontSize: 12, fontWeight: 700, marginTop: 6 }}>{b.name}</div>
                <div style={{ color: "var(--text-muted)", fontSize: 10, marginTop: 2 }}>قيد الإنجاز</div>
              </div>
            ),
          )}
        </div>

        {/* Certificates */}
        <div style={{ color: "var(--accent-purple-text)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, margin: "20px 0 12px" }}>✦ شهاداتي</div>
        {certificates === 0 ? (
          <div style={{ background: "var(--bg-card)", border: "1px dashed var(--border)", borderRadius: 14, padding: 28, textAlign: "center", color: "var(--text-secondary)" }}>
            <div style={{ fontSize: 40 }}>🏆</div>
            <p style={{ marginTop: 10, fontSize: 13 }}>أكمل أول مستوى لتحصل على شهادتك</p>
          </div>
        ) : (
          <div style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.08), rgba(123,53,192,0.05))", border: "1px solid rgba(251,191,36,0.25)", borderRadius: 14, padding: 18, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <div style={{ fontSize: 24 }}>🏆</div>
              <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 14, marginTop: 4 }}>شهادة {level === "advanced" ? "المستوى المتقدم" : level === "intermediate" ? "المستوى المتوسط" : "المستوى المبتدئ"}</div>
            </div>
            <button style={{ background: "transparent", border: "1px solid #fbbf24", color: "#fbbf24", padding: "8px 16px", borderRadius: 30, fontFamily: font, fontWeight: 700, cursor: "pointer" }}>
              تحميل
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
