import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getExamState, submitExam } from "@/lib/exam.functions";
import {
  EXAM_INTRO,
  EXAM_PASS_PCT,
  EXAM_TITLE,
  type ExamState,
  type ExamSubmitResult,
  type Level,
} from "@/lib/exam";
import { LEVEL_ACCENT } from "@/lib/certificate";
import CertificateCard from "@/components/certificate-card";

const font = "Cairo, 'Noto Sans Arabic', sans-serif";
const AR_NUM = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
const toAr = (n: number) => String(n).split("").map((d) => AR_NUM[+d] ?? d).join("");
const LETTERS = ["أ", "ب", "ج", "د"];

function remaining(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "";
  const h = Math.floor(ms / 3600_000);
  const m = Math.floor((ms % 3600_000) / 60_000);
  return `${toAr(h)} ساعة و${toAr(m)} دقيقة`;
}

export default function LevelExam({
  level,
  userId,
  userName,
  onPassed,
}: {
  level: Level;
  userId: string;
  userName: string;
  onPassed?: () => void;
}) {
  const loadState = useServerFn(getExamState);
  const submit = useServerFn(submitExam);

  const [state, setState] = useState<ExamState | null>(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ExamSubmitResult | null>(null);

  const accent = LEVEL_ACCENT[level];

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const s = await loadState({ data: { level } });
      setState(s);
    } catch {
      toast.error("تعذّر تحميل الاختبار، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  }, [loadState, level]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (loading) {
    return <Wrap><p style={{ color: "var(--text-secondary)" }}>جاري تحميل الاختبار...</p></Wrap>;
  }
  if (!state) return null;

  const questions = state.questions;

  // Already passed → certificate
  if (state.passed || result?.passed) {
    return (
      <Wrap>
        <Header level={level} />
        <div
          style={{
            background: `linear-gradient(160deg, ${accent}14, rgba(123,53,255,0.06))`,
            border: `1px solid ${accent}55`,
            borderRadius: 18,
            padding: 24,
            textAlign: "center",
            marginBottom: 18,
          }}
        >
          <div style={{ fontSize: 54 }}>🏆</div>
          <div style={{ color: "var(--text-primary)", fontWeight: 900, fontSize: 22, marginTop: 6 }}>
            مبروك! اجتزت الاختبار النهائي
          </div>
          <div style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 8 }}>
            نتيجتك:{" "}
            <strong dir="ltr">
              {(result?.score ?? state.certificate?.score ?? state.bestScore) ?? 0}/
              {result?.total ?? state.certificate?.total ?? questions.length}
            </strong>{" "}
            — شهادتك مسجّلة في حسابك بشكل دائم
          </div>
        </div>
        <CertificateCard
          level={level}
          userId={userId}
          userName={userName}
          unlocked
          completed={1}
          total={1}
          certIdOverride={state.certificate?.certificateId ?? result?.certificateId}
          examScore={result?.score ?? state.certificate?.score ?? undefined}
          examTotal={result?.total ?? state.certificate?.total ?? undefined}
          completedAt={state.certificate ? new Date(state.certificate.issuedAt) : new Date()}
        />
      </Wrap>
    );
  }

  // Not all chapters done
  if (!state.eligible) {
    return (
      <Wrap>
        <Header level={level} />
        <Notice icon="🔒" title="الاختبار النهائي مقفل">
          أكمل جميع فصول هذا المستوى أولاً، ثم يفتح لك الاختبار النهائي المكوّن من {toAr(questions.length)} سؤالاً.
        </Notice>
      </Wrap>
    );
  }

  // Failed result screen (no answer reveal)
  if (result && result.ok && !result.passed) {
    const lockedTxt = state.lastAttempt ? "" : "";
    return (
      <Wrap>
        <Header level={level} />
        <Notice icon="📉" title={`نتيجتك: ${toAr(result.score ?? 0)} من ${toAr(result.total ?? 0)}`}>
          لم تجتز هذه المرة — نسبة النجاح المطلوبة {toAr(EXAM_PASS_PCT)}٪. لم نكشف لك الإجابات الصحيحة حتى تعيد
          المحاولة بجدّية. راجع الفصول ثم أعد الاختبار بعد ٢٤ ساعة{lockedTxt}
        </Notice>
        <div style={{ marginTop: 14 }}>
          <div style={{ color: "var(--text-muted)", fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>
            ✦ مراجعة سريعة (صح / خطأ فقط)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(64px,1fr))", gap: 8 }}>
            {(result.results ?? []).map((r, i) => (
              <div
                key={r.id}
                style={{
                  borderRadius: 10,
                  padding: "10px 6px",
                  textAlign: "center",
                  fontSize: 12,
                  fontWeight: 800,
                  color: r.correct ? "#00D4C8" : "#C5545E",
                  background: r.correct ? "rgba(0,212,200,0.08)" : "rgba(197,84,94,0.08)",
                  border: `1px solid ${r.correct ? "rgba(0,212,200,0.35)" : "rgba(197,84,94,0.35)"}`,
                }}
              >
                {toAr(i + 1)} {r.correct ? "✓" : "✕"}
              </div>
            ))}
          </div>
        </div>
      </Wrap>
    );
  }

  // Cooldown
  if (state.lockedUntil && !started) {
    return (
      <Wrap>
        <Header level={level} />
        <Notice icon="⏳" title="إعادة المحاولة متاحة قريباً">
          آخر محاولة لم تنجح (
          <span dir="ltr">
            {state.lastAttempt?.score}/{state.lastAttempt?.total}
          </span>
          ). تستطيع إعادة الاختبار بعد {remaining(state.lockedUntil)}. استغل الوقت في مراجعة الفصول
        </Notice>
      </Wrap>
    );
  }

  // Intro
  if (!started) {
    return (
      <Wrap>
        <Header level={level} />
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: 18,
            padding: 24,
          }}
        >
          <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 2 }}>{EXAM_INTRO[level]}</p>
          <ul style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 2.2, paddingInlineStart: 18 }}>
            <li>{toAr(questions.length)} سؤال اختيار من متعدد</li>
            <li>نسبة النجاح {toAr(EXAM_PASS_PCT)}٪ (أي {toAr(state.passScore)} إجابات صحيحة على الأقل)</li>
            <li>لن تُعرض الإجابة الصحيحة عند الخطأ — فقط صح أو خطأ</li>
            <li>عند عدم النجاح تستطيع إعادة الاختبار بعد ٢٤ ساعة</li>
            <li>عند النجاح تُمنح شهادة هذا المستوى وتُسجَّل في حسابك</li>
          </ul>
          {state.attempts > 0 && (
            <p style={{ color: "var(--text-muted)", fontSize: 12 }}>
              عدد محاولاتك السابقة: {toAr(state.attempts)} · أفضل نتيجة: <span dir="ltr">{state.bestScore}</span>
            </p>
          )}
          <button
            onClick={() => {
              setStarted(true);
              setCurrent(0);
              setAnswers({});
              setResult(null);
            }}
            style={btn(accent)}
          >
            ابدأ الاختبار النهائي ←
          </button>
        </div>
      </Wrap>
    );
  }

  const q = questions[current];
  const picked = q ? answers[q.id] : undefined;
  const answeredCount = Object.keys(answers).length;
  const pct = (answeredCount / questions.length) * 100;

  const finish = async () => {
    setBusy(true);
    try {
      const r = await submit({
        data: { level, answers: Object.entries(answers).map(([id, answer]) => ({ id, answer })) },
      });
      setResult(r);
      setStarted(false);
      if (r.ok && r.passed) {
        toast.success("🏆 مبروك! اجتزت الاختبار النهائي");
        onPassed?.();
      } else if (r.reason === "cooldown") {
        toast.error("إعادة المحاولة غير متاحة الآن");
      }
      await refresh();
    } catch {
      toast.error("تعذّر إرسال إجاباتك، حاول مرة أخرى");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Wrap>
      <Header level={level} />
      <div style={{ height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg,#7B35FF,${accent})`, transition: "width .3s" }} />
      </div>
      <div style={{ color: "var(--text-muted)", fontSize: 11, letterSpacing: 2, marginBottom: 10 }}>
        السؤال {toAr(current + 1)} من {toAr(questions.length)}
      </div>
      <div style={{ color: "var(--text-primary)", fontSize: 18, fontWeight: 700, marginBottom: 18, lineHeight: 1.7 }}>
        {q?.question}
      </div>

      {q?.options.map((opt, i) => {
        const isPicked = picked === i;
        return (
          <button
            key={i}
            onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
            style={{
              background: isPicked ? `${accent}14` : "var(--bg-secondary)",
              border: `1.5px solid ${isPicked ? accent : "var(--border)"}`,
              borderRadius: 12,
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              width: "100%",
              marginBottom: 10,
              fontFamily: font,
              color: "var(--text-primary)",
              fontSize: 14,
              textAlign: "right",
            }}
          >
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: isPicked ? accent : "var(--border)",
                color: isPicked ? "#060410" : "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 13,
                flexShrink: 0,
              }}
            >
              {LETTERS[i]}
            </span>
            <span style={{ flex: 1 }}>{opt}</span>
          </button>
        );
      })}

      <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
        <button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          style={{ ...btnGhost(), opacity: current === 0 ? 0.4 : 1 }}
        >
          → السابق
        </button>
        {current < questions.length - 1 ? (
          <button onClick={() => setCurrent((c) => c + 1)} disabled={picked == null} style={{ ...btn(accent), opacity: picked == null ? 0.5 : 1 }}>
            التالي ←
          </button>
        ) : (
          <button
            onClick={finish}
            disabled={busy || answeredCount < questions.length}
            style={{ ...btn(accent), opacity: busy || answeredCount < questions.length ? 0.5 : 1 }}
          >
            {busy ? "جاري التصحيح..." : "سلّم الاختبار"}
          </button>
        )}
        <span style={{ color: "var(--text-muted)", fontSize: 12, alignSelf: "center" }}>
          أجبت على {toAr(answeredCount)} من {toAr(questions.length)}
        </span>
      </div>
    </Wrap>
  );
}

