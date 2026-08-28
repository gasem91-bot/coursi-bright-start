// Server-only: builds sample renders of every branded transactional email.
// Shared by the admin page server fn and the token-gated debug route.

export interface EmailPreview {
  key: string;
  label: string;
  to: string;
  from: string;
  subject: string;
  html: string;
}

export async function buildEmailPreviews(): Promise<EmailPreview[]> {
  const { buildWelcomeHtml, WELCOME_SUBJECT } = await import("./welcome-email.server");
  const { buildTicketUserHtml, buildTicketSupportHtml } = await import("./support-email.server");
  const { buildCertificateHtml } = await import("./certificate-email.server");
  const { arabicDate, LEVEL_LABEL, courseName, certificateId } = await import("./certificate");
  const { CATEGORY_LABEL } = await import("./support");

  const dateText = arabicDate(new Date());
  const ticket = {
    ticketRef: "TKT-1413815E",
    categoryLabel: CATEGORY_LABEL.technical ?? "مشكلة تقنية",
    message:
      "لا أستطيع فتح الفصل الخامس من المستوى المتوسط، تظهر لي رسالة خطأ عند الضغط على الاختبار.",
    name: "قاسم الرجال",
    email: "student@example.com",
    dateText,
  };

  return [
    {
      key: "welcome",
      label: "بريد الترحيب / تأكيد الدفع",
      to: "student@example.com",
      from: "كورسي <info@coursi.ai>",
      subject: WELCOME_SUBJECT,
      html: buildWelcomeHtml("intermediate", "course_ai", "https://ai.portal.coursi.ai/login", "student@example.com"),
    },
    {
      key: "ticket-user",
      label: "تأكيد تذكرة الدعم (للمستخدم)",
      to: "student@example.com",
      from: "دعم كورسي <info@coursi.ai>",
      subject: `تم استلام طلبك — رقم التذكرة ${ticket.ticketRef}`,
      html: buildTicketUserHtml(ticket),
    },
    {
      key: "ticket-support",
      label: "إشعار تذكرة جديدة (لفريق الدعم)",
      to: "support@coursi.ai",
      from: "دعم كورسي <info@coursi.ai>",
      subject: `🆕 تذكرة دعم جديدة ${ticket.ticketRef} — ${ticket.categoryLabel}`,
      html: buildTicketSupportHtml(ticket),
    },
    {
      key: "certificate",
      label: "شهادة الإتمام",
      to: "student@example.com",
      from: "كورسي <info@coursi.ai>",
      subject: `مبروك! 🏆 شهادة إتمام ${LEVEL_LABEL.advanced} جاهزة`,
      html: buildCertificateHtml({
        userName: "قاسم الرجال",
        courseName: courseName("advanced"),
        levelLabel: LEVEL_LABEL.advanced,
        certId: certificateId("00000000-0000-4000-8000-000000000000", "advanced"),
        dateText,
        link: "https://ai.portal.coursi.ai/achievements",
      }),
    },
  ];
}
