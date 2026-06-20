import { useEffect, useState } from "react";
import { useRouter, useNavigate } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import arabicLogo from "@/assets/arabic-logo.png.asset.json";

export default function MobileTopbar() {
  const router = useRouter();
  const navigate = useNavigate();
  const pathname = router.state.location.pathname;
  const [, setEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setEmail(session?.user?.email ?? "");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? "");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (pathname === "/login" || pathname === "/") return null;

  return (
    <header className="mobile-topbar" aria-label="الشريط العلوي">
      <div className="mt-left">
        <button type="button" className="mt-bell" aria-label="الإشعارات">
          <Bell size={20} strokeWidth={2} />
        </button>
        <button
          type="button"
          className="avatar-btn"
          aria-label="فتح الحساب"
          onClick={() => navigate({ to: "/profile" })}
        >
          <img src={arabicLogo.url} alt="" />
        </button>
      </div>
      <img src={arabicLogo.url} alt="COURSI" className="mt-logo-img" />
    </header>
  );
}
