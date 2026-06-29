import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Updates the user's learning streak each day they visit the portal.
 * - Same day visit → no change.
 * - Yesterday → streak += 1.
 * - Older / never → streak resets to 1.
 */
export function useStreak(userId: string | undefined | null) {
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

      const { data: profile } = await supabase
        .from("profiles")
        .select("streak_days, last_active_date")
        .eq("id", userId)
        .maybeSingle();

      if (cancelled || !profile) return;

      const last = (profile as { last_active_date: string | null }).last_active_date;
      if (last === today) return;

      const current = (profile as { streak_days: number | null }).streak_days ?? 0;
      const next = last === yesterday ? current + 1 : 1;

      await supabase
        .from("profiles")
        .update({ streak_days: next, last_active_date: today })
        .eq("id", userId);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);
}
