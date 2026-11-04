import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getMyFriends } from "@/lib/referral.functions";
import { friendsCountLabel, type FriendRow, type FriendStatus } from "@/lib/referral-friends";
import { getVertical } from "@/lib/verticals";

const font = "Cairo, 'Noto Sans Arabic', sans-serif";
const CHIP: Record<FriendStatus, { text: string; color: string; bg: string }> = {
  pending: { text: "بانتظار التسجيل", color: "var(--text-secondary)", bg: "rgba(255,255,255,0.06)" },
  joined: { text: "انضم", color: "#40C8C8", bg: "rgba(64,200,200,0.12)" },
  purchased: { text: "أكمل الشراء", color: "#C4A6EE", bg: "rgba(123,53,192,0.18)" },
};

export function FriendsList() {
  const load = useServerFn(getMyFriends);
  const [rows, setRows] = useState<FriendRow[] | null>(null);
  useEffect(() => { load().then(setRows).catch(() => setRows([])); }, []);
  useEffect(() => {
    if (rows && window.location.hash === "#referrals") document.getElementById("referrals")?.scrollIntoView({ behavior: "smooth" });
  }, [rows]);

  return (
    <section id="referrals" dir="rtl" style={{ scrollMarginTop: 80, background: "var(--card-glass)", border: "1px solid var(--card-glass-border)", borderRadius: 16, padding: 20, marginBottom: 24, fontFamily: font }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <img src={getVertical().logo} alt="كورسي" style={{ height: 24, width: "auto" }} />
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>قائمة أصدقائي</h2>
      </div>
      {rows === null ? (
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>جاري التحميل...</p>
      ) : (
        <>
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: rows.length ? 12 : 4 }}>{friendsCountLabel(rows.length)}</p>
          {rows.length === 0 ? (
            <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-secondary)" }}>ادعُ صديقك الأول من الأسفل وتعلّما معاً في كورسي.</p>
          ) : (
            <ul aria-label="قائمة أصدقائي" style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {rows.map((r) => (
                <li key={r.key} style={{ padding: 12, borderRadius: 12, border: "1px solid var(--card-glass-border)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 14, overflowWrap: "anywhere" }}>{r.name}</div>
                    <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 2 }}>{r.course}</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 999, color: CHIP[r.status].color, background: CHIP[r.status].bg }}>{CHIP[r.status].text}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
