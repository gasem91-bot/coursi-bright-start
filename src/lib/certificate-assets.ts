import certificateBeginner from "@/assets/certificates/certificate-beginner.png.asset.json";
import certificateIntermediate from "@/assets/certificates/certificate-intermediate.png.asset.json";
import certificateAdvanced from "@/assets/certificates/certificate-advanced.png.asset.json";
import badgeBeginner from "@/assets/certificates/badge-beginner-glossy-3d.png.asset.json";
import badgeIntermediate from "@/assets/certificates/badge-intermediate-glossy-3d.png.asset.json";
import badgeAdvanced from "@/assets/certificates/badge-advanced-glossy-3d.png.asset.json";
import type { Level } from "./certificate";

export const CERTIFICATE_TEMPLATE: Record<Level, string> = {
  beginner: certificateBeginner.url,
  intermediate: certificateIntermediate.url,
  advanced: certificateAdvanced.url,
};

export const BADGE_IMAGE: Record<Level, string> = {
  beginner: badgeBeginner.url,
  intermediate: badgeIntermediate.url,
  advanced: badgeAdvanced.url,
};
// Small (192px) hosted copies of the same badge artwork, for emails (Gmail/Outlook need absolute https URLs).
import emailBadgeBeginner from "@/assets/certificates/email-badge-beginner.png.asset.json";
import emailBadgeIntermediate from "@/assets/certificates/email-badge-intermediate.png.asset.json";
import emailBadgeAdvanced from "@/assets/certificates/email-badge-advanced.png.asset.json";

const PORTAL_ORIGIN = "https://ai.portal.coursi.ai";

export const EMAIL_BADGE_URL: Record<Level, string> = {
  beginner: PORTAL_ORIGIN + emailBadgeBeginner.url,
  intermediate: PORTAL_ORIGIN + emailBadgeIntermediate.url,
  advanced: PORTAL_ORIGIN + emailBadgeAdvanced.url,
};
