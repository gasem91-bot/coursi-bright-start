import { useEffect } from "react";
import { isNative } from "@/lib/native";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/contexts/ProfileContext";

/**
 * Registers the device for push notifications inside the native shell and
 * saves the resulting FCM (Android) / APNs (iOS) token to Supabase so the
 * backend can target this device later.
 *
 * On the web this renders nothing and does nothing — web push is out of
 * scope for now.
 *
 * Requires the `device_tokens` table (see
 * supabase/migrations — device_tokens table) to actually persist; until
 * that migration is applied, the upsert below fails silently and is logged
 * to the console only, the same way deep-link-handler degrades when a
 * Capacitor plugin is unavailable.
 */
export default function PushNotificationHandler() {
  const { userId } = useProfile();

  useEffect(() => {
    if (!isNative() || !userId) return;
    let removeRegistration: (() => void) | undefined;
    let removeRegistrationError: (() => void) | undefined;

    (async () => {
      try {
        const { PushNotifications } = await import("@capacitor/push-notifications");

        const permission = await PushNotifications.checkPermissions();
        let status = permission.receive;
        if (status === "prompt" || status === "prompt-with-rationale") {
          const requested = await PushNotifications.requestPermissions();
          status = requested.receive;
        }
        if (status !== "granted") return;

        const registrationHandle = await PushNotifications.addListener(
          "registration",
          async (token) => {
            const platform = isIOS() ? "ios" : "android";
            const { error } = await supabase
              .from("device_tokens")
              .upsert(
                { user_id: userId, platform, token: token.value, updated_at: new Date().toISOString() },
                { onConflict: "user_id,platform" },
              );
            if (error) {
              // Most likely cause: the device_tokens migration hasn't been
              // applied to this Supabase project yet.
              console.warn("[push] could not save device token:", error.message);
            }
          },
        );
        removeRegistration = () => registrationHandle.remove();

        const errorHandle = await PushNotifications.addListener("registrationError", (err) => {
          console.warn("[push] registration failed:", err.error);
        });
        removeRegistrationError = () => errorHandle.remove();

        await PushNotifications.register();
      } catch {
        /* plugin unavailable (e.g. running in a browser build) — nothing to do */
      }
    })();

    return () => {
      removeRegistration?.();
      removeRegistrationError?.();
    };
  }, [userId]);

  return null;
}

function isIOS(): boolean {
  const cap = (window as unknown as { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  return cap?.getPlatform?.() === "ios";
}
