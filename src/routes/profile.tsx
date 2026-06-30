import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import arabicLogo from "@/assets/arabic-logo.png.asset.json";
import { ThemeToggle } from "@/lib/theme";
import { useProfile } from "@/contexts/ProfileContext";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "حسابي — COURSI AI Portal" }] }),
});

type Level = "beginner" | "intermediate" | "advanced";
type Tier = "course" | "course_ai";

interface Profile {
  id: string;
  email: string | null;
  level: Level;
  display_name: string | null;
  country_name: string | null;
  country_flag: string | null;
  created_at: string;
}
interface Subscription { tier: Tier; status: string }
interface Progress { chapter_id: string; completed: boolean }

const font = "Cairo, 'Noto Sans Arabic', sans-serif";

const levelBadge = (level: Level) => {
  if (level === "beginner") return { label: "🌱 مستوى المبتدئ", bg: "var(--accent-green-soft)", border: "var(--accent-green-border)", color: "var(--accent-green-text)" };
  if (level === "intermediate") return { label: "📈 مستوى المتوسط", bg: "var(--accent-cyan-soft)", border: "var(--accent-cyan-border)", color: "var(--accent-cyan-text)" };
  return { label: "🔥 مستوى المتقدم", bg: "var(--accent-purple-soft)", border: "var(--accent-purple-border)", color: "var(--accent-purple-text)" };
};

const skillScores = (level: Level): number[] => {
  if (level === "beginner") return [18, 15, 10, 8, 5];
  if (level === "intermediate") return [55, 50, 40, 30, 25];
  return [88, 82, 75, 70, 65];
};

const skillAxes = ["المفاهيم", "الأدوات", "الـ Prompting", "البناء", "الاستراتيجية"];

const arabicMonth = (d: Date) => {
  const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
};

function RadarChart({ scores }: { scores: number[] }) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const r = 100;
  const n = scores.length;
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const point = (i: number, value: number) => {
    const rr = (value / 100) * r;
    return [cx + rr * Math.cos(angle(i)), cy + rr * Math.sin(angle(i))];
  };
  const dataPath = scores.map((v, i) => point(i, v)).map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ") + " Z";
  const rings = [0.2, 0.4, 0.6, 0.8, 1];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: 320, display: "block", margin: "0 auto" }}>
      {rings.map((rr, i) => {
        const pts = Array.from({ length: n }, (_, j) => point(j, rr * 100).join(",")).join(" ");
        return <polygon key={i} points={pts} fill="none" stroke="var(--border)" strokeWidth="1" opacity={0.6} />;
      })}
      {Array.from({ length: n }, (_, i) => {
        const [x, y] = point(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border)" strokeWidth="1" opacity={0.5} />;
      })}
      <defs>
        <linearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7B35C0" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#40C8C8" stopOpacity="0.45" />
        </linearGradient>
      </defs>
      <path d={dataPath} fill="url(#radarFill)" stroke="#7B35C0" strokeWidth="2" />
      {scores.map((v, i) => {
        const [x, y] = point(i, v);
        return <circle key={i} cx={x} cy={y} r={3.5} fill="#40C8C8" stroke="#fff" strokeWidth="1" />;
      })}
      {skillAxes.map((label, i) => {
        const [x, y] = point(i, 122);
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="var(--text-secondary)" fontFamily={font}>
            {label}
          </text>
        );
      })}
    </svg>
  );
}

function ProfilePage() {
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useProfile();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate({ to: "/login" });
        return;
      }
      setUserEmail(session.user.email ?? "");
      const userId = session.user.id;
      const [{ data: s }, { data: pr }] = await Promise.all([
        supabase.from("subscriptions").select("*").eq("user_id", userId).eq("status", "active").maybeSingle(),
        supabase.from("course_progress").select("*").eq("user_id", userId),
      ]);
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

  const completedChapters = progress.filter((p) => p.completed).length;
  const xp = completedChapters * 10;
  const certificates: { name: string; date: string }[] = []; // none yet — placeholder card shows

  const displayName = profile?.display_name?.trim() || (profile?.email || userEmail).split("@")[0];
  const initial = (displayName || "?").trim().charAt(0).toUpperCase();
  const memberSince = profile ? arabicMonth(new Date(profile.created_at)) : "";

  const lb = useMemo(() => (profile ? levelBadge(profile.level) : null), [profile]);
  const tierBadge = subscription?.tier === "course_ai"
    ? { label: "باقة الكورس + مساعد AI", bg: "linear-gradient(135deg, var(--accent-purple-soft), var(--accent-cyan-soft))", border: "var(--accent-purple-border)", color: "var(--accent-cyan-text)" }
    : { label: "باقة الكورس", bg: "var(--bg-card)", border: "var(--border)", color: "var(--text-secondary)" };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "#7B35C0", borderRightColor: "#40C8C8", animation: "spin 0.9s linear infinite" }} />
      </div>
    );
  }

  const stats = [
    { icon: "🔥", value: "0", label: "أيام / سلسلة التعلّم" },
    { icon: "⭐", value: String(xp), label: "نقطة / مجموع XP" },
    { icon: "📚", value: String(completedChapters), label: "فصل / مكتمل" },
    { icon: "🏅", value: String(certificates.length), label: "شهادة / مكتسبة" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", fontFamily: font, direction: "rtl" }}>
      {/* Desktop nav (mobile uses MobileTopbar) */}
      <nav style={{ position: "sticky", top: 0, zIndex: 10, background: "color-mix(in srgb, var(--bg-primary) 75%, transparent)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label="القائمة" style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0 }}>
              <img src={arabicLogo.url} alt="COURSI" style={{ height: 56, width: "auto", display: "block" }} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" sideOffset={8} style={{ minWidth: 200, fontFamily: font }}>
            <DropdownMenuItem onSelect={() => navigate({ to: "/dashboard" })}>🏠 الرئيسية</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate({ to: "/course/ai" })}>📚 كورسي</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate({ to: "/offers" })}>🎁 العروض</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate({ to: "/achievements" })}>🏅 إنجازاتي</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate({ to: "/profile" })}>👤 حسابي</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout}>🚪 خروج</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <span style={{ color: "var(--text-secondary)", fontSize: 12, flex: "1 1 auto", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userEmail}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <ThemeToggle style={{ width: 32, height: 32, fontSize: 14 }} />
          <button onClick={handleLogout} style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 12, padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontFamily: font }}>خروج</button>
        </div>
      </nav>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px 96px" }}>
        {/* Profile Card */}
        <section style={{ background: "linear-gradient(160deg, rgba(123,53,192,0.08), rgba(64,200,200,0.04))", border: "1px solid rgba(123,53,192,0.2)", borderRadius: 20, padding: 28, textAlign: "center", maxWidth: 440, margin: "0 auto 20px" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, #7B35C0, #40C8C8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, color: "white", margin: "0 auto 12px", boxShadow: "0 0 24px rgba(123,53,192,0.35)" }}>
            {initial}
          </div>
          <h1 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 20 }}>{displayName}</h1>
          {(profile?.country_name || profile?.country_flag) && (
            <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>
              {profile?.country_flag ?? ""} {profile?.country_name ?? ""}
            </p>
          )}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
            {lb && (
              <span style={{ background: lb.bg, border: `1px solid ${lb.border}`, color: lb.color, fontSize: 12, padding: "5px 12px", borderRadius: 999, fontWeight: 600 }}>{lb.label}</span>
            )}
            <span style={{ background: tierBadge.bg, border: `1px solid ${tierBadge.border}`, color: tierBadge.color, fontSize: 12, padding: "5px 12px", borderRadius: 999, fontWeight: 600 }}>{tierBadge.label}</span>
          </div>
          {memberSince && <p style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 14 }}>عضو منذ {memberSince}</p>}
        </section>

        {/* Stats 2x2 */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 24 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: 22 }}>{s.value}</div>
              <div style={{ color: "var(--text-secondary)", fontSize: 11, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </section>

        {/* Skill Radar */}
        <section style={{ background: "var(--card-glass)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: "1px solid var(--card-glass-border)", borderRadius: 16, padding: 20, marginBottom: 24 }}>
          <h2 style={{ color: "var(--text-primary)", fontSize: 16, fontWeight: 700, marginBottom: 12, textAlign: "center" }}>خريطة مهاراتك</h2>
          {profile && <RadarChart scores={skillScores(profile.level)} />}
        </section>

        {/* Certificates */}
        <section>
          <h2 style={{ color: "var(--accent-purple-text)", fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>شهاداتي</h2>
          {certificates.length === 0 ? (
            <div style={{ background: "var(--bg-card)", border: "1px dashed var(--border)", borderRadius: 14, padding: "22px 18px", textAlign: "center", color: "var(--text-secondary)", fontSize: 13 }}>
              أكمل أول مستوى لتحصل على شهادتك
            </div>
          ) : (
            certificates.map((c, i) => (
              <div key={i} style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.06), rgba(123,53,192,0.04))", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 14, padding: 18, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 24 }}>🏆</span>
                  <div>
                    <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                    <div style={{ color: "var(--text-secondary)", fontSize: 11, marginTop: 2 }}>{c.date}</div>
                  </div>
                </div>
                <button
                  onClick={() => toast("التحميل قريباً")}
                  style={{ background: "transparent", border: "1px solid", borderImage: "linear-gradient(135deg, #7B35C0, #40C8C8) 1", color: "var(--text-primary)", fontSize: 12, padding: "6px 14px", borderRadius: 999, cursor: "pointer", fontFamily: font, fontWeight: 600 }}
                >
                  زر تحميل
                </button>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
