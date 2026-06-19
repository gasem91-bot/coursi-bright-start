import { useState, useRef, useEffect } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import logoAsset from "@/assets/coursi-logo.png.asset.json";

const menuItems = [
  { label: "لوحة التحكم", path: "/dashboard" },
  { label: "الكورس", path: "/course/ai" },
  { label: "العروض", path: "/offers" },
  { label: "إنجازاتي", path: "/achievements" },
  { label: "حسابي", path: "/profile" },
];

export default function DesktopNavbar() {
  const router = useRouter();
  const pathname = router.state.location.pathname;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (pathname === "/login") return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/login" });
  };

  return (
    <header className="desktop-navbar" ref={ref}>
      <div className="desktop-navbar-inner">
        <button
          className="desktop-logo-btn"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <img src={logoAsset.url} alt="كورسي" className="desktop-logo-img" />
        </button>

        {open && (
          <div className="desktop-dropdown" role="menu">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`desktop-dropdown-item ${pathname === item.path ? "active" : ""}`}
                onClick={() => setOpen(false)}
                role="menuitem"
              >
                {item.label}
              </Link>
            ))}
            <div className="desktop-dropdown-sep" />
            <button className="desktop-dropdown-logout" onClick={handleLogout} role="menuitem">
              تسجيل الخروج
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
