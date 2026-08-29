// Shared, client-safe exam constants/types.
// The correct answers NEVER live here — they stay server-side in exam-bank.server.ts
// so a failed attempt can't reveal the answer key.

export type Level = "beginner" | "intermediate" | "advanced";

export const EXAM_QUESTION_COUNT = 15;
export const EXAM_PASS_PCT = 70;
export const EXAM_PASS_SCORE = Math.ceil((EXAM_PASS_PCT / 100) * EXAM_QUESTION_COUNT); // 11 / 15
export const EXAM_COOLDOWN_HOURS = 24;

export const EXAM_TITLE: Record<Level, string> = {
  beginner: "الاختبار النهائي — المستوى المبتدئ",
  intermediate: "الاختبار النهائي — المستوى المتوسط",
  advanced: "الاختبار النهائي — المستوى المتقدم",
};

export const EXAM_INTRO: Record<Level, string> = {
  beginner:
    "خمسة عشر سؤالاً تغطي كل ما تعلّمته في المستوى المبتدئ: مفهوم الذكاء الاصطناعي، الأدوات، كتابة الطلب، الصور والصوت والفيديو، والاستخدام المسؤول.",
  intermediate:
    "خمسة عشر سؤالاً تغطي المستوى المتوسط: النماذج اللغوية بعمق، هندسة الطلب المتقدمة، خريطة الأدوات، الأتمتة وسير العمل، المحتوى والتسويق والتحليل.",
  advanced:
    "خمسة عشر سؤالاً تغطي المستوى المتقدم: المعمارية، الواجهات البرمجية، RAG، الوكلاء، البناء بالبرمجة، التسعير والنمو، والأمان.",
};

export interface PublicExamQuestion {
  id: string;
  question: string;
  options: string[];
}

export interface ExamAttemptSummary {
  score: number;
  total: number;
  passed: boolean;
  createdAt: string;
}

export interface ExamState {
  level: Level;
  eligible: boolean; // all chapters of the level completed
  questions: PublicExamQuestion[];
  passScore: number;
  lastAttempt: ExamAttemptSummary | null;
  bestScore: number | null;
  attempts: number;
  passed: boolean;
  certificate: { certificateId: string; issuedAt: string; score: number; total: number } | null;
  lockedUntil: string | null; // ISO — 24h cooldown after a failed attempt
}

export interface ExamSubmitResult {
  ok: boolean;
  reason?: "not_eligible" | "cooldown" | "already_passed" | "bad_input";
  lockedUntil?: string;
  score?: number;
  total?: number;
  passed?: boolean;
  /** Per-question right/wrong only — never the correct option. */
  results?: { id: string; correct: boolean }[];
  certificateId?: string;
}
