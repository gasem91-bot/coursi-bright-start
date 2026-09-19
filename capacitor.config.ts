import type { CapacitorConfig } from "@capacitor/cli";

/**
 * COURSI native shell (Capacitor).
 *
 * This portal is a server-rendered TanStack Start app: pages, auth and every
 * server function are produced at request time, so there is no static bundle to
 * ship inside the app. The native shell therefore loads the live portal
 * (https://ai.portal.coursi.ai) inside the webview. `webDir` only holds a tiny
 * offline fallback page used if the device has no connection at launch.
 */
const config: CapacitorConfig = {
  appId: "ai.coursi.app",
  appName: "COURSI",
  webDir: "mobile-webdir",
  server: {
    url: "https://ai.portal.coursi.ai",
    hostname: "ai.portal.coursi.ai",
    androidScheme: "https",
    iosScheme: "https",
    cleartext: false,
  },
  ios: {
    contentInset: "always",
    limitsNavigationsToAppBoundDomains: false,
  },
  android: {
    allowMixedContent: false,
  },
  backgroundColor: "#0B0B10",
};

export default config;
