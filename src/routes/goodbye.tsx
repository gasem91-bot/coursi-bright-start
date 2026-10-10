import { createFileRoute } from "@tanstack/react-router";
import arabicLogo from "@/assets/arabic-logo.png.asset.json";

export const Route = createFileRoute("/goodbye")({
  component: Goodbye,
  head: () => ({
    meta: [
      { title: "تم حذف حسابك — كورسي" },
      { name: "description", content: "تم حذف حسابك من كورسي." },
      { property: "og:title", content: "تم حذف حسابك — كورسي" },
      { property: "og:description", content: "تم حذف حسابك من كورسي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const font = "Cairo, 'Noto Sans Arabic', sans-serif";

function Goodbye() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", fontFamily: font, direction: "rtl", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, boxSizing: "border-box" }}>
      <div style={{ maxWidth: 440, width: "100%", textAlign: "center", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: 28, boxSizing: "border-box" }}>
        <img src={arabicLogo.url} alt="كورسي" style={{ height: 56, margin: "0 auto 16px", display: "block" }} />
        <h1 style={{ color: "var(--text-primary)", fontSize: 24, fontWeight: 800, marginBottom: 12 }}>تم حذف حسابك</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.9, marginBottom: 24 }}>نتمنى لك التوفيق، وبابنا مفتوح إن أردت العودة</p>
        <a href="https://coursi.ai" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 48, borderRadius: 50, background: "linear-gradient(135deg, #7B35C0, #40C8C8)", color: "#fff", fontWeight: 700, textDecoration: "none" }}>العودة إلى كورسي</a>
      </div>
    </div>
  );
}
