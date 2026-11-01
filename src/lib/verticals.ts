// Pending portal brands deliberately reuse the current AI assets and accent.
export const CURRENT_VERTICAL = "ai" as const;
export type VerticalId = "ai" | "trading" | "fitness";
const aiBrand = {
  accentToken: "var(--accent-purple-text)",
  emailAccent: "#C4A6EE",
  logo: "https://ai.portal.coursi.ai/__l5e/assets-v1/4e70392d-96cd-4490-86e4-4e562039be12/coursi-logo.png?v=arabic-wordmark-20261003",
};
export const VERTICALS = {
  ai: { id: "ai", courseName: "الذكاء الاصطناعي", shortLabel: "الذكاء الاصطناعي", ...aiBrand, placeholder: false },
  trading: { id: "trading", courseName: "التداول", shortLabel: "التداول", ...aiBrand, placeholder: true },
  fitness: { id: "fitness", courseName: "اللياقة البدنية", shortLabel: "اللياقة", ...aiBrand, placeholder: true },
} as const;
export function getVertical(id: string = CURRENT_VERTICAL) {
  return VERTICALS[id === "trading" || id === "fitness" ? id : "ai"];
}