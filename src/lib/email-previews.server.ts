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
  const { buildResetHtml, RESET_SUBJECT } = await import("./reset-email.server");
  const { buildMagicLinkHtml, MAGICLINK_SUBJECT } = await import("./magiclink-email.server");
  const { buildLevelUpgradeHtml, LEVEL_UPGRADE_SUBJECT } = await import("./level-upgrade-email.server");
  const { buildAiUpgradeHtml, AI_UPGRADE_SUBJECT } = await import("./ai-upgrade-email.server");

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
      key: "reset",
      label: "إعادة تعيين كلمة المرور",
      to: "student@example.com",
      from: "كورسي <info@coursi.ai>",
      subject: RESET_SUBJECT,
      html: buildResetHtml({
        link: "https://ai.portal.coursi.ai/reset-password#access_token=sample",
        email: "student@example.com",
      }),
    },
    {
      key: "magiclink",
      label: "رابط الدخول السريع",
      to: "student@example.com",
      from: "كورسي <info@coursi.ai>",
      subject: MAGICLINK_SUBJECT,
      html: buildMagicLinkHtml({
        link: "https://ai.portal.coursi.ai/dashboard#access_token=sample",
        email: "student@example.com",
      }),
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
    {
      key: "level-upgrade",
      label: "فتح مستوى جديد (دفعة الترقية)",
      to: "student@example.com",
      from: "كورسي <support@coursi.ai>",
      subject: LEVEL_UPGRADE_SUBJECT,
      html: buildLevelUpgradeHtml("advanced", "course_ai"),
    },
    {
      key: "ai-upgrade",
      label: "تفعيل مساعد الذكاء الاصطناعي",
      to: "student@example.com",
      from: "كورسي <support@coursi.ai>",
      subject: AI_UPGRADE_SUBJECT,
      html: buildAiUpgradeHtml(),
    },
  ];
}
