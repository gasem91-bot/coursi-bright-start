import { useRouter } from "@tanstack/react-router";

export default function DesktopNavbar() {
  const router = useRouter();
  const pathname = router.state.location.pathname;

  if (pathname === "/login") return null;

  return (
    <header className="desktop-navbar" />
  );
}
