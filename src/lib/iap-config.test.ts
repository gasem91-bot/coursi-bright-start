import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { IAP_PRODUCTS } from "./iap-products";

describe("native RevenueCat configuration", () => {
  it("supplies the Android public key through the same environment setup as iOS", () => {
    const env = readFileSync(new URL("../../.env.local", import.meta.url), "utf8");
    const android = env.match(/^VITE_REVENUECAT_ANDROID_KEY="([^"]+)"$/m)?.[1];
    expect(android).toBe("goog_vmUvbYOqQaQMrjDDYjZvLfmDIqD");
    const source = readFileSync(new URL("./iap.ts", import.meta.url), "utf8");
    expect(source).toContain("import.meta.env.VITE_REVENUECAT_ANDROID_KEY");
    expect(source).toContain('apiKey: p === "ios" ? IOS_KEY : ANDROID_KEY');
  });

  it("keeps the eight shared iOS and Android product identifiers", () => {
    expect(IAP_PRODUCTS.map(({ id }) => id).sort()).toEqual([
      "coursi_level_unlock",
      "coursi_tutor_topup",
      "coursi_ai_beginner_course",
      "coursi_ai_intermediate_course",
      "coursi_ai_advanced_course",
      "coursi_ai_beginner_tutor",
      "coursi_ai_intermediate_tutor",
      "coursi_ai_advanced_tutor",
    ].sort());
  });
});