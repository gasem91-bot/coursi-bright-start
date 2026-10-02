import certificateBeginner from "@/assets/certificates/certificate-beginner.png.asset.json";
import certificateIntermediate from "@/assets/certificates/certificate-intermediate.png.asset.json";
import certificateAdvanced from "@/assets/certificates/certificate-advanced.png.asset.json";
import badgeBeginner from "@/assets/certificates/badge-beginner.png.asset.json";
import badgeIntermediate from "@/assets/certificates/badge-intermediate.png.asset.json";
import badgeAdvanced from "@/assets/certificates/badge-advanced.png.asset.json";
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