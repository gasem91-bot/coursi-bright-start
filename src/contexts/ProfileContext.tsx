import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  level: "beginner" | "intermediate" | "advanced";
  nationality_code: string | null;
  nationality_name: string | null;
  nationality_flag: string | null;
  country_name?: string | null;
  country_flag?: string | null;
  streak_days: number;
  xp_points: number;
  theme?: string;
  created_at?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface ProfileContextType {
  profile: Profile | null;
  userId: string | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: unknown }>;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  userId: null,
  loading: true,
  refreshProfile: async () => {},
  updateProfile: async () => ({ error: null }),
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const previousProfile = useRef<Profile | null>(null);

  // Track current user id from Supabase auth
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) setUserId(session?.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (!error && data) setProfile(data as Profile);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    void fetchProfile();
  }, [fetchProfile]);

  // Realtime: auto-update when row changes from anywhere
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`profile-changes-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          setProfile((prev) =>
            prev ? ({ ...prev, ...(payload.new as Partial<Profile>) } as Profile) : (payload.new as Profile),
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      if (!userId) return { error: new Error("No user") };
      previousProfile.current = profile;
      // Optimistic update
      setProfile((prev) => (prev ? ({ ...prev, ...updates } as Profile) : prev));
      const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
      if (error) {
        // Rollback
        setProfile(previousProfile.current);
        await fetchProfile();
      }
      return { error };
    },
    [userId, profile, fetchProfile],
  );

  return (
    <ProfileContext.Provider value={{ profile, userId, loading, refreshProfile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);
