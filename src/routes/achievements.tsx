import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/achievements")({
  component: AchievementsPage,
});

const font = "Cairo, 'Noto Sans Arabic', sans-serif";

function AchievementsPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: font,
        padding: 24,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>🏅</div>
        <h1 style={{ color: "var(--text-primary)", fontSize: 24, fontWeight: 800, marginBottom: 10 }}>
          إنجازاتي
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
          قريباً — تتبّع إنجازاتك وشاراتك
        </p>
      </div>
    </div>
  );
}
