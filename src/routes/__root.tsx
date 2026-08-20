import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useRouter,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { ThemeProvider } from "@/lib/theme";
import FloatingNav from "@/components/floating-nav";
import MobileTopbar from "@/components/mobile-topbar";
import AccountPanel from "@/components/account-panel";
import { Toaster, toast } from "@/components/ui/sonner";
import { useStreak } from "@/hooks/use-streak";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProfileProvider } from "@/contexts/ProfileContext";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "COURSI AI COURSE" },
      { property: "og:title", content: "COURSI AI COURSE" },
      { name: "twitter:title", content: "COURSI AI COURSE" },
      { name: "description", content: "AI TOOL" },
      { property: "og:description", content: "AI TOOL" },
      { name: "twitter:description", content: "AI TOOL" },
      { name: "twitter:card", content: "summary" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Noto+Sans+Arabic:wght@400;500;600;700;900&family=Noto+Color+Emoji&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://cdn.jsdelivr.net/npm/country-flag-emoji-polyfill@0.1/dist/TwemojiCountryFlags.css",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ProfileProvider>
          <StreakRunner />
          <ToastDismissOnNavigate />
          <MobileTopbar />
          <Outlet />
          <FloatingNav />
          <AccountPanel />
          <Toaster />
        </ProfileProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function ToastDismissOnNavigate() {
  const router = useRouter();
  useEffect(() => {
    return router.subscribe("onResolved", () => {
      toast.dismiss();
    });
  }, [router]);
  return null;
}

function StreakRunner() {
  const [uid, setUid] = useState<string | undefined>();
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUid(session?.user?.id));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUid(session?.user?.id));
    return () => sub.subscription.unsubscribe();
  }, []);
  useStreak(uid);
  return null;
}
