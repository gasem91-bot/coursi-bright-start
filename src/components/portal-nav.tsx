import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/lib/theme";
import arabicLogo from "@/assets/arabic-logo.png.asset.json";

const font = "Cairo, 'Noto Sans Arabic', sans-serif";

const links = [
  { to: "/dashboard", icon: "🏠", label: "الرئيسية" },
  { to: "/course/ai", icon: "📚", label: "كورسي" },
  { to: "/offers", icon: "🎁", label: "العروض" },
  { to: "/achievements", icon: "🏅", label: "إنجازاتي" },
  { to: "/profile", icon: "👤", label: "حسابي" },
  { to: "/support", icon: "🎧", label: "الدعم" },
] as const;

/** Compact horizontal quick-nav (desktop only; mobile uses the floating nav). */
export function PortalNav({ iconsOnly = false }: { iconsOnly?: boolean }) {
  const router = useRouter();
  const pathname = router.state.location.pathname;

  return (
    <nav className="portal-nav" aria-label="التنقل السريع" style={{ fontFamily: font }}>
      {links.map((l) => {
        const active = pathname === l.to;
        return (
          <Link
            key={l.to}
            to={l.to}
            className={`portal-nav-link${active ? " active" : ""}`}
            aria-current={active ? "page" : undefined}
            title={l.label}
          >
            <span aria-hidden="true">{l.icon}</span>
            {!iconsOnly && <span className="portal-nav-label">{l.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

/** Full page header: logo + quick nav + theme toggle + logout. */
export default function PortalHeader() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "color-mix(in srgb, var(--bg-primary) 75%, transparent)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        flexWrap: "wrap",
        fontFamily: font,
      }}
    >
      <Link to="/dashboard" style={{ display: "flex", alignItems: "center", flexShrink: 0 }} aria-label="الرئيسية">
        <img src={arabicLogo.url} alt="COURSI" style={{ height: 48, width: "auto", display: "block" }} />
      </Link>
      <PortalNav />
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <ThemeToggle style={{ width: 32, height: 32, fontSize: 14 }} />
        <button
          onClick={handleLogout}
          style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 12, padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontFamily: font }}
        >
          خروج
        </button>
      </div>
    </header>
  );
}
