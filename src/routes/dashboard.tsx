import { Fragment } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import coursiLogo from "@/assets/coursi-logo.png.asset.json";
import { ThemeToggle } from "@/lib/theme";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [{ title: "لوحة التحكم — COURSI AI Portal" }],
  }),
});

type Level = "beginner" | "intermediate" | "advanced";
type Tier = "course" | "course_ai";

interface Profile {
  id: string;
  email: string | null;
  level: Level;
}
interface Subscription {
  tier: Tier;
  status: string;
}
interface Progress {
  chapter_id: string;
  completed: boolean;
}

const font = "Noto Sans Arabic, sans-serif";

const levelBadge = (level: Level) => {
  if (level === "beginner")
    return { label: "🌱 مستوى المبتدئ", bg: "var(--accent-green-soft)", border: "var(--accent-green-border)", color: "var(--accent-green-text)" };
  if (level === "intermediate")
    return { label: "📈 مستوى المتوسط", bg: "var(--accent-cyan-soft)", border: "var(--accent-cyan-border)", color: "var(--accent-cyan-text)" };
  return { label: "🔥 مستوى المتقدم", bg: "var(--accent-purple-soft)", border: "var(--accent-purple-border)", color: "var(--accent-purple-text)" };
};

const courseInfo = (level: Level) => {
  if (level === "beginner") return { name: "أساسيات الذكاء الاصطناعي من الصفر", meta: "٨ فصول · ٤ أسابيع", total: 8 };
  if (level === "intermediate") return { name: "الذكاء الاصطناعي للمحترفين", meta: "١٠ فصول · ٦ أسابيع", total: 10 };
  return { name: "إتقان الذكاء الاصطناعي — بناء منتجات وأعمال", meta: "١٢ فصل · ٨ أسابيع", total: 12 };
};

