// COURSI AI Course — full content
// All three levels sourced from dedicated files.

import { BEGINNER_CHAPTERS } from "./course-beginner";
import { INTERMEDIATE_CHAPTERS } from "./course-intermediate";
import { ADVANCED_CHAPTERS } from "./course-advanced";
export type { QuizQuestion } from "./course-content-types";

export const COURSE_CONTENT = {
  beginner: {
    name: "أساسيات الذكاء الاصطناعي — من الصفر",
    meta: "١٢ فصلاً · ٨ أسابيع",
    chapters: BEGINNER_CHAPTERS,
  },
  intermediate: {
    name: "الذكاء الاصطناعي للمحترفين",
    meta: "١٢ فصلاً · ٨ أسابيع",
    chapters: INTERMEDIATE_CHAPTERS,
  },
  advanced: {
    name: "إتقان الذكاء الاصطناعي — بناء منتجات وأعمال",
    meta: "١٢ فصلاً · ١٠ أسابيع",
    chapters: ADVANCED_CHAPTERS,
  },
} as const;
