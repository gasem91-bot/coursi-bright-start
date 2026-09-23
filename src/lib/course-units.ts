// Unit grouping for the AI course.
// Chapters keep their own content + quiz data; a "unit" is simply a group of
// consecutive chapters whose quizzes are merged into one quiz shown at the end.

import type { QuizQuestion } from "./course-content-types";

export const UNIT_SIZE = 3;

const AR_ORDINALS = [
  "الأولى",
  "الثانية",
  "الثالثة",
  "الرابعة",
  "الخامسة",
  "السادسة",
  "السابعة",
  "الثامنة",
];

export interface CourseUnit {
  index: number;
  title: string;
  /** chapter indices belonging to this unit */
  chapters: number[];
  firstChapter: number;
  lastChapter: number;
}

export function buildUnits(totalChapters: number): CourseUnit[] {
  const units: CourseUnit[] = [];
  for (let start = 0; start < totalChapters; start += UNIT_SIZE) {
    const chapters: number[] = [];
    for (let i = start; i < Math.min(start + UNIT_SIZE, totalChapters); i++) chapters.push(i);
    const index = units.length;
    units.push({
      index,
      title: `الوحدة ${AR_ORDINALS[index] ?? index + 1}`,
      chapters,
      firstChapter: chapters[0]!,
      lastChapter: chapters[chapters.length - 1]!,
    });
  }
  return units;
}

export function unitOf(units: CourseUnit[], chapterIndex: number): CourseUnit {
  return units.find((u) => u.chapters.includes(chapterIndex)) ?? units[0]!;
}

/** Merge the quizzes of every chapter in the unit, in chapter order. */
export function unitQuiz(
  unit: CourseUnit,
  chapters: readonly { quiz: readonly QuizQuestion[] }[],
): QuizQuestion[] {
  const out: QuizQuestion[] = [];
  for (const i of unit.chapters) {
    for (const q of chapters[i]?.quiz ?? []) out.push(q as QuizQuestion);
  }
  return out;
}
