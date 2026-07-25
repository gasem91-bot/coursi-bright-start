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
    coverImage: "https://d8j0ntlcm91z4.cloudfront.net/user_3CToPP2SDwUfirzHh6Rbzt3Wuos/hf_20260630_163531_dbc4fae8-0bf8-44ff-a8ed-90a7764d9cd7.png",
    chapters: BEGINNER_CHAPTERS,
  },
  intermediate: {
    name: "الذكاء الاصطناعي للمحترفين",
    meta: "٦ فصول · ٦ أسابيع",
    coverImage: "https://d8j0ntlcm91z4.cloudfront.net/user_3CToPP2SDwUfirzHh6Rbzt3Wuos/hf_20260630_163538_f4d91532-2374-4247-8fb2-8c556cc367ea.png",
    chapters: INTERMEDIATE_CHAPTERS,
  },
  advanced: {
    name: "إتقان الذكاء الاصطناعي — بناء منتجات وأعمال",
    meta: "٦ فصول · ٦ أسابيع",
    coverImage: "https://d8j0ntlcm91z4.cloudfront.net/user_3CToPP2SDwUfirzHh6Rbzt3Wuos/hf_20260630_163544_aa9e5673-6027-4988-b6cd-53a161272b55.png",
    chapters: ADVANCED_CHAPTERS,
  },

} as const;
