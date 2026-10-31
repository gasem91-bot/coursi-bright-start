// Server-only: builds sample renders of every branded transactional email.
// Shared by the admin page server fn and the token-gated debug route.

export interface EmailPreview {
  key: string;
  templateKey: string;
  level?: "beginner" | "intermediate" | "advanced";
  tier?: "course" | "course_ai";
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
  const { buildUpgradeNudgeHtml, UPGRADE_NUDGE_SUBJECT } = await import("./upgrade-nudge-email.server");
  const { buildReferralInviteHtml, REFERRAL_INVITE_SUBJECT } = await import("./referral-invite-email.server");
  const { buildFriendInviteHtml, buildFriendDiscountHtml, buildReferrerRewardHtml, referralInviteSubject, FRIEND_DISCOUNT_SUBJECT, REFERRER_REWARD_SUBJECT } = await import("./referral-emails.server");

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

  const samples = [
    {
      key: "referral-friend-invite", label: "دعوة صديق — خصم 5$", to: "student@example.com", from: "كورسي <support@coursi.ai>",
      subject: referralInviteSubject("قاسم"), html: buildFriendInviteHtml({ referrerName: "قاسم", friendCode: "FR-EXAMPLE", purchaseLink: "https://coursi.ai/ai?ref=ABCDEFGH" }),
    },
    {
      key: "referral-friend-discount", label: "خصم الدعوة للصديق", to: "student@example.com", from: "كورسي <support@coursi.ai>",
      subject: FRIEND_DISCOUNT_SUBJECT, html: buildFriendDiscountHtml({ firstName: "أحمد", referrerName: "قاسم", friendCode: "FR-EXAMPLE", expiryDate: "٢٩ يناير ٢٠٢٧", purchaseLink: "https://coursi.ai/ai" }),
    },
    {
      key: "referral-referrer-reward", label: "مكافأة صاحب الدعوة", to: "student@example.com", from: "كورسي <support@coursi.ai>",
      subject: REFERRER_REWARD_SUBJECT, html: buildReferrerRewardHtml({ firstName: "قاسم", friendFirstName: "أحمد", rewardCode: "RW-EXAMPLE", expiryDate: "٢٩ يناير ٢٠٢٧", purchaseLink: "https://coursi.ai/ai" }),
    },
    {
      key: "welcome",
      label: "بريد الترحيب / تأكيد الدفع",
      to: "student@example.com",
      from: "كورسي <support@coursi.ai>",
      subject: WELCOME_SUBJECT,
      html: buildWelcomeHtml("intermediate", "course_ai", "https://ai.portal.coursi.ai/login", "student@example.com"),
    },
    {
      key: "ticket-user",
      label: "تأكيد تذكرة الدعم (للمستخدم)",
      to: "student@example.com",
      from: "دعم كورسي <support@coursi.ai>",
      subject: `تم استلام طلبك — رقم التذكرة ${ticket.ticketRef}`,
      html: buildTicketUserHtml(ticket),
    },
    {
      key: "ticket-support",
      label: "إشعار تذكرة جديدة (لفريق الدعم)",
      to: "support@coursi.ai",
      from: "دعم كورسي <support@coursi.ai>",
      subject: `🆕 تذكرة دعم جديدة ${ticket.ticketRef} — ${ticket.categoryLabel}`,
      html: buildTicketSupportHtml(ticket),
    },
    {
      key: "reset",
      label: "إعادة تعيين كلمة المرور",
      to: "student@example.com",
      from: "كورسي <support@coursi.ai>",
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
      from: "كورسي <support@coursi.ai>",
      subject: MAGICLINK_SUBJECT,
      html: buildMagicLinkHtml({
        link: "https://ai.portal.coursi.ai/dashboard#access_token=sample",
        email: "student@example.com",
      }),
    },
    ...(["beginner", "intermediate", "advanced"] as const).map((lv) => ({
      key: lv === "advanced" ? "certificate" : `certificate-${lv}`,
      label: `شهادة الإتمام — ${LEVEL_LABEL[lv]}`,
      to: "student@example.com",
      from: "كورسي <support@coursi.ai>",
      subject: `مبروك! 🏆 شهادة إتمام ${LEVEL_LABEL[lv]} جاهزة`,
      html: buildCertificateHtml({
        userName: "قاسم الرجال",
        courseName: courseName(lv),
        levelLabel: LEVEL_LABEL[lv],
        certId: certificateId("00000000-0000-4000-8000-000000000000", lv),
        dateText,
        link: "https://ai.portal.coursi.ai/achievements",
        level: lv,
      }),
    })),
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
    {
      key: "upgrade-nudge",
      label: "تنبيه قرب إنهاء المستوى (تسويقي، غير مفعّل بعد)",
      to: "student@example.com",
      from: "كورسي <support@coursi.ai>",
      subject: UPGRADE_NUDGE_SUBJECT,
      html: buildUpgradeNudgeHtml({ userName: "قاسم", currentLevel: "beginner", remainingChapters: 2 }),
    },
    {
      key: "referral-invite",
      label: "دعوة برنامج الإحالة (تسويقي، غير مفعّل بعد)",
      to: "student@example.com",
      from: "كورسي <support@coursi.ai>",
      subject: REFERRAL_INVITE_SUBJECT,
      html: buildReferralInviteHtml({ userName: "قاسم", referralLink: "https://ai.portal.coursi.ai/?ref=SAMPLE123" }),
    },
  ];
  const levels = ["beginner", "intermediate", "advanced"] as const;
  return samples.filter((sample) => !sample.key.startsWith("certificate-")).flatMap((sample): EmailPreview[] => {
    const base = { ...sample, templateKey: sample.key };
    if (!["welcome", "level-upgrade", "certificate", "ai-upgrade", "upgrade-nudge"].includes(sample.key)) return [base];
    const sampleLevels = sample.key === "upgrade-nudge" ? levels.slice(0, 2) : levels;
    return sampleLevels.flatMap((level) => {
      const tiers = sample.key === "welcome" || sample.key === "level-upgrade"
        ? ["course", "course_ai"] as const : [undefined];
      return tiers.map((tier): EmailPreview => {
        let html = sample.html;
        if (sample.key === "welcome") html = buildWelcomeHtml(level, tier ?? "course", "https://ai.portal.coursi.ai/login", "student@example.com");
        if (sample.key === "level-upgrade") html = buildLevelUpgradeHtml(level, tier ?? "course");
        if (sample.key === "ai-upgrade") html = buildAiUpgradeHtml(undefined, level);
        if (sample.key === "upgrade-nudge") html = buildUpgradeNudgeHtml({ userName: "قاسم", currentLevel: level, remainingChapters: 2 });
        if (sample.key === "certificate") html = buildCertificateHtml({
          userName: "قاسم الرجال", courseName: courseName(level), levelLabel: LEVEL_LABEL[level],
          certId: certificateId("00000000-0000-4000-8000-000000000000", level), dateText,
          link: "https://ai.portal.coursi.ai/achievements", level,
        });
        return { ...base, key: `${sample.key}:${level}${tier ? `:${tier}` : ""}`, level, tier, html,
          label: sample.key === "certificate" ? "شهادة الإتمام" : sample.label,
          subject: sample.key === "certificate" ? `مبروك! 🏆 شهادة إتمام ${LEVEL_LABEL[level]} جاهزة` : sample.subject };
      });
    });
  });
}
