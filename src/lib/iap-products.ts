// In-App Purchase catalog for the native iOS / Android apps.
// Product ids are identical on the App Store and Google Play and are created
// as NON-CONSUMABLE ("managed") one-time products, mirroring the web's
// one-time Stripe prices. Fulfilment lives in iap-fulfillment.server.ts.
export type IapLevel = "beginner" | "intermediate" | "advanced";
export type IapKind = "course" | "course_ai" | "topup" | "level_unlock";

export type IapProduct = {
  id: string;
  kind: IapKind;
  level?: IapLevel;
  /** Web price in USD, shown only if the store price cannot be loaded. */
  usd: number;
};

export const IAP_PRODUCTS: IapProduct[] = [
  { id: "coursi_ai_beginner_course", kind: "course", level: "beginner", usd: 35 },
  { id: "coursi_ai_beginner_tutor", kind: "course_ai", level: "beginner", usd: 49 },
  { id: "coursi_ai_intermediate_course", kind: "course", level: "intermediate", usd: 35 },
  { id: "coursi_ai_intermediate_tutor", kind: "course_ai", level: "intermediate", usd: 49 },
  { id: "coursi_ai_advanced_course", kind: "course", level: "advanced", usd: 35 },
  { id: "coursi_ai_advanced_tutor", kind: "course_ai", level: "advanced", usd: 49 },
  { id: "coursi_tutor_topup", kind: "topup", usd: 14 },
  { id: "coursi_level_unlock", kind: "level_unlock", usd: 10 },
];

export const IAP_PRODUCT_BY_ID: Record<string, IapProduct> = Object.fromEntries(
  IAP_PRODUCTS.map((p) => [p.id, p]),
);

export const LEVEL_LABEL_AR: Record<IapLevel, string> = {
  beginner: "المبتدئ",
  intermediate: "المتوسط",
  advanced: "المتقدم",
};

export function courseProductId(level: IapLevel, withTutor: boolean): string {
  return `coursi_ai_${level}_${withTutor ? "tutor" : "course"}`;
}
