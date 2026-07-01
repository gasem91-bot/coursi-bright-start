import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import coursiLogoAsset from "@/assets/arabic-logo.png.asset.json";
const coursiLogo = coursiLogoAsset.url;
import { COURSE_CONTENT, type QuizQuestion } from "@/lib/course-content";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThemeToggle } from "@/lib/theme";
import { toast } from "sonner";

export const Route = createFileRoute("/course/ai")({
  component: CourseAIPage,
  head: () => ({ meta: [{ title: "كورس الذكاء الاصطناعي — COURSI" }] }),
});

type Level = "beginner" | "intermediate" | "advanced";
type Tier = "course" | "course_ai";

const font = "Cairo, 'Noto Sans Arabic', sans-serif";
const BG = "var(--bg-primary)";
const BG_SOFT = "var(--bg-secondary)";
const PURPLE = "#7B35FF";
const CYAN = "#00D4C8";
const GOLD = "#D4AF37";
const BORDER = "var(--border)";


const COURSE = COURSE_CONTENT;

const AR_NUM = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
const toAr = (n: number) => String(n).split("").map((d) => AR_NUM[+d] ?? d).join("");
const pad2 = (n: number) => String(n).padStart(2, "0");
const chapterId = (level: Level, idx: number) => `ai-${level}-${pad2(idx + 1)}`;

const ARABIC_LETTERS = ["أ", "ب", "ج", "د"];

function CourseAIPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState<Level>("beginner");
  const [tier, setTier] = useState<Tier>("course");
  const [userId, setUserId] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [userName, setUserName] = useState<string>("");


  const [activeChapter, setActiveChapter] = useState(0);
  const [activeTab, setActiveTab] = useState<"content" | "quiz">("content");

  const [currentQ, setCurrentQ] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizComplete, setQuizComplete] = useState(false);
  const [score, setScore] = useState(0);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMsgs, setChatMsgs] = useState<{ from: "ai" | "user"; text: string }[]>([
    {
      from: "ai",
      text:
        "مرحباً! أنا مساعدك الذكي في كورس الذكاء الاصطناعي. اسألني عن أي مفهوم في الفصل الحالي وسأجاوبك بالعربية فوراً. ميزة الذكاء الاصطناعي قيد التفعيل وستكون متاحة قريباً.",
    },
  ]);

  const contentScrollRef = useRef<HTMLDivElement | null>(null);

  const fetchProgress = async (uid: string) => {
    const { data } = await supabase
      .from("course_progress")
      .select("chapter_id, completed")
      .eq("user_id", uid);
    setCompletedIds(new Set((data ?? []).filter((r) => r.completed).map((r) => r.chapter_id)));
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate({ to: "/login" });
        return;
      }
      const uid = session.user.id;
      const [{ data: profile }, { data: subscription }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", uid).single(),
        supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", uid)
          .eq("status", "active")
          .maybeSingle(),
      ]);
      if (!mounted) return;
      setUserId(uid);
      setLevel(((profile?.level as Level) ?? "beginner"));
      setTier(((subscription?.tier as Tier) ?? "course"));
      const meta = (session.user.user_metadata ?? {}) as Record<string, unknown>;
      const fullName =
        (profile && (profile as Record<string, unknown>).full_name as string) ||
        (meta.full_name as string) ||
        (meta.name as string) ||
        (session.user.email?.split("@")[0] ?? "طالب كورسي");
      setUserName(fullName);
      await fetchProgress(uid);
      setLoading(false);

    })();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const course = COURSE[level];
  const total = course.chapters.length;
  const completedCount = useMemo(
    () => course.chapters.reduce((acc, _t, i) => acc + (completedIds.has(chapterId(level, i)) ? 1 : 0), 0),
    [completedIds, course.chapters, level],
  );
  const pct = total ? Math.round((completedCount / total) * 100) : 0;

  const isLast = activeChapter === total - 1;
  const currentChapter = course.chapters[activeChapter];
  const currentChapterTitle = currentChapter?.title ?? "";
  const quizQuestions: QuizQuestion[] = currentChapter?.quiz ?? [];

  const goToChapter = (i: number) => {
    setActiveChapter(i);
    setActiveTab("content");
    setCurrentQ(0);
    setAnswered(false);
    setSelectedAnswer(null);
    setQuizComplete(false);
    setScore(0);
    setSidebarOpen(false);
    contentScrollRef.current?.scrollTo({ top: 0 });
  };

  const handleAnswer = (idx: number) => {
    if (answered || !quizQuestions[currentQ]) return;
    const correct = quizQuestions[currentQ].correct;
    setAnswered(true);
    setSelectedAnswer(idx);
    if (idx === correct) setScore((s) => s + 1);
    setTimeout(() => {
      if (currentQ < quizQuestions.length - 1) {
        setCurrentQ((q) => q + 1);
        setAnswered(false);
        setSelectedAnswer(null);
      } else {
        setQuizComplete(true);
      }
    }, 3500);
  };

  const markComplete = async () => {
    if (!userId) return;
    const cid = chapterId(level, activeChapter);
    const alreadyComplete = completedIds.has(cid);
    await supabase
      .from("course_progress")
      .upsert(
        { user_id: userId, chapter_id: cid, completed: true },
        { onConflict: "user_id,chapter_id" },
      );
    if (!alreadyComplete) {
      // Award 10 XP for first-time completion
      const { data: p } = await supabase
        .from("profiles")
        .select("xp_points")
        .eq("id", userId)
        .maybeSingle();
      const current = (p as { xp_points?: number } | null)?.xp_points ?? 0;
      await supabase.from("profiles").update({ xp_points: current + 10 }).eq("id", userId);
    }
    await fetchProgress(userId);
  };

  useEffect(() => {
    if (quizComplete) {
      void markComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizComplete]);

  const sendChat = () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatMsgs((m) => [
      ...m,
      { from: "user", text },
      { from: "ai", text: "هذه الميزة ستكون متاحة قريباً — ترقّب التحديث!" },
    ]);
    setChatInput("");
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: BG,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          fontFamily: font,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: "3px solid rgba(255,255,255,0.08)",
            borderTopColor: PURPLE,
            borderRightColor: CYAN,
            animation: "coursi-spin 1s linear infinite",
          }}
        />
        <div style={{ marginTop: 18, color: "var(--text-secondary)", fontSize: 14 }}>جاري تحميل الكورس...</div>
      </div>
    );
  }

  return (
    <div
      className={isMobile ? "coursi-shell-mobile" : undefined}
      style={{ background: BG, color: "var(--text-primary)", height: "100vh", display: "flex", flexDirection: "column", fontFamily: font, overflow: "hidden" }}
    >
      {/* Top bar */}
      <div
        style={{
          background: "color-mix(in srgb, var(--bg-primary) 85%, transparent)",
          backdropFilter: "blur(10px)",
          borderBottom: `1px solid ${BORDER}`,
          padding: isMobile ? "10px 14px" : "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="فتح قائمة الفصول"
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: "var(--bg-card)", border: `1px solid ${BORDER}`,
                color: "var(--text-primary)", cursor: "pointer", fontSize: 18,
                display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}
            >
              ☰
            </button>
          )}
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}
            aria-label="العودة للوحة التحكم"
          >
            <img src={coursiLogo} alt="COURSI" style={{ height: isMobile ? 24 : 28, display: "block" }} />
          </button>
        </div>

        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{course.name}</div>
            {level === "intermediate" && (
              <span style={{ background: `linear-gradient(135deg, rgba(0,212,200,0.18), rgba(123,53,255,0.18))`, border: `1px solid ${CYAN}`, color: CYAN, fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 999, letterSpacing: 0.4 }}>
                المستوى المتوسط
              </span>
            )}
            {level === "advanced" && (
              <span className="adv-shine-badge" style={{ background: `linear-gradient(135deg, rgba(212,175,55,0.20), rgba(123,53,255,0.18))`, border: `1px solid ${GOLD}`, color: GOLD, fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 999, letterSpacing: 0.4, position: "relative", overflow: "hidden" }}>
                المستوى المتقدم
              </span>
            )}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{ color: CYAN, fontWeight: 700, fontSize: 13 }}>{toAr(pct)}%</div>
          <div style={{ width: isMobile ? 60 : 100, height: 4, background: "color-mix(in srgb, var(--text-primary) 6%, transparent)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg,${PURPLE},${CYAN})`, transition: "width 600ms ease" }} />
          </div>
          <ThemeToggle style={{ width: 32, height: 32, fontSize: 14 }} />
        </div>
      </div>

      {/* Body: sidebar + content */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, position: "relative" }}>
        {isMobile && sidebarOpen && (
          <div className="coursi-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
        )}
        {/* Sidebar (right in RTL) */}
        <aside
          className={isMobile ? "coursi-sidebar-drawer" : undefined}
          style={{
            width: 300,
            flexShrink: 0,
            background: BG_SOFT,
            borderLeft: `1px solid ${BORDER}`,
            overflowY: "auto",
            display: isMobile && !sidebarOpen ? "none" : "block",
          }}
        >
          <div
            style={{
              padding: "18px 18px 16px",
              borderBottom: `1px solid ${BORDER}`,
              position: "sticky",
              top: 0,
              background: BG_SOFT,
              zIndex: 1,
            }}
          >
            {(course as { coverImage?: string }).coverImage && (
              <img
                src={(course as { coverImage?: string }).coverImage}
                alt={course.name}
                className="sidebar-cover-thumb"
                loading="lazy"
              />
            )}
            <div style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: 14, marginBottom: 4 }}>{course.name}</div>
            <div style={{ color: "var(--text-secondary)", fontSize: 11, marginBottom: 12 }}>{course.meta}</div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
              <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg,${PURPLE},${CYAN})`, transition: "width 600ms ease" }} />
            </div>
            <div style={{ color: CYAN, fontSize: 10, fontWeight: 700 }}>
              {toAr(completedCount)} / {toAr(total)} مكتمل · {toAr(pct)}%
            </div>
          </div>

          {course.chapters.map((ch, i) => {
            const isActive = i === activeChapter;
            const isDone = completedIds.has(chapterId(level, i));
            const isLocked = i > activeChapter && !isDone && !quizComplete;
            const status: "done" | "current" | "upcoming" = isDone ? "done" : isActive ? "current" : "upcoming";
            const handleClick = () => {
              if (i < activeChapter || isDone) { goToChapter(i); return; }
              if (i === activeChapter) return;
              if (isLocked) {
                toast("أكمل أسئلة هذا الفصل أولاً للمتابعة 🔒");
                return;
              }
              goToChapter(i);
            };
            return (
              <div
                key={i}
                onClick={handleClick}
                style={{
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  borderBottom: `1px solid ${BORDER}`,
                  cursor: isLocked ? "not-allowed" : "pointer",
                  background: isActive ? "rgba(123,53,255,0.10)" : "transparent",
                  borderRight: isActive ? `2px solid ${PURPLE}` : "2px solid transparent",
                  transition: "background 0.15s",
                  opacity: isLocked ? 0.55 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isActive && !isLocked) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "transparent";
                }}
              >
                <div style={{ width: 26, color: isDone ? CYAN : isActive ? "var(--text-primary)" : "#555", fontSize: 11, fontWeight: 800 }}>{pad2(i + 1)}</div>
                <div
                  style={{
                    flex: 1,
                    fontSize: 12.5,
                    lineHeight: 1.5,
                    color: isDone ? "var(--text-muted)" : isActive ? "var(--text-primary)" : "#9590A8",
                    fontWeight: isActive ? 700 : 500,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {isLocked && <span aria-hidden style={{ fontSize: 11 }}>🔒</span>}
                  <span>{ch.title}</span>
                </div>
                {status === "done" ? (
                  <div
                    style={{
                      width: 18, height: 18, borderRadius: "50%",
                      background: `linear-gradient(135deg,${PURPLE},${CYAN})`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "var(--text-primary)", fontSize: 11, fontWeight: 800, flexShrink: 0,
                    }}
                  >
                    ✓
                  </div>
                ) : status === "current" ? (
                  <div
                    style={{
                      width: 14, height: 14, borderRadius: "50%",
                      background: CYAN, flexShrink: 0,
                      animation: "coursi-pulse-dot 1.6s ease-out infinite",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 14, height: 14, borderRadius: "50%",
                      border: "1.5px solid rgba(255,255,255,0.15)", flexShrink: 0,
                    }}
                  />
                )}
              </div>
            );
          })}
        </aside>

        {/* Content */}
        <main ref={contentScrollRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", minWidth: 0, background: BG, paddingBottom: isMobile ? 100 : 0 }}>
          {/* Tabs */}
          <div
            style={{
              padding: "16px 24px 0",
              display: "flex",
              gap: 8,
              borderBottom: `1px solid ${BORDER}`,
              background: BG,
              position: "sticky",
              top: 0,
              zIndex: 10,
            }}
          >
            {(["content", "quiz"] as const).map((t) => {
              const isActive = activeTab === t;
              const label = t === "content" ? "📖 المحتوى" : "✦ الاختبار";
              return (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  style={{
                    background: isActive ? "linear-gradient(135deg,#7B35FF,#00D4C8)" : "transparent",
                    color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                    border: isActive ? "none" : "1px solid #1E1E1E",
                    borderBottom: "none",
                    padding: "8px 20px",
                    borderRadius: "20px 20px 0 0",
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 400,
                    cursor: "pointer",
                    fontFamily: font,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {activeTab === "content" ? (
            <ContentTab
              chapterIndex={activeChapter}
              chapterTitle={currentChapterTitle}
              chapterHtml={currentChapter?.content ?? ""}
              onGoQuiz={() => setActiveTab("quiz")}
            />
          ) : (
            <QuizTab
              chapterIndex={activeChapter}
              questions={quizQuestions}
              currentQ={currentQ}
              answered={answered}
              selectedAnswer={selectedAnswer}
              quizComplete={quizComplete}
              score={score}
              isLast={isLast}
              courseName={course.name}
              level={level}
              userName={userName}

              onAnswer={handleAnswer}
              onNextChapter={() => goToChapter(activeChapter + 1)}
            />
          )}
        </main>
      </div>

      {/* AI Assistant */}
      {tier === "course_ai" && (
        <>
          <button
            onClick={() => setChatOpen((o) => !o)}
            style={{
              position: "fixed",
              bottom: 24,
              left: 24,
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#7B35FF,#00D4C8)",
              border: "none",
              cursor: "pointer",
              zIndex: 100,
              boxShadow: "0 0 24px rgba(123,53,255,0.45)",
              fontSize: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="مساعد AI"
          >
            🤖
          </button>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              bottom: 0,
              width: 340,
              background: "var(--bg-primary)",
              borderRight: "1px solid #1E1E1E",
              display: "flex",
              flexDirection: "column",
              zIndex: 200,
              transform: chatOpen ? "translateX(0)" : "translateX(-100%)",
              transition: "transform 0.3s ease",
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #1E1E1E",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 14 }}>🤖 مساعد AI كورس</div>
              <button
                onClick={() => setChatOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: 20, cursor: "pointer" }}
                aria-label="إغلاق"
              >
                ×
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
              {chatMsgs.map((m, i) => (
                <div
                  key={i}
                  style={{
                    background: m.from === "ai" ? "var(--bg-card)" : "rgba(0,212,200,0.12)",
                    borderRadius: m.from === "ai" ? "12px 12px 12px 0" : "12px 12px 0 12px",
                    padding: "12px 16px",
                    maxWidth: "85%",
                    marginBottom: 12,
                    marginLeft: m.from === "user" ? "auto" : 0,
                    fontSize: 14,
                    color: m.from === "ai" ? "var(--text-secondary)" : "var(--text-primary)",
                    lineHeight: 1.7,
                  }}
                >
                  {m.text}
                </div>
              ))}
            </div>
            <div style={{ padding: "12px 16px", borderTop: "1px solid #1E1E1E", display: "flex", gap: 8 }}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
                placeholder="اسأل عن أي شيء في الدرس..."
                dir="rtl"
                style={{
                  flex: 1,
                  background: "var(--bg-secondary)",
                  border: "1px solid #1E1E1E",
                  borderRadius: 20,
                  padding: "8px 14px",
                  color: "var(--text-primary)",
                  fontFamily: font,
                  fontSize: 13,
                  outline: "none",
                }}
              />
              <button
                onClick={sendChat}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#7B35FF,#00D4C8)",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-primary)",
                  fontSize: 16,
                  flexShrink: 0,
                }}
                aria-label="إرسال"
              >
                ←
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const CONTENT_CSS = `
.coursi-content { animation: coursi-fade-up 420ms ease-out both; }
.coursi-content h3 { color:#fff; font-weight:800; font-size:19px; margin:26px 0 10px; font-family:${font}; }
.coursi-content p { color:#CFC8DE; font-size:15px; line-height:1.95; margin:0 0 12px; }
.coursi-content strong { color:#fff; font-weight:700; }
.coursi-content ul.bullet-list, .coursi-content ol.bullet-list { list-style:none; padding:0; margin:8px 0 14px; }
.coursi-content ul.bullet-list li, .coursi-content ol.bullet-list li { color:#CFC8DE; font-size:15px; line-height:1.85; padding-right:18px; margin-bottom:6px; position:relative; }
.coursi-content ul.bullet-list li::before { content:"◆"; color:${CYAN}; position:absolute; right:0; top:0; font-size:10px; }
.coursi-content ol.bullet-list { counter-reset:cli; }
.coursi-content ol.bullet-list li::before { content:counter(cli, arabic-indic) "."; counter-increment:cli; color:${PURPLE}; font-weight:800; font-size:13px; }
.coursi-content .intro-box { background:linear-gradient(135deg, rgba(123,53,255,0.10), rgba(0,212,200,0.04)); border:1px solid rgba(123,53,255,0.18); border-radius:14px; padding:18px 20px; margin:0 0 22px; }
.coursi-content .intro-box p { color:#E2DCF0; font-size:15px; margin:0; line-height:1.9; }
.coursi-content .learn-box { background:rgba(123,53,255,0.07); border:1px solid rgba(123,53,255,0.18); border-radius:14px; padding:18px 20px; margin:0 0 22px; }
.coursi-content .learn-box ul { list-style:none; padding:0; margin:0; }
.coursi-content .learn-box li { color:#CFC8DE; font-size:14px; padding:6px 22px 6px 0; position:relative; line-height:1.7; }
.coursi-content .learn-box li::before { content:"✦"; color:${PURPLE}; position:absolute; right:0; top:6px; font-size:13px; }
.coursi-content .block-title { color:#fff; font-weight:800; font-size:14px; margin:0 0 10px; display:flex; align-items:center; gap:8px; }
.coursi-content .block-ic { display:inline-flex; width:24px; height:24px; border-radius:7px; background:linear-gradient(135deg,${PURPLE},${CYAN}); color:#fff; align-items:center; justify-content:center; font-size:13px; }
.coursi-content .info-box { background:rgba(123,53,255,0.06); border-right:3px solid ${PURPLE}; border-radius:10px; padding:14px 18px; margin:18px 0; }
.coursi-content .info-box .box-title { color:${PURPLE}; font-weight:800; font-size:13px; margin:0 0 6px; }
.coursi-content .info-box p { color:#CFC8DE; font-size:14px; margin:0 0 6px; line-height:1.8; }
.coursi-content .warn-box { background:rgba(255,170,60,0.06); border-right:3px solid #FFAA3C; border-radius:10px; padding:14px 18px; margin:18px 0; }
.coursi-content .warn-box .box-title { color:#FFAA3C; font-weight:800; font-size:13px; margin:0 0 6px; }
.coursi-content .warn-box p { color:#CFC8DE; font-size:14px; margin:0; line-height:1.8; }
.coursi-content .action-box, .coursi-content .exercise-box { background:linear-gradient(135deg, rgba(0,212,200,0.10), rgba(0,212,200,0.02)); border:1px solid rgba(0,212,200,0.25); border-radius:14px; padding:18px 20px; margin:24px 0 8px; }
.coursi-content .exercise-box .block-title .block-ic { background:linear-gradient(135deg,${CYAN},${PURPLE}); }
.coursi-content .exercise-box p { color:#E2DCF0; font-size:15px; margin:0; line-height:1.9; }
.coursi-content .tools-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:12px; margin:14px 0 22px; }
.coursi-content .tool-card { background:rgba(255,255,255,0.03); border:1px solid ${BORDER}; border-radius:14px; padding:14px 16px; display:flex; flex-direction:column; gap:8px; transition:border-color .2s, transform .2s; }
.coursi-content .tool-card:hover { border-color:rgba(123,53,255,0.45); transform:translateY(-2px); }
.coursi-content .tool-name { color:#fff; font-weight:800; font-size:15px; }
.coursi-content .tool-desc { color:#9590A8; font-size:13px; line-height:1.65; flex:1; }
.coursi-content .tool-btn { color:${CYAN}; font-size:12px; font-weight:700; text-decoration:none; border-top:1px solid ${BORDER}; padding-top:8px; margin-top:auto; }
.coursi-content .tool-btn:hover { color:${PURPLE}; }

/* ===== Intermediate: advanced tool cards ===== */
.coursi-content .adv-tools-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:14px; margin:16px 0 24px; }
.coursi-content .adv-tool-card { background:linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015)); border:1px solid ${BORDER}; border-radius:16px; padding:16px 18px; display:flex; flex-direction:column; gap:10px; transition:border-color .2s, transform .2s, box-shadow .2s; }
.coursi-content .adv-tool-card:hover { border-color:rgba(0,212,200,0.45); transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,212,200,0.08); }
.coursi-content .adv-tool-head { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; flex-wrap:wrap; }
.coursi-content .adv-tool-name { color:#fff; font-weight:800; font-size:16px; }
.coursi-content .adv-tool-badges { display:flex; gap:6px; flex-wrap:wrap; }
.coursi-content .badge { font-size:10.5px; font-weight:800; padding:3px 8px; border-radius:999px; letter-spacing:.3px; }
.coursi-content .badge-easy { background:rgba(0,212,200,0.12); color:${CYAN}; border:1px solid rgba(0,212,200,0.35); }
.coursi-content .badge-mid  { background:rgba(255,170,60,0.12); color:#FFB857; border:1px solid rgba(255,170,60,0.35); }
.coursi-content .badge-hard { background:rgba(255,90,120,0.12); color:#FF7A93; border:1px solid rgba(255,90,120,0.35); }
.coursi-content .badge-free    { background:rgba(123,53,255,0.12); color:#B591FF; border:1px solid rgba(123,53,255,0.35); }
.coursi-content .badge-paid    { background:rgba(255,255,255,0.06); color:#CFC8DE; border:1px solid rgba(255,255,255,0.18); }
.coursi-content .badge-partial { background:rgba(0,212,200,0.08); color:#7ee7df; border:1px solid rgba(0,212,200,0.25); }
.coursi-content .adv-tool-desc { color:#B6AECC; font-size:13.5px; line-height:1.7; flex:1; }
.coursi-content .adv-tool-btn { color:${CYAN}; font-size:12.5px; font-weight:800; text-decoration:none; border-top:1px solid ${BORDER}; padding-top:10px; margin-top:auto; }
.coursi-content .adv-tool-btn:hover { color:${PURPLE}; }

/* ===== Intermediate: comparison table ===== */
.coursi-content .compare-wrap { margin:18px 0 24px; background:rgba(255,255,255,0.02); border:1px solid ${BORDER}; border-radius:14px; padding:16px 18px; }
.coursi-content .compare-table { width:100%; border-collapse:collapse; margin-top:8px; font-size:13.5px; }
.coursi-content .compare-table th { color:${CYAN}; font-weight:800; padding:10px 8px; text-align:right; border-bottom:1px solid rgba(0,212,200,0.25); }
.coursi-content .compare-table td { color:#CFC8DE; padding:10px 8px; border-bottom:1px solid rgba(255,255,255,0.05); vertical-align:top; line-height:1.6; }
.coursi-content .compare-table .cmp-label { color:#8C84A6; font-weight:700; width:30%; }

/* ===== Intermediate: try-it checklist ===== */
.coursi-content .try-box { background:linear-gradient(135deg, rgba(0,212,200,0.08), rgba(123,53,255,0.04)); border:1px solid rgba(0,212,200,0.22); border-radius:14px; padding:18px 20px; margin:22px 0; }
.coursi-content .try-list { list-style:none; padding:0; margin:8px 0 0; }
.coursi-content .try-item { display:flex; gap:12px; align-items:flex-start; padding:9px 0; cursor:pointer; user-select:none; transition:opacity .2s; }
.coursi-content .try-check { flex-shrink:0; width:22px; height:22px; border-radius:6px; border:1.5px solid rgba(255,255,255,0.18); margin-top:2px; display:flex; align-items:center; justify-content:center; transition:all .2s; }
.coursi-content .try-text { color:#CFC8DE; font-size:14.5px; line-height:1.75; }
.coursi-content .try-item:hover .try-check { border-color:${CYAN}; }
.coursi-content .try-item.done .try-check { background:linear-gradient(135deg,${CYAN},${PURPLE}); border-color:transparent; }
.coursi-content .try-item.done .try-check::after { content:"✓"; color:#fff; font-size:13px; font-weight:800; }
.coursi-content .try-item.done .try-text { color:#7A7390; text-decoration:line-through; }

/* ===== Intermediate: automation flow diagram ===== */
.coursi-content .flow-wrap { background:rgba(255,255,255,0.02); border:1px solid ${BORDER}; border-radius:16px; padding:18px 20px; margin:18px 0 24px; }
.coursi-content .flow-caption { color:#9590A8; font-size:13px; margin:0 0 14px; line-height:1.7; }
.coursi-content .flow-diagram { display:flex; align-items:stretch; gap:8px; flex-wrap:wrap; justify-content:center; }
.coursi-content .flow-node { flex:1 1 180px; min-width:180px; background:linear-gradient(180deg, rgba(123,53,255,0.10), rgba(0,212,200,0.04)); border:1.5px solid rgba(123,53,255,0.28); border-radius:14px; padding:16px 14px; text-align:center; cursor:pointer; transition:all .25s; }
.coursi-content .flow-node:hover, .coursi-content .flow-node.active { border-color:${CYAN}; transform:translateY(-3px); box-shadow:0 8px 28px rgba(0,212,200,0.18); }
.coursi-content .flow-node .flow-ic { width:38px; height:38px; border-radius:50%; background:linear-gradient(135deg,${PURPLE},${CYAN}); color:#fff; font-size:18px; font-weight:800; display:flex; align-items:center; justify-content:center; margin:0 auto 10px; }
.coursi-content .flow-node .flow-title-s { color:#fff; font-weight:800; font-size:14px; margin-bottom:4px; }
.coursi-content .flow-node .flow-desc-s { color:#B6AECC; font-size:12.5px; line-height:1.55; }
.coursi-content .flow-arrow { flex:0 0 28px; display:flex; align-items:center; justify-content:center; position:relative; }
.coursi-content .flow-arrow::before { content:""; height:2px; width:100%; background:linear-gradient(90deg, transparent, ${PURPLE}, ${CYAN}, transparent); border-radius:2px; }
.coursi-content .flow-arrow-dot { position:absolute; width:8px; height:8px; border-radius:50%; background:${CYAN}; box-shadow:0 0 12px ${CYAN}; animation:coursi-flow-dot 2.2s linear infinite; }
@keyframes coursi-flow-dot { 0%{transform:translateX(-14px);opacity:0} 20%{opacity:1} 80%{opacity:1} 100%{transform:translateX(14px);opacity:0} }
.coursi-content .flow-detail { margin-top:16px; background:rgba(0,212,200,0.06); border-right:3px solid ${CYAN}; border-radius:10px; padding:14px 16px; color:#CFC8DE; font-size:14px; line-height:1.8; min-height:48px; transition:all .25s; }
@media (max-width: 720px) {
  .coursi-content .flow-arrow { flex-basis:100%; height:24px; transform:rotate(90deg); }
}

/* ===== Advanced: gold accents ===== */
.coursi-content .gold-ic { background:linear-gradient(135deg, ${GOLD}, ${PURPLE}) !important; color:#1a1208 !important; }
.coursi-content .learn-box.gold { background:rgba(212,175,55,0.06); border-color:rgba(212,175,55,0.25); }
.coursi-content .learn-box.gold li::before { color:${GOLD}; }
.coursi-content .exercise-box.gold { background:linear-gradient(135deg, rgba(212,175,55,0.10), rgba(212,175,55,0.02)); border-color:rgba(212,175,55,0.30); }
.coursi-content .info-box.gold { background:rgba(212,175,55,0.06); border-right-color:${GOLD}; }
.coursi-content .info-box.gold .box-title { color:${GOLD}; }
.coursi-content .adv-tool-card.gold:hover { border-color:rgba(212,175,55,0.55); box-shadow:0 8px 24px rgba(212,175,55,0.10); }
.coursi-content .adv-tool-btn.gold { color:${GOLD}; }
.coursi-content .adv-tool-btn.gold:hover { color:${PURPLE}; }
.coursi-content .try-box.gold { background:linear-gradient(135deg, rgba(212,175,55,0.08), rgba(123,53,255,0.04)); border-color:rgba(212,175,55,0.25); }
.coursi-content .try-item.done .try-check.gold { background:linear-gradient(135deg,${GOLD},${PURPLE}); }
@keyframes adv-shine { 0%{transform:translateX(-100%)} 60%,100%{transform:translateX(200%)} }
.adv-shine-badge::after { content:""; position:absolute; top:0; bottom:0; width:30%; background:linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent); animation:adv-shine 3s ease-in-out infinite; }

/* Architecture diagram */
.coursi-content .arch-wrap { background:rgba(255,255,255,0.02); border:1px solid ${BORDER}; border-radius:16px; padding:18px 20px; margin:18px 0 24px; }
.coursi-content .arch-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(150px, 1fr)); gap:12px; margin:8px 0 6px; }
.coursi-content .arch-node { background:linear-gradient(180deg, rgba(212,175,55,0.08), rgba(123,53,255,0.04)); border:1.5px solid rgba(212,175,55,0.25); border-radius:14px; padding:14px 10px; text-align:center; cursor:pointer; transition:all .25s; }
.coursi-content .arch-node:hover, .coursi-content .arch-node.active { border-color:${GOLD}; transform:translateY(-3px); box-shadow:0 8px 24px rgba(212,175,55,0.18); }
.coursi-content .arch-node .arch-ic { font-size:24px; margin-bottom:6px; }
.coursi-content .arch-node .arch-t { color:#fff; font-weight:800; font-size:13px; }
.coursi-content .arch-detail { margin-top:16px; background:rgba(212,175,55,0.06); border-right:3px solid ${GOLD}; border-radius:10px; padding:14px 16px; color:#CFC8DE; font-size:14px; line-height:1.8; min-height:48px; }

/* Calculator */
.coursi-content .calc-wrap { background:rgba(255,255,255,0.02); border:1px solid ${BORDER}; border-radius:16px; padding:18px 20px; margin:18px 0 24px; }
.coursi-content .calc-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:12px; margin:10px 0 16px; }
.coursi-content .calc-field { display:flex; flex-direction:column; gap:6px; }
.coursi-content .calc-field span { color:#B6AECC; font-size:12.5px; font-weight:600; }
.coursi-content .calc-field input { background:#0D0820; border:1px solid ${BORDER}; border-radius:10px; padding:10px 12px; color:#fff; font-family:${font}; font-size:14px; outline:none; transition:border-color .2s; }
.coursi-content .calc-field input:focus { border-color:${GOLD}; }
.coursi-content .calc-results { display:grid; grid-template-columns:repeat(auto-fill, minmax(150px, 1fr)); gap:10px; margin-top:8px; }
.coursi-content .calc-stat { background:linear-gradient(180deg, rgba(212,175,55,0.10), rgba(123,53,255,0.04)); border:1px solid rgba(212,175,55,0.25); border-radius:12px; padding:12px 14px; text-align:center; }
.coursi-content .calc-stat .calc-lbl { color:#9590A8; font-size:11.5px; font-weight:700; margin-bottom:4px; }
.coursi-content .calc-stat .calc-val { color:${GOLD}; font-size:20px; font-weight:800; }

/* Business plan */
.coursi-content .biz-wrap { background:rgba(255,255,255,0.02); border:1px solid ${BORDER}; border-radius:16px; padding:18px 20px; margin:18px 0 24px; }
.coursi-content .biz-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:10px 0 14px; }
.coursi-content .biz-field { display:flex; flex-direction:column; gap:6px; grid-column:span 2; }
.coursi-content .biz-field span { color:#B6AECC; font-size:12.5px; font-weight:700; }
.coursi-content .biz-field input, .coursi-content .biz-field textarea { background:#0D0820; border:1px solid ${BORDER}; border-radius:10px; padding:10px 12px; color:#fff; font-family:${font}; font-size:14px; outline:none; resize:vertical; transition:border-color .2s; }
.coursi-content .biz-field input:focus, .coursi-content .biz-field textarea:focus { border-color:${GOLD}; }
.coursi-content .biz-actions { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
.coursi-content .biz-btn { background:rgba(255,255,255,0.04); border:1px solid ${BORDER}; color:#CFC8DE; border-radius:10px; padding:9px 16px; font-family:${font}; font-size:13px; font-weight:700; cursor:pointer; transition:all .2s; }
.coursi-content .biz-btn:hover { border-color:${GOLD}; color:${GOLD}; }
.coursi-content .biz-btn.gold { background:linear-gradient(135deg, ${GOLD}, ${PURPLE}); color:#1a1208; border-color:transparent; }
.coursi-content .biz-btn.gold:hover { color:#1a1208; transform:translateY(-1px); }
.coursi-content .biz-saved { color:${CYAN}; font-size:11.5px; font-weight:700; opacity:0; transition:opacity .3s; }
.coursi-content .biz-saved.show { opacity:1; }

/* Gallery */
.coursi-content .gallery-wrap { margin:18px 0 24px; }
.coursi-content .gallery-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:14px; margin-top:14px; }
.coursi-content .gallery-card { background:linear-gradient(180deg, rgba(212,175,55,0.06), rgba(123,53,255,0.03)); border:1px solid rgba(212,175,55,0.20); border-radius:14px; padding:16px 18px; transition:all .2s; }
.coursi-content .gallery-card:hover { transform:translateY(-3px); border-color:${GOLD}; box-shadow:0 8px 24px rgba(212,175,55,0.12); }
.coursi-content .gallery-emoji { font-size:32px; margin-bottom:8px; }
.coursi-content .gallery-name { color:#fff; font-weight:800; font-size:15px; margin-bottom:6px; }
.coursi-content .gallery-desc { color:#B6AECC; font-size:13px; line-height:1.65; margin-bottom:10px; }
.coursi-content .gallery-stack { color:${GOLD}; font-size:11.5px; font-weight:700; letter-spacing:0.3px; padding-top:8px; border-top:1px solid rgba(212,175,55,0.15); }
`;


function ContentTab({
  chapterIndex,
  chapterTitle,
  chapterHtml,
  onGoQuiz,
}: {
  chapterIndex: number;
  chapterTitle: string;
  chapterHtml: string;
  onGoQuiz: () => void;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const flowDetails = [
    "الحدث المحفّز: أي شيء يبدأ السلسلة — رسالة، نموذج مُعبّأ، صف جديد في جدول بيانات، أو موعد في الوقت. كلما كان التعريف أدق، كانت الأتمتة أكثر موثوقية.",
    "الإجراء: ما يحدث استجابةً للحدث. يمكن أن يكون استدعاء نموذج ذكاء اصطناعي لصياغة رد، أو ترجمة، أو تصنيف، أو استخراج بيانات.",
    "النتيجة: المخرَج النهائي القابل للقياس — رسالة مرسلة، صف مُضاف، إشعار صادر، تقرير محفوظ. هنا تُقاس قيمة الأتمتة الحقيقية.",
  ];
  const archDetails = [
    "واجهة المستخدم: نقطة الالتقاء مع المستخدم — تطبيق ويب، روبوت محادثة، إضافة متصفّح. تصمَّم لتكون بسيطة تخفي التعقيد الخلفي.",
    "طبقة المنطق: العقل المنظِّم — تستقبل الطلب، تقرر أيّ نموذج تستدعي، تطبّق قواعد العمل، وتُعيد النتيجة. هنا يعيش منتجك الحقيقي.",
    "النموذج اللغوي: المحرك الذكي — يفهم ويولّد ويستنتج. تختار بين GPT أو Claude أو Gemini حسب طبيعة المهمة والتكلفة.",
    "قاعدة المعرفة (RAG): مكتبتك الخاصة المتاحة للنموذج. ملفات، مستندات، تاريخ. يبحث فيها قبل الإجابة لضمان الدقة.",
    "الذاكرة الدائمة: قاعدة بيانات تحفظ المحادثات والإعدادات لكل مستخدم — تمنح المنتج استمرارية حقيقية بين الجلسات.",
    "أدوات وAPIs: امتدادات تنفّذ إجراءات في العالم — إرسال بريد، حجز موعد، إنشاء صورة، البحث الحي.",
  ];
  const formatMoney = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  const recompute = (root: HTMLElement) => {
    const get = (k: string) =>
      Number((root.querySelector<HTMLInputElement>(`[data-calc="${k}"]`)?.value) ?? 0) || 0;
    const price = get("price");
    const customers = get("customers");
    const cost = get("cost");
    const aicost = get("aicost");
    const revenue = price * customers;
    const profit = revenue - cost - aicost * customers;
    const margin = price - aicost;
    const breakeven = margin > 0 ? Math.ceil(cost / margin) : 0;
    const annual = profit * 12;
    const set = (k: string, v: string) => {
      const el = root.querySelector<HTMLElement>(`[data-calc-out="${k}"]`);
      if (el) el.textContent = v;
    };
    set("revenue", formatMoney(revenue));
    set("profit", formatMoney(profit));
    set("breakeven", breakeven ? String(breakeven) : "—");
    set("annual", formatMoney(annual));
  };
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    // Initial compute
    if (root.querySelector("[data-calc]")) recompute(root);
    // Restore biz plan from localStorage
    root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[data-biz]").forEach((el) => {
      const key = el.dataset.biz;
      if (!key) return;
      const stored = localStorage.getItem(`coursi-biz-${key}`);
      if (stored !== null) el.value = stored;
    });

    const onClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const item = target.closest<HTMLElement>(".try-item");
      if (item) {
        item.classList.toggle("done");
        return;
      }
      const flow = target.closest<HTMLElement>(".flow-node");
      if (flow) {
        const idx = Number(flow.dataset.flowNode ?? "0");
        root.querySelectorAll(".flow-node").forEach((n) => n.classList.remove("active"));
        flow.classList.add("active");
        const detail = root.querySelector<HTMLElement>("[data-flow-detail]");
        if (detail) detail.textContent = flowDetails[idx] ?? "";
        return;
      }
      const arch = target.closest<HTMLElement>(".arch-node");
      if (arch) {
        const idx = Number(arch.dataset.archNode ?? "0");
        root.querySelectorAll(".arch-node").forEach((n) => n.classList.remove("active"));
        arch.classList.add("active");
        const detail = root.querySelector<HTMLElement>("[data-arch-detail]");
        if (detail) detail.textContent = archDetails[idx] ?? "";
        return;
      }
      if (target.closest("[data-biz-clear]")) {
        root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[data-biz]").forEach((el) => {
          el.value = "";
          if (el.dataset.biz) localStorage.removeItem(`coursi-biz-${el.dataset.biz}`);
        });
        return;
      }
      if (target.closest("[data-biz-export]")) {
        const fields: Record<string, string> = {};
        root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[data-biz]").forEach((el) => {
          if (el.dataset.biz) fields[el.dataset.biz] = el.value;
        });
        const labels: Record<string, string> = {
          name: "اسم المنتج", problem: "المشكلة", solution: "الحل", audience: "الجمهور المستهدف",
          mvp: "أصغر نسخة قابلة للإطلاق", pricing: "نموذج التسعير", channels: "قنوات التسويق", kpi: "مؤشر النجاح الأول",
        };
        const html = `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>خطة العمل — ${fields.name || "منتج جديد"}</title><style>body{font-family:Cairo,Tahoma,sans-serif;background:#fff;color:#111;padding:48px;max-width:780px;margin:auto;line-height:1.8}h1{color:#7B35FF;border-bottom:3px solid #D4AF37;padding-bottom:12px}h2{color:#D4AF37;margin-top:28px;font-size:18px}p{white-space:pre-wrap;background:#fafafa;padding:12px 16px;border-right:3px solid #00D4C8;border-radius:8px}@media print{body{padding:24px}}</style></head><body><h1>خطة العمل — ${fields.name || "بدون اسم"}</h1>${Object.entries(labels).map(([k, label]) => `<h2>${label}</h2><p>${(fields[k] || "—").replace(/</g, "&lt;")}</p>`).join("")}<p style="margin-top:40px;text-align:center;color:#888;border:none;background:none">— كورسي · COURSI —</p></body></html>`;
        const blob = new Blob([html], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `business-plan-${(fields.name || "coursi").replace(/\s+/g, "-")}.html`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
    };

    const onInput = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.matches("[data-calc]")) {
        recompute(root);
        return;
      }
      if (target.matches("[data-biz]")) {
        const el = target as HTMLInputElement | HTMLTextAreaElement;
        const key = el.dataset.biz;
        if (key) {
          localStorage.setItem(`coursi-biz-${key}`, el.value);
          const saved = root.querySelector<HTMLElement>("[data-biz-saved]");
          if (saved) {
            saved.classList.add("show");
            window.setTimeout(() => saved.classList.remove("show"), 1200);
          }
        }
      }
    };

    root.addEventListener("click", onClick);
    root.addEventListener("input", onInput);
    return () => {
      root.removeEventListener("click", onClick);
      root.removeEventListener("input", onInput);
    };
  }, [chapterHtml]);


  return (
    <div style={{ padding: "28px 32px" }}>
      <style>{CONTENT_CSS}</style>
      <div style={{ color: "var(--text-muted)", fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>
        الفصل {toAr(chapterIndex + 1)}
      </div>
      <h1 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 24, marginBottom: 12, fontFamily: font }}>
        {chapterTitle}
      </h1>
      <div style={{ display: "flex", gap: 16, color: "var(--text-secondary)", fontSize: 12, marginBottom: 12 }}>
        <span>📖 محتوى تفصيلي</span>
        <span>✦ اختبار في النهاية</span>
        <span>🎯 مهمة عملية</span>
      </div>

      <div ref={rootRef} className="coursi-content" dir="rtl" dangerouslySetInnerHTML={{ __html: chapterHtml }} />

      <button
        onClick={onGoQuiz}
        style={{
          background: "linear-gradient(135deg,#7B35FF,#00D4C8)",
          color: "var(--text-primary)",
          fontSize: 15,
          fontWeight: 700,
          padding: 16,
          borderRadius: 50,
          border: "none",
          width: "100%",
          cursor: "pointer",
          fontFamily: font,
          boxShadow: "0 0 24px rgba(123,53,255,0.3)",
          marginTop: 32,
        }}
      >
        انتقل للاختبار ←
      </button>
    </div>
  );
}

function QuizTab({
  chapterIndex,
  questions,
  currentQ,
  answered,
  selectedAnswer,
  quizComplete,
  score,
  isLast,
  courseName,
  level,
  userName,
  onAnswer,
  onNextChapter,
}: {
  chapterIndex: number;
  questions: QuizQuestion[];
  currentQ: number;
  answered: boolean;
  selectedAnswer: number | null;
  quizComplete: boolean;
  score: number;
  isLast: boolean;
  courseName: string;
  level: Level;
  userName: string;
  onAnswer: (i: number) => void;
  onNextChapter: () => void;
}) {

  if (quizComplete) {
    return (
      <div style={{ padding: "28px 32px" }}>
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#7B35FF,#00D4C8)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            boxShadow: "0 0 40px rgba(123,53,255,0.4)",
          }}
        >
          <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 36, lineHeight: 1 }}>{toAr(score)}</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 4 }}>/{toAr(questions.length)}</div>
        </div>
        <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 22, textAlign: "center" }}>
          أحسنت! أكملت اختبار الفصل {toAr(chapterIndex + 1)}
        </div>
        <div style={{ color: "var(--text-secondary)", textAlign: "center", marginTop: 8, marginBottom: 28 }}>
          {isLast ? "أنهيت جميع الفصول 🎉" : "انتقلت بنجاح للفصل التالي"}
        </div>

        {isLast ? (
          level === "advanced" ? (
            <GraduationCertificate userName={userName} courseName={courseName} />
          ) : (
            <div
              style={{
                margin: 24,
                background: "linear-gradient(135deg, rgba(123,53,255,0.08), rgba(0,212,200,0.04))",
                border: "1px solid rgba(123,53,255,0.2)",
                borderRadius: 20,
                padding: "48px 36px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 64, marginBottom: 16 }}>🏆</div>
              <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 28, marginBottom: 12 }}>
                مبروك! أتممت الكورس بنجاح
              </div>
              <div
                style={{
                  color: "var(--text-secondary)",
                  fontSize: 15,
                  lineHeight: 1.8,
                  maxWidth: 440,
                  margin: "0 auto 28px",
                }}
              >
                لقد أكملت {courseName}. أنت الآن جاهز للمستوى التالي.
              </div>
              <button
                onClick={() => {
                  window.location.href = "https://coursi.ai/ai/payment";
                }}
                style={{
                  background: "linear-gradient(135deg,#7B35FF,#00D4C8)",
                  color: "var(--text-primary)",
                  fontSize: 15,
                  fontWeight: 700,
                  padding: "14px 32px",
                  borderRadius: 50,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: font,
                  boxShadow: "0 0 24px rgba(123,53,255,0.3)",
                }}
              >
                🚀 انتقل للمستوى التالي
              </button>
            </div>
          )

        ) : (
          <button
            onClick={onNextChapter}
            style={{
              background: "linear-gradient(135deg,#7B35FF,#00D4C8)",
              color: "var(--text-primary)",
              fontSize: 15,
              fontWeight: 700,
              padding: 16,
              borderRadius: 50,
              border: "none",
              width: "100%",
              cursor: "pointer",
              fontFamily: font,
              boxShadow: "0 0 24px rgba(123,53,255,0.3)",
            }}
          >
            الفصل التالي ←
          </button>
        )}
      </div>
    );
  }

  const q = questions[currentQ];
  if (!q) {
    return <div style={{ padding: 32, color: "var(--text-secondary)" }}>لا توجد أسئلة لهذا الفصل.</div>;
  }
  const correct = q.correct;
  const progressPct = ((currentQ + (answered ? 1 : 0)) / questions.length) * 100;

  return (
    <div style={{ padding: "28px 32px" }}>
      <h2 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 22, fontFamily: font }}>
        اختبار الفصل {toAr(chapterIndex + 1)}
      </h2>
      <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 4, marginBottom: 20 }}>
        {toAr(questions.length)} أسئلة · تظهر الإجابة الصحيحة فوراً
      </div>

      <div style={{ height: 3, background: "var(--border)", borderRadius: 2, overflow: "hidden", marginBottom: 24 }}>
        <div
          style={{
            width: `${progressPct}%`,
            height: "100%",
            background: "linear-gradient(90deg,#7B35FF,#00D4C8)",
            transition: "width 0.3s",
          }}
        />
      </div>

      <div style={{ color: "var(--text-muted)", fontSize: 11, letterSpacing: 2, marginBottom: 10 }}>
        السؤال {toAr(currentQ + 1)}
      </div>
      <div style={{ color: "#DDD", fontSize: 18, fontWeight: 700, marginBottom: 20, lineHeight: 1.6 }}>
        {q.question}
      </div>

      {q.options.map((opt, i) => {
        const isCorrect = i === correct;
        const isPicked = selectedAnswer === i;
        let borderColor = "var(--border)";
        let bg = "var(--bg-secondary)";
        let circleBg = "var(--border)";
        let circleColor = "var(--text-muted)";

        if (answered) {
          if (isCorrect) {
            borderColor = "#00D4C8";
            bg = "rgba(0,212,200,0.07)";
            circleBg = "#00D4C8";
            circleColor = "var(--bg-primary)";
          } else if (isPicked) {
            borderColor = "#C5545E";
            bg = "rgba(197,84,94,0.07)";
            circleBg = "#C5545E";
            circleColor = "var(--text-primary)";
          }
        }

        return (
          <button
            key={i}
            disabled={answered}
            onClick={() => onAnswer(i)}
            style={{
              background: bg,
              border: `1.5px solid ${borderColor}`,
              borderRadius: 12,
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: answered ? "default" : "pointer",
              width: "100%",
              marginBottom: 10,
              fontFamily: font,
              transition: "all 0.2s",
              color: "#DDD",
              fontSize: 14,
              textAlign: "right",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: circleBg,
                color: circleColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {ARABIC_LETTERS[i]}
            </div>
            <div style={{ flex: 1 }}>{opt}</div>
          </button>
        );
      })}

      {answered && (
        <div
          style={{
            marginTop: 18,
            padding: "14px 18px",
            background: selectedAnswer === correct ? "rgba(0,212,200,0.08)" : "rgba(197,84,94,0.08)",
            border: `1px solid ${selectedAnswer === correct ? "#00D4C8" : "#C5545E"}`,
            borderRadius: 10,
            color: "#DDD",
            fontSize: 14,
            lineHeight: 1.7,
          }}
        >
          {q.feedback}
        </div>
      )}
    </div>
  );
}

function GraduationCertificate({ userName, courseName }: { userName: string; courseName: string }) {
  const today = new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
  const handlePrint = () => window.print();
  return (
    <div style={{ margin: 24 }}>
      <style>{`@media print { body * { visibility:hidden } .coursi-cert, .coursi-cert * { visibility:visible } .coursi-cert { position:absolute; inset:0; margin:0; box-shadow:none } }`}</style>
      <div
        className="coursi-cert"
        style={{
          background: "linear-gradient(135deg, #0B0820, #1a0f2e)",
          border: `2px solid ${GOLD}`,
          borderRadius: 20,
          padding: "48px 36px",
          textAlign: "center",
          boxShadow: `0 0 60px rgba(212,175,55,0.20)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 12, border: `1px solid rgba(212,175,55,0.35)`, borderRadius: 14, pointerEvents: "none" }} />
        <div style={{ fontSize: 56, marginBottom: 8 }}>🏆</div>
        <div style={{ color: GOLD, fontSize: 12, letterSpacing: 4, fontWeight: 800, marginBottom: 8 }}>شهادة إتمام</div>
        <div style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: 24, marginBottom: 18, fontFamily: font }}>
          المستوى المتقدم — إتقان الذكاء الاصطناعي
        </div>
        <div style={{ color: "#B6AECC", fontSize: 13, marginBottom: 4 }}>تُمنح هذه الشهادة إلى</div>
        <div style={{ color: GOLD, fontWeight: 800, fontSize: 30, fontFamily: font, padding: "10px 0", borderTop: `1px solid rgba(212,175,55,0.30)`, borderBottom: `1px solid rgba(212,175,55,0.30)`, margin: "10px 0 18px" }}>
          {userName}
        </div>
        <div style={{ color: "#CFC8DE", fontSize: 14, lineHeight: 1.9, maxWidth: 520, margin: "0 auto 18px" }}>
          لإكماله بنجاح {courseName} بمستوياته الثلاثة: المبتدئ، المتوسط، والمتقدم — وبنائه منتج ذكاء اصطناعي حقيقي كمشروع تخرّج.
        </div>
        <div style={{ display: "flex", justifyContent: "space-around", marginTop: 24, color: "#9590A8", fontSize: 12 }}>
          <div><div style={{ color: GOLD, fontWeight: 800, marginBottom: 4 }}>التاريخ</div>{today}</div>
          <div><div style={{ color: GOLD, fontWeight: 800, marginBottom: 4 }}>المنصة</div>COURSI · كورسي</div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 26 }}>
          <button onClick={handlePrint} style={{ background: `linear-gradient(135deg, ${GOLD}, ${PURPLE})`, color: "#1a1208", fontWeight: 800, fontSize: 14, padding: "12px 24px", borderRadius: 50, border: "none", cursor: "pointer", fontFamily: font }}>
            🖨 طباعة / حفظ PDF
          </button>
          <button onClick={() => (window.location.href = "https://coursi.ai")} style={{ background: "transparent", color: GOLD, fontWeight: 700, fontSize: 14, padding: "12px 24px", borderRadius: 50, border: `1px solid ${GOLD}`, cursor: "pointer", fontFamily: font }}>
            الخطوات التالية ←
          </button>
        </div>
      </div>
      <div style={{ marginTop: 24, padding: 20, background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER}`, borderRadius: 14 }}>
        <div style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: 15, marginBottom: 10 }}>رحلتك في كورسي</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          {[
            { lvl: "المبتدئ", desc: "أساسيات الذكاء الاصطناعي والأدوات اليومية", c: CYAN },
            { lvl: "المتوسط", desc: "هندسة الطلب، الأتمتة، وبناء روبوتات احترافية", c: PURPLE },
            { lvl: "المتقدم", desc: "بناء منتجات SaaS كاملة بـAI من الصفر للسوق", c: GOLD },
          ].map((s, i) => (
            <div key={i} style={{ padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.03)", borderRight: `3px solid ${s.c}` }}>
              <div style={{ color: s.c, fontWeight: 800, fontSize: 13, marginBottom: 4 }}>✓ {s.lvl}</div>
              <div style={{ color: "#B6AECC", fontSize: 12, lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
