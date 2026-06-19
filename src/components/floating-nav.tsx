import { Link, useRouter } from "@tanstack/react-router";

const tabs = [
  { id: "home", icon: "🏠", label: "الرئيسية", path: "/dashboard" },
  { id: "course", icon: "📚", label: "كورسي", path: "/course/ai" },
  { id: "offers", icon: "🎁", label: "العروض", path: "/offers" },
  { id: "achievements", icon: "🏅", label: "إنجازاتي", path: "/achievements" },
  { id: "profile", icon: "👤", label: "حسابي", path: "/profile" },
];

export default function FloatingNav() {
  const router = useRouter();
  const pathname = router.state.location.pathname;

  if (pathname === "/login") return null;

  return (
    <nav className="floating-nav" aria-label="التنقل السفلي">
      {tabs.map((tab) => {
        const isActive = pathname === tab.path;
        return (
          <Link
            key={tab.id}
            to={tab.path}
            className={`fn-tab ${isActive ? "active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="fn-tab-icon" aria-hidden="true">{tab.icon}</span>
            <span className="fn-tab-label">{tab.label}</span>
            {isActive && <span className="fn-tab-dot" aria-hidden="true" />}
          </Link>
        );
      })}
    </nav>
  );
}
