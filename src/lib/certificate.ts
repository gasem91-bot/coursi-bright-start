// Certificate helpers — completion detection + deterministic certificate IDs.
import { COURSE_CONTENT } from "./course-content";

export type Level = "beginner" | "intermediate" | "advanced";

export const LEVEL_LABEL: Record<Level, string> = {
  beginner: "المستوى المبتدئ",
  intermediate: "المستوى المتوسط",
  advanced: "المستوى المتقدم",
};

export const LEVEL_ACCENT: Record<Level, string> = {
  beginner: "#00D4C8",
  intermediate: "#7B35FF",
  advanced: "#D4AF37",
};

/** Per-level certificate wording — each level gets its own statement. */
export const LEVEL_STATEMENT: Record<Level, string> = {
  beginner:
    "لإتمامه جميع فصول المستوى المبتدئ واجتيازه الاختبار النهائي، وإتقانه أساسيات الذكاء الاصطناعي وأدواته وكتابة الطلب",
  intermediate:
    "لإتمامه جميع فصول المستوى المتوسط واجتيازه الاختبار النهائي، وإتقانه هندسة الطلب المتقدمة وخريطة الأدوات وبناء سير العمل الآلي",
  advanced:
    "لإتمامه جميع فصول المستوى المتقدم واجتيازه الاختبار النهائي، وإتقانه بناء أنظمة ووكلاء ومنتجات حقيقية بالذكاء الاصطناعي",
};

export const LEVEL_TAGLINE: Record<Level, string> = {
  beginner: "أساسيات الذكاء الاصطناعي",
  intermediate: "الأدوات والأتمتة الاحترافية",
  advanced: "بناء المنتجات والوكلاء",
};


const pad2 = (n: number) => String(n).padStart(2, "0");
export const chapterId = (level: Level, idx: number) => `ai-${level}-${pad2(idx + 1)}`;

export function totalChapters(level: Level) {
  return COURSE_CONTENT[level].chapters.length;
}

export function courseName(level: Level) {
  return COURSE_CONTENT[level].name;
}

/** Number of completed chapters for a level, from course_progress rows. */
export function completedCount(level: Level, completedIds: Set<string>) {
  let n = 0;
  for (let i = 0; i < totalChapters(level); i++) if (completedIds.has(chapterId(level, i))) n++;
  return n;
}

export function isLevelComplete(level: Level, completedIds: Set<string>) {
  return completedCount(level, completedIds) >= totalChapters(level);
}

/** Stable, verifiable-looking certificate id derived from user id + level. */
export function certificateId(userId: string, level: Level) {
  const seed = `${userId}:${level}`;
  let h1 = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h1 ^= seed.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193) >>> 0;
  }
  const code = h1.toString(36).toUpperCase().padStart(7, "0").slice(0, 7);
  const lvl = level === "beginner" ? "B" : level === "intermediate" ? "I" : "A";
  return `COURSI-AI-${lvl}-${code}`;
}

export function arabicDate(d: Date) {
  const months = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
