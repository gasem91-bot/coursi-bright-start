// Shared (client + server safe) support-ticket constants.

export const TICKET_CATEGORIES = [
  { value: "billing", label: "الاشتراك والدفع" },
  { value: "course_access", label: "الوصول للكورس" },
  { value: "technical", label: "مشكلة تقنية" },
  { value: "other", label: "أخرى" },
] as const;

export type TicketCategory = (typeof TICKET_CATEGORIES)[number]["value"];

export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  TICKET_CATEGORIES.map((c) => [c.value, c.label]),
);

export const TICKET_STATUS_LABEL: Record<string, string> = {
  open: "مفتوحة",
  in_progress: "قيد المعالجة",
  resolved: "تم الحل",
};

export const TICKET_STATUS_COLOR: Record<string, string> = {
  open: "#40C8C8",
  in_progress: "#D4AF37",
  resolved: "#3DD6A0",
};

/** Human-friendly ticket reference derived from the row id. */
export function ticketRef(id: string) {
  return `TKT-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}