/* ---------- small building blocks ---------- */

const btn = (accent: string): React.CSSProperties => ({
  background: `linear-gradient(135deg,#7B35FF,${accent})`,
  color: "#fff",
  fontSize: 14,
  fontWeight: 800,
  padding: "12px 26px",
  borderRadius: 40,
  border: "none",
  cursor: "pointer",
  fontFamily: font,
  marginTop: 6,
});

const btnGhost = (): React.CSSProperties => ({
  background: "transparent",
  color: "var(--text-secondary)",
  fontSize: 14,
  fontWeight: 700,
  padding: "12px 22px",
  borderRadius: 40,
  border: "1px solid var(--border)",
  cursor: "pointer",
  fontFamily: font,
  marginTop: 6,
});

function Wrap({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: "28px 32px", fontFamily: font, direction: "rtl" }}>{children}</div>;
}

function Header({ level }: { level: Level }) {
  return (
    <>
      <h2 style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: 22, marginBottom: 4 }}>
        {EXAM_TITLE[level]}
      </h2>
      <div style={{ color: "var(--text-secondary)", fontSize: 12, marginBottom: 18 }}>
        اختيار من متعدد · لا يتم كشف الإجابات الصحيحة
      </div>
    </>
  );
}

function Notice({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: 18,
        padding: 24,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 44 }}>{icon}</div>
      <div style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: 18, margin: "8px 0" }}>{title}</div>
      <p style={{ color: "var(--text-secondary)", fontSize: 13.5, lineHeight: 2, maxWidth: 520, margin: "0 auto" }}>
        {children}
      </p>
    </div>
  );
}
