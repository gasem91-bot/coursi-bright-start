import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import coursiLogo from "@/assets/coursi-logo.png";
import { COURSE_CONTENT, type QuizQuestion } from "@/lib/course-content";

export const Route = createFileRoute("/course/ai")({
  component: CourseAIPage,
  head: () => ({ meta: [{ title: "كورس الذكاء الاصطناعي — COURSI" }] }),
});

type Level = "beginner" | "intermediate" | "advanced";
type Tier = "course" | "course_ai";

const font = "Noto Sans Arabic, sans-serif";

const COURSE = COURSE_CONTENT;

const AR_NUM = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
const toAr = (n: number) => String(n).split("").map((d) => AR_NUM[+d] ?? d).join("");
const pad2 = (n: number) => String(n).padStart(2, "0");
const chapterId = (level: Level, idx: number) => `ai-${level}-${pad2(idx + 1)}`;

const ARABIC_LETTERS = ["أ", "ب", "ج", "د"];

function CourseAIPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState<Level>("beginner");
  const [tier, setTier] = useState<Tier>("course");
  const [userId, setUserId] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

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
    }, 1500);
  };

  const markComplete = async () => {
    if (!userId) return;
    const cid = chapterId(level, activeChapter);
    await supabase
      .from("course_progress")
      .upsert(
        { user_id: userId, chapter_id: cid, completed: true },
        { onConflict: "user_id,chapter_id" },
      );
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
          background: "#000",
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
            border: "3px solid #1E1E1E",
            borderTopColor: "#7B35C0",
            borderRightColor: "#40C8C8",
            animation: "spin 1s linear infinite",
          }}
        />
        <div style={{ marginTop: 18, color: "#888", fontSize: 14 }}>جاري تحميل الكورس...</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ background: "#000", color: "#fff", height: "100vh", display: "flex", flexDirection: "column", fontFamily: font, overflow: "hidden" }}>
      {/* Top bar */}
      <div
        style={{
          background: "#000",
          borderBottom: "1px solid #1E1E1E",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <button
          onClick={() => navigate({ to: "/dashboard" })}
          style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
          aria-label="العودة للوحة التحكم"
        >
          <img src={coursiLogo} alt="COURSI" style={{ height: 28, display: "block" }} />
        </button>
        <div style={{ color: "#888", fontSize: 13 }}>{course.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ color: "#40C8C8", fontWeight: 700, fontSize: 13 }}>{toAr(pct)}%</div>
          <div style={{ width: 80, height: 3, background: "#1E1E1E", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg,#7B35C0,#40C8C8)" }} />
          </div>
        </div>
      </div>

      {/* Body: sidebar + content */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Sidebar (right in RTL = first child) */}
        <aside
          style={{
            width: 280,
            flexShrink: 0,
            background: "#050505",
            borderLeft: "1px solid #1E1E1E",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              padding: 16,
              borderBottom: "1px solid #0a0a0a",
              position: "sticky",
              top: 0,
              background: "#050505",
              zIndex: 1,
            }}
          >
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{course.name}</div>
            <div style={{ color: "#888", fontSize: 11, marginBottom: 10 }}>{course.meta}</div>
            <div style={{ height: 3, background: "#1E1E1E", borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
              <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg,#7B35C0,#40C8C8)" }} />
            </div>
            <div style={{ color: "#40C8C8", fontSize: 10, fontWeight: 700 }}>
              {toAr(completedCount)} / {toAr(total)} مكتمل · {toAr(pct)}%
            </div>
          </div>

          {course.chapters.map((ch, i) => {
            const isActive = i === activeChapter;
            const isDone = completedIds.has(chapterId(level, i));
            return (
              <div
                key={i}
                onClick={() => goToChapter(i)}
                style={{
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  borderBottom: "1px solid #0a0a0a",
                  cursor: "pointer",
                  background: isActive ? "rgba(123,53,192,0.08)" : "transparent",
                  borderRight: isActive ? "2px solid #7B35C0" : "2px solid transparent",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "#0a0a0a";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "transparent";
                }}
              >
                <div style={{ width: 28, color: "#555", fontSize: 10, fontWeight: 700 }}>{pad2(i + 1)}</div>
                <div
                  style={{
                    flex: 1,
                    fontSize: 12,
                    lineHeight: 1.4,
                    color: isDone ? "#444" : isActive ? "#bbb" : "#888",
                  }}
                >
                  {ch.title}
                </div>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    border: isDone ? "none" : "1.5px solid #1E1E1E",
                    background: isDone ? "linear-gradient(135deg,#7B35C0,#40C8C8)" : "transparent",
                    flexShrink: 0,
                  }}
                />
              </div>
            );
          })}
        </aside>

        {/* Content */}
        <main ref={contentScrollRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Tabs */}
          <div
            style={{
              padding: "16px 24px 0",
              display: "flex",
              gap: 8,
              borderBottom: "1px solid #1E1E1E",
              background: "#000",
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
                    background: isActive ? "linear-gradient(135deg,#7B35C0,#40C8C8)" : "transparent",
                    color: isActive ? "#fff" : "#666",
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
              onGoQuiz={() => setActiveTab("quiz")}
            />
          ) : (
            <QuizTab
              chapterIndex={activeChapter}
              currentQ={currentQ}
              answered={answered}
              selectedAnswer={selectedAnswer}
              quizComplete={quizComplete}
              score={score}
              isLast={isLast}
              courseName={course.name}
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
              background: "linear-gradient(135deg,#7B35C0,#40C8C8)",
              border: "none",
              cursor: "pointer",
              zIndex: 100,
              boxShadow: "0 0 24px rgba(123,53,192,0.45)",
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
              background: "#050505",
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
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>🤖 مساعد AI كورس</div>
              <button
                onClick={() => setChatOpen(false)}
                style={{ background: "transparent", border: "none", color: "#888", fontSize: 20, cursor: "pointer" }}
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
                    background: m.from === "ai" ? "#141414" : "rgba(64,200,200,0.12)",
                    borderRadius: m.from === "ai" ? "12px 12px 12px 0" : "12px 12px 0 12px",
                    padding: "12px 16px",
                    maxWidth: "85%",
                    marginBottom: 12,
                    marginLeft: m.from === "user" ? "auto" : 0,
                    fontSize: 14,
                    color: m.from === "ai" ? "#AAA" : "#fff",
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
                  background: "#0D0D0D",
                  border: "1px solid #1E1E1E",
                  borderRadius: 20,
                  padding: "8px 14px",
                  color: "#fff",
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
                  background: "linear-gradient(135deg,#7B35C0,#40C8C8)",
                  border: "none",
                  cursor: "pointer",
                  color: "#fff",
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

function ContentTab({
  chapterIndex,
  chapterTitle,
  onGoQuiz,
}: {
  chapterIndex: number;
  chapterTitle: string;
  onGoQuiz: () => void;
}) {
  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ color: "#666", fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>
        الفصل {toAr(chapterIndex + 1)}
      </div>
      <h1 style={{ color: "#fff", fontWeight: 700, fontSize: 24, marginBottom: 12, fontFamily: font }}>
        {chapterTitle}
      </h1>
      <div style={{ display: "flex", gap: 16, color: "#888", fontSize: 12, marginBottom: 4 }}>
        <span>📖 محتوى تفصيلي</span>
        <span>✦ اختبار في النهاية</span>
        <span>🎯 مهمة عملية</span>
      </div>

      <div
        style={{
          background: "rgba(123,53,192,0.06)",
          borderRight: "3px solid #7B35C0",
          borderRadius: 10,
          padding: "16px 18px",
          margin: "20px 0",
        }}
      >
        <div style={{ color: "#9B55E0", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
          💡 ما ستتعلمه في هذا الفصل
        </div>
        <div style={{ color: "#AAA", fontSize: 14 }}>
          محتوى هذا الفصل قيد الإعداد ويُضاف قريباً من فريق COURSI
        </div>
      </div>

      <p style={{ color: "#AAA", fontSize: 15, lineHeight: 1.9 }}>
        هذا الفصل يغطي {chapterTitle} بشكل كامل وعملي. المحتوى التفصيلي مع الأمثلة والتطبيقات سيظهر هنا قريباً.
      </p>

      <div
        style={{
          width: "100%",
          aspectRatio: "16 / 9",
          background: "#0D0D0D",
          border: "1px solid #1E1E1E",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "20px 0",
          color: "#333",
          fontSize: 13,
        }}
      >
        🖼️ صورة توضيحية للفصل — تُضاف قريباً
      </div>

      <div
        style={{
          background: "rgba(64,200,200,0.05)",
          borderRight: "3px solid #40C8C8",
          borderRadius: 10,
          padding: "16px 18px",
          margin: "20px 0",
        }}
      >
        <div style={{ color: "#40C8C8", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
          🎯 مهمتك في هذا الفصل
        </div>
        <div style={{ color: "#AAA", fontSize: 14 }}>
          راجع المحتوى جيداً ثم انتقل للاختبار عند الانتهاء. طبّق ما تتعلّمه فوراً في حياتك العملية.
        </div>
      </div>

      <button
        onClick={onGoQuiz}
        style={{
          background: "linear-gradient(135deg,#7B35C0,#40C8C8)",
          color: "#fff",
          fontSize: 15,
          fontWeight: 700,
          padding: 16,
          borderRadius: 50,
          border: "none",
          width: "100%",
          cursor: "pointer",
          fontFamily: font,
          boxShadow: "0 0 24px rgba(123,53,192,0.3)",
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
  currentQ,
  answered,
  selectedAnswer,
  quizComplete,
  score,
  isLast,
  courseName,
  onAnswer,
  onNextChapter,
}: {
  chapterIndex: number;
  currentQ: number;
  answered: boolean;
  selectedAnswer: number | null;
  quizComplete: boolean;
  score: number;
  isLast: boolean;
  courseName: string;
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
            background: "linear-gradient(135deg,#7B35C0,#40C8C8)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            boxShadow: "0 0 40px rgba(123,53,192,0.4)",
          }}
        >
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 36, lineHeight: 1 }}>{toAr(score)}</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 4 }}>/٣</div>
        </div>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 22, textAlign: "center" }}>
          أحسنت! أكملت اختبار الفصل {toAr(chapterIndex + 1)}
        </div>
        <div style={{ color: "#888", textAlign: "center", marginTop: 8, marginBottom: 28 }}>
          {isLast ? "أنهيت جميع الفصول 🎉" : "انتقلت بنجاح للفصل التالي"}
        </div>

        {isLast ? (
          <div
            style={{
              margin: 24,
              background: "linear-gradient(135deg, rgba(123,53,192,0.08), rgba(64,200,200,0.04))",
              border: "1px solid rgba(123,53,192,0.2)",
              borderRadius: 20,
              padding: "48px 36px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 64, marginBottom: 16 }}>🏆</div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 28, marginBottom: 12 }}>
              مبروك! أتممت الكورس بنجاح
            </div>
            <div
              style={{
                color: "#AAA",
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
                background: "linear-gradient(135deg,#7B35C0,#40C8C8)",
                color: "#fff",
                fontSize: 15,
                fontWeight: 700,
                padding: "14px 32px",
                borderRadius: 50,
                border: "none",
                cursor: "pointer",
                fontFamily: font,
                boxShadow: "0 0 24px rgba(123,53,192,0.3)",
              }}
            >
              🚀 انتقل للمستوى التالي
            </button>
          </div>
        ) : (
          <button
            onClick={onNextChapter}
            style={{
              background: "linear-gradient(135deg,#7B35C0,#40C8C8)",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              padding: 16,
              borderRadius: 50,
              border: "none",
              width: "100%",
              cursor: "pointer",
              fontFamily: font,
              boxShadow: "0 0 24px rgba(123,53,192,0.3)",
            }}
          >
            الفصل التالي ←
          </button>
        )}
      </div>
    );
  }

  const q = QUESTIONS[currentQ];
  const correct = q.correct;
  const progressPct = ((currentQ + (answered ? 1 : 0)) / QUESTIONS.length) * 100;

  return (
    <div style={{ padding: "28px 32px" }}>
      <h2 style={{ color: "#fff", fontWeight: 700, fontSize: 22, fontFamily: font }}>
        اختبار الفصل {toAr(chapterIndex + 1)}
      </h2>
      <div style={{ color: "#888", fontSize: 12, marginTop: 4, marginBottom: 20 }}>
        ٣ أسئلة · تظهر الإجابة الصحيحة فوراً
      </div>

      <div style={{ height: 3, background: "#1E1E1E", borderRadius: 2, overflow: "hidden", marginBottom: 24 }}>
        <div
          style={{
            width: `${progressPct}%`,
            height: "100%",
            background: "linear-gradient(90deg,#7B35C0,#40C8C8)",
            transition: "width 0.3s",
          }}
        />
      </div>

      <div style={{ color: "#666", fontSize: 11, letterSpacing: 2, marginBottom: 10 }}>
        السؤال {toAr(currentQ + 1)}
      </div>
      <div style={{ color: "#DDD", fontSize: 18, fontWeight: 700, marginBottom: 20, lineHeight: 1.6 }}>
        {q.q}
      </div>

      {q.opts.map((opt, i) => {
        const isCorrect = i === correct;
        const isPicked = selectedAnswer === i;
        let borderColor = "#1E1E1E";
        let bg = "#0D0D0D";
        let circleBg = "#1E1E1E";
        let circleColor = "#666";

        if (answered) {
          if (isCorrect) {
            borderColor = "#40C8C8";
            bg = "rgba(64,200,200,0.07)";
            circleBg = "#40C8C8";
            circleColor = "#000";
          } else if (isPicked) {
            borderColor = "#C5545E";
            bg = "rgba(197,84,94,0.07)";
            circleBg = "#C5545E";
            circleColor = "#fff";
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
    </div>
  );
}
