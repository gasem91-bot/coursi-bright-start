import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getTaskUploadUrl, submitLevelTask } from "@/lib/level-task.functions";
import { TASK_BRIEF, type TaskKind } from "@/lib/level-task";
import type { ExamState, Level } from "@/lib/exam";

const font = "Cairo, 'Noto Sans Arabic', sans-serif";
const MAX_IMAGE = 10 * 1024 * 1024;
const MAX_VIDEO = 50 * 1024 * 1024;

const btn: React.CSSProperties = {
  background: "linear-gradient(135deg,#7B35FF,#00D4C8)",
  color: "#fff",
  fontSize: 14,
  fontWeight: 800,
  padding: "12px 26px",
  borderRadius: 40,
  border: "none",
  cursor: "pointer",
  fontFamily: font,
};

const input: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-primary)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "10px 12px",
  color: "var(--text-primary)",
  fontFamily: font,
  fontSize: 14,
};

export function TaskSubmission({
  level,
  task,
  onReviewed,
}: {
  level: Level;
  task: ExamState["task"];
  onReviewed: () => void;
}) {
  const getUpload = useServerFn(getTaskUploadUrl);
  const submit = useServerFn(submitLevelTask);
  const brief = TASK_BRIEF[level];
  const [kind, setKind] = useState<TaskKind>("image");
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<{ approved: boolean; feedback: string } | null>(
    task && task.status !== "pending" ? { approved: task.status === "approved", feedback: task.feedback ?? "" } : null,
  );

  const send = async () => {
    if (note.trim().length < 10) return toast.error("اكتب ملاحظة قصيرة عن مهمتك (١٠ أحرف على الأقل)");
    setBusy(true);
    try {
      let filePath: string | undefined;
      if (kind !== "link") {
        if (!file) throw new Error("اختر ملفاً أولاً");
        const isOk = kind === "image" ? file.type.startsWith("image/") : file.type.startsWith("video/");
        if (!isOk) throw new Error(kind === "image" ? "الملف يجب أن يكون صورة" : "الملف يجب أن يكون فيديو");
        if (file.size > (kind === "image" ? MAX_IMAGE : MAX_VIDEO))
          throw new Error(kind === "image" ? "الحد الأقصى للصورة ١٠ ميغابايت" : "الحد الأقصى للفيديو ٥٠ ميغابايت");
        const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "bin";
        const up = await getUpload({ data: { level, ext: ext.length >= 2 ? ext : "bin" } });
        if (!up.ok) throw new Error("تعذّر تجهيز الرفع");
        const { error } = await supabase.storage
          .from("task-submissions")
          .uploadToSignedUrl(up.path, up.token, file, { contentType: file.type });
        if (error) throw new Error("تعذّر رفع الملف");
        filePath = up.path;
      } else if (!/^https?:\/\//.test(link.trim())) {
        throw new Error("أدخل رابطاً صحيحاً يبدأ بـ https://");
      }

      const r = await submit({
        data: { level, kind, filePath, linkUrl: kind === "link" ? link.trim() : undefined, note: note.trim() },
      });
      if (!r.ok) {
        const msg: Record<string, string> = {
          not_eligible: "أكمل جميع وحدات المستوى أولاً",
          exam_first: "اجتز الاختبار النهائي أولاً",
          bad_input: "تحقّق من الملف أو الرابط",
          ai_unavailable: "المراجع الذكي غير متاح الآن، حاول بعد قليل",
          rate_limited: "طلبات كثيرة، حاول بعد دقيقة",
        };
        throw new Error(msg[r.reason] ?? "حدث خطأ");
      }
      setLast({ approved: r.approved, feedback: r.feedback });
      if (r.approved) {
        toast.success(r.levelCompleted ? "🏆 تم قبول مهمتك — أنهيت المستوى!" : "✓ تم قبول مهمتك");
        onReviewed();
      } else {
        toast.error("المهمة تحتاج تعديلاً — اقرأ الملاحظات وأعد الإرسال");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="coursi-content" style={{ marginTop: 18 }}>
      <div className="exercise-box">
        <h3 style={{ marginTop: 0 }}>🛠️ {brief.title}</h3>
        <p>{brief.brief}</p>
        <ul>
          {brief.checklist.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <p style={{ fontSize: 12, opacity: 0.8 }}>
          يراجع مساعد كورسي الذكي مهمتك فوراً ويعطيك قبول أو ملاحظات للتعديل
        </p>
      </div>

      {last && (
        <div
          className="info-box"
          style={{ borderColor: last.approved ? "#00D4C8" : "#C5545E", marginTop: 14 }}
        >
          <p style={{ margin: 0 }}>
            <strong style={{ color: last.approved ? "#00D4C8" : "#E58A94" }}>
              {last.approved ? "✓ تم قبول مهمتك" : "✕ المهمة تحتاج تعديلاً"}
            </strong>
            <br />
            {last.feedback}
          </p>
        </div>
      )}

      {!last?.approved && (
        <div
          style={{
            marginTop: 14,
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: 20,
            display: "grid",
            gap: 12,
            fontFamily: font,
          }}
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(
              [
                ["image", "🖼️ صورة"],
                ["video", "🎬 فيديو"],
                ["link", "🔗 رابط"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                style={{
                  ...btn,
                  padding: "8px 16px",
                  fontSize: 13,
                  background: kind === k ? btn.background : "transparent",
                  color: kind === k ? "#fff" : "var(--text-secondary)",
                  border: kind === k ? "none" : "1px solid var(--border)",
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {kind === "link" ? (
            <input
              dir="ltr"
              placeholder="https://"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              style={input}
            />
          ) : (
            <input
              type="file"
              accept={kind === "image" ? "image/*" : "video/*"}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              style={{ ...input, padding: 8 }}
            />
          )}
          <textarea
            rows={4}
            maxLength={1500}
            placeholder="اشرح باختصار ماذا عملت، والأدوات التي استخدمتها، والنتيجة"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{ ...input, resize: "vertical" }}
          />
          <button onClick={send} disabled={busy} style={{ ...btn, opacity: busy ? 0.6 : 1, justifySelf: "start" }}>
            {busy ? "جاري المراجعة..." : last ? "أعد إرسال المهمة ←" : "أرسل المهمة للمراجعة ←"}
          </button>
        </div>
      )}
    </div>
  );
}

export function LevelRating({ level, userId }: { level: Level; userId: string }) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  if (done) {
    return (
      <div className="coursi-content" style={{ marginTop: 18 }}>
        <div className="info-box">
          <p style={{ margin: 0 }}>شكراً لتقييمك 💜 رأيك يساعدنا نطوّر كورسي</p>
        </div>
      </div>
    );
  }

  const save = async () => {
    if (!stars) return toast.error("اختر عدد النجوم أولاً");
    setBusy(true);
    const { error } = await supabase.from("level_ratings").insert({
      user_id: userId,
      level,
      rating: stars,
      comment: comment.trim() ? comment.trim().slice(0, 500) : null,
    });
    setBusy(false);
    if (error && !error.message.includes("duplicate")) return toast.error("تعذّر حفظ التقييم");
    setDone(true);
  };

  return (
    <div className="coursi-content" style={{ marginTop: 18 }}>
      <div className="info-box" style={{ textAlign: "center" }}>
        <h3 style={{ marginTop: 0 }}>كيف كانت تجربتك في هذا المستوى؟</h3>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", direction: "rtl", margin: "8px 0 12px" }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n}`}
              onClick={() => setStars(n)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 32,
                color: n <= stars ? "#D4AF37" : "var(--border)",
              }}
            >
              ★
            </button>
          ))}
        </div>
        <textarea
          rows={3}
          maxLength={500}
          placeholder="تعليق قصير (اختياري)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          style={{ ...input, resize: "vertical" }}
        />
        <button onClick={save} disabled={busy} style={{ ...btn, marginTop: 12, opacity: busy ? 0.6 : 1 }}>
          {busy ? "جاري الحفظ..." : "أرسل التقييم"}
        </button>
      </div>
    </div>
  );
}
