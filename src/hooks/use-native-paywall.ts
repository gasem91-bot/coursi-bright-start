import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { isNative } from "@/lib/native";
import { getMyAccess } from "@/lib/iap.functions";

/**
 * In the native apps, accounts can be created in-app before buying. Anyone
 * without an active plan is sent to the in-app plans screen. Does nothing on
 * the web, where every account already comes from a completed purchase.
 */
export function useNativePaywall(enabled = true) {
  const navigate = useNavigate();
  const loadAccess = useServerFn(getMyAccess);
  useEffect(() => {
    if (!enabled || !isNative()) return;
    let cancelled = false;
    void loadAccess()
      .then((a) => {
        if (!cancelled && !a.hasAccess) navigate({ to: "/subscribe" });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [enabled, loadAccess, navigate]);
}
