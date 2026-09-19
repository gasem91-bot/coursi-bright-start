import { useEffect } from "react";
import { isNative } from "@/lib/native";

const PORTAL_HOST = "ai.portal.coursi.ai";

/**
 * Handles links opened from outside the app (magic-link / password-reset
 * emails, shared URLs). On the web this renders nothing and does nothing —
 * the browser already navigates. Inside the native shell we receive the URL
 * through Capacitor and move the webview to the matching path, preserving the
 * auth hash/query that Supabase puts on recovery and magic links.
 */
export default function DeepLinkHandler() {
  useEffect(() => {
    if (!isNative()) return;
    let remove: (() => void) | undefined;

    (async () => {
      try {
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("appUrlOpen", ({ url }) => {
          try {
            const parsed = new URL(url);
            if (parsed.host !== PORTAL_HOST) return;
            const target = parsed.pathname + parsed.search + parsed.hash;
            if (target && target !== window.location.pathname + window.location.search + window.location.hash) {
              window.location.href = parsed.toString();
            }
          } catch {
            /* ignore malformed URLs */
          }
        });
        remove = () => handle.remove();
      } catch {
        /* plugin unavailable — nothing to do */
      }
    })();

    return () => remove?.();
  }, []);

  return null;
}