function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [userEmail, setUserEmail] = useState<string>("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate({ to: "/login" });
        return;
      }
      setUserEmail(session.user.email ?? "");

      const userId = session.user.id;
      const [{ data: p }, { data: s }, { data: pr }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("subscriptions").select("*").eq("user_id", userId).eq("status", "active").maybeSingle(),
        supabase.from("course_progress").select("*").eq("user_id", userId),
      ]);

      if (!p) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setProfile(p as Profile);
      setSubscription(s as Subscription | null);
      setProgress((pr as Progress[]) || []);
      setLoading(false);
    };
    run();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: font }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid #1E1E1E", borderTopColor: "#7B35C0", borderRightColor: "#40C8C8", animation: "spin 0.9s linear infinite" }} />
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>جاري تحميل بياناتك...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: font }}>
        <div style={{ background: "var(--card-glass)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: "1px solid var(--card-glass-border)", borderRadius: 16, padding: "28px 32px", maxWidth: 480, textAlign: "center", color: "var(--text-primary)" }}>
          لم يتم العثور على بياناتك. تواصل مع الدعم على support@coursi.ai
        </div>
      </div>
    );
  }

  const level = profile!.level;
  const lb = levelBadge(level);
  const course = courseInfo(level);
  const completedChapters = progress.filter((p) => p.completed).length;
  const percentage = course.total > 0 ? Math.round((completedChapters / course.total) * 100) : 0;

  const tierBadge = subscription?.tier === "course_ai"
    ? { label: "باقة الكورس + مساعد AI", bg: "linear-gradient(135deg, var(--accent-purple-soft), var(--accent-cyan-soft))", border: "var(--accent-purple-border)", color: "var(--accent-cyan-text)" }
    : { label: "باقة الكورس", bg: "var(--bg-card)", border: "var(--border)", color: "var(--text-secondary)" };

  const journeyLevels: { key: Level; emoji: string; name: string }[] = [
    { key: "beginner", emoji: "🌱", name: "المبتدئ" },
    { key: "intermediate", emoji: "📈", name: "المتوسط" },
    { key: "advanced", emoji: "🔥", name: "المتقدم" },
  ];
  const currentIdx = journeyLevels.findIndex((l) => l.key === level);

  const upgradeMsg =
    level === "beginner"
      ? "بعد إتمام هذا المستوى ستحصل على خصم ١٥٪ للاشتراك في مستوى المتوسط"
      : level === "intermediate"
      ? "بعد إتمام هذا المستوى ستحصل على خصم ١٥٪ للاشتراك في مستوى المتقدم"
      : null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", fontFamily: font, direction: "rtl", position: "relative" }}>
      <div style={{ position: "relative", zIndex: 1 }}>
      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, zIndex: 10, background: "color-mix(in srgb, var(--bg-primary) 75%, transparent)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <img src={coursiLogo.url} alt="COURSI" style={{ height: 28, width: "auto", flexShrink: 0 }} />
        <span style={{ color: "var(--text-secondary)", fontSize: 12, flex: "1 1 auto", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userEmail || "بوابة الذكاء الاصطناعي"}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <ThemeToggle style={{ width: 32, height: 32, fontSize: 14 }} />
          <button
            onClick={handleLogout}
            style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 12, padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontFamily: font }}
          >
            خروج
          </button>
        </div>
      </nav>


      <main style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px" }}>
        {/* Card 1: Welcome */}
        <section style={{ background: "var(--card-glass)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: "1px solid var(--card-glass-border)", borderRadius: 16, padding: "24px 28px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 20 }}>مرحباً بك في COURSI</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>{profile?.email}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0 }}>
            <span style={{ borderRadius: 30, padding: "8px 18px", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, background: lb.bg, border: `1px solid ${lb.border}`, color: lb.color }}>
              {lb.label}
            </span>
            <span style={{ borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600, marginTop: 8, background: tierBadge.bg, border: `1px solid ${tierBadge.border}`, color: tierBadge.color }}>
              {tierBadge.label}
            </span>
          </div>
        </section>

        {/* Card 2: Progress */}
        <section style={{ background: "var(--card-glass)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: "1px solid var(--card-glass-border)", borderRadius: 16, padding: "24px 28px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "var(--accent-purple-text)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>تقدّمك في الكورس</span>
            <span style={{ color: "var(--accent-cyan-text)", fontWeight: 700, fontSize: 22 }}>{percentage}%</span>
          </div>
          <div style={{ width: "100%", height: 8, background: "var(--border)", borderRadius: 4, margin: "14px 0 10px", overflow: "hidden" }}>
            <div style={{ height: "100%", background: "linear-gradient(90deg, #7B35C0, #40C8C8)", borderRadius: 4, width: `${percentage}%`, transition: "width 0.8s ease" }} />
          </div>
          {percentage === 0 ? (
            <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>ابدأ كورسك الآن وتتبّع تقدّمك هنا</p>
          ) : (
            <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>{completedChapters} من {course.total} فصل مكتمل</p>
          )}
        </section>

        {/* Card 3: Course */}
        <section style={{ background: "var(--dashboard-course-bg)", border: "1px solid var(--dashboard-course-border)", borderRadius: 16, padding: "24px 28px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ color: "var(--accent-purple-text)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>✦ كورسك الحالي</div>
            <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 18, marginTop: 6 }}>{course.name}</div>
            <div style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>{course.meta}</div>
          </div>
          <button
            onClick={() => { window.location.href = "/course/ai"; }}
            style={{ background: "linear-gradient(135deg, #7B35C0, #40C8C8)", color: "white", fontFamily: font, fontSize: 14, fontWeight: 700, padding: "12px 24px", borderRadius: 50, border: "none", cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 0 20px rgba(123,53,192,0.3)" }}
          >
            {completedChapters === 0 ? "ابدأ الكورس ←" : "تابع من حيث توقفت ←"}
          </button>
        </section>

        {/* Card 4: Upgrade (only beginner/intermediate) */}
        {level !== "advanced" && (
          <section style={{ background: "var(--card-glass)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: "1px solid var(--card-glass-border)", borderRadius: 16, padding: "20px 28px" }}>
            <div style={{ color: "var(--accent-purple-text)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, marginBottom: 16 }}>✦ رحلتك لا تنتهي هنا</div>
            <div style={{ display: "flex", alignItems: "stretch", gap: 8 }}>
              {journeyLevels.map((jl, i) => {
                const isCurrent = i === currentIdx;
                const isCompleted = i < currentIdx;
                const boxStyle: React.CSSProperties = isCurrent
                  ? { border: "1px solid var(--journey-current-border)", background: "var(--journey-current-bg)" }
                  : isCompleted
                  ? { border: "1px solid var(--journey-completed-border)", background: "var(--journey-completed-bg)", opacity: 0.6 }
                  : { border: "1px solid var(--journey-future-border)", background: "var(--journey-future-bg)", opacity: "var(--journey-future-opacity)" };
                const labelText = isCurrent ? "مستواك الحالي" : isCompleted ? "✓ أتممته" : "المستوى التالي";
                const labelColor = isCurrent ? "var(--accent-cyan-text)" : isCompleted ? "var(--accent-green-text)" : "var(--text-secondary)";
                return (
                  <Fragment key={jl.key}>
                    <div style={{ flex: 1, textAlign: "center", padding: 14, borderRadius: 12, ...boxStyle }}>
                      <div style={{ fontSize: 28 }}>{jl.emoji}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginTop: 4 }}>{jl.name}</div>
                      <div style={{ fontSize: 11, color: labelColor, marginTop: 4 }}>{labelText}</div>
                    </div>
                    {i < journeyLevels.length - 1 && (
                      <div style={{ flexShrink: 0, fontSize: 20, color: "var(--text-secondary)", opacity: 0.3, alignSelf: "center" }}>←</div>
                    )}
                  </Fragment>
                );
              })}
            </div>
            {upgradeMsg && (
              <p style={{ color: "var(--text-secondary)", fontSize: 13, textAlign: "center", marginTop: 14 }}>{upgradeMsg}</p>
            )}
          </section>
        )}
      </main>
      </div>
    </div>
  );
}


