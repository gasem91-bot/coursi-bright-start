import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getMyReferrals, getMyReferralWallet, inviteReferralFriend, type MyReferral } from "@/lib/referral.functions";
import { ReferralWallet } from "./referral-wallet";
import type { WalletCode } from "@/lib/referral-wallet";
import { activeRewardCount } from "@/lib/referral-display";
import { Button } from "@/components/ui/button";

const font = "Cairo, 'Noto Sans Arabic', sans-serif";
const STATUS_AR: Record<string, string> = { invited: "تم إرسال الدعوة", signed_up: "انضم", purchased: "اشترى", rewarded: "تم منح الخصم", voided: "ملغاة" };
const ERR_AR: Record<string, string> = {
  invalid: "يرجى إدخال بريد إلكتروني صحيح.",
  self: "لا يمكنك دعوة بريدك الإلكتروني.",
  has_account: "هذا البريد لديه حساب في كورسي بالفعل.",
  already_invited: "تمت دعوة هذا البريد من قبل.",
  error: "تعذّر إرسال الدعوة الآن، حاول مرة أخرى لاحقاً.",
};
const day = (d: string | null) => (d ? new Date(d).toLocaleDateString("ar-AE") : "");

export function ReferralSection() {
  const invite = useServerFn(inviteReferralFriend);
  const load = useServerFn(getMyReferrals);
  const loadWallet = useServerFn(getMyReferralWallet);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [rows, setRows] = useState<MyReferral[]>([]);
  const [wallet, setWallet] = useState<WalletCode[]>([]);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState(false);

  const refresh = async () => {
    setWalletLoading(true);
    const [, result] = await Promise.allSettled([load().then(setRows), loadWallet()]);
    if (result.status === "fulfilled") { setWallet(result.value); setWalletError(false); }
    else setWalletError(true);
    setWalletLoading(false);
  };
  useEffect(() => { void refresh(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || value.length > 254) { setMsg({ ok: false, text: ERR_AR.invalid }); return; }
    setBusy(true); setMsg(null);
    try {
      const res = await invite({ data: { email: value } });
      if (res.ok) { setMsg({ ok: true, text: "تم إرسال الدعوة بنجاح ✓" }); setEmail(""); void refresh(); }
      else setMsg({ ok: false, text: ERR_AR[res.reason] ?? ERR_AR.error });
    } catch { setMsg({ ok: false, text: ERR_AR.error }); }
    setBusy(false);
  };

  const joined = rows.filter((r) => r.status !== "invited" && r.status !== "voided").length;
  const rewards = activeRewardCount(wallet);

  return (
    <section dir="rtl" style={{ background: "var(--card-glass)", border: "1px solid var(--card-glass-border)", borderRadius: 16, padding: 20, marginBottom: 24, fontFamily: font }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: "var(--text-primary)" }}>ادعُ صديقاً واربحا معاً</h2>
      <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-secondary)", marginBottom: 14 }}>
        أرسل دعوة بالبريد لصديقك. يحصل صديقك على خصم 5$ عند الدفع، وتحصل أنت على خصم 5$ عندما يُكمل صديقك أول عملية شراء. كل خصم صالح 90 يوماً من تاريخ إصداره ولا يُجمع مع العروض الجارية.
      </p>
      <form noValidate onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input type="email" dir="ltr" inputMode="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="بريد صديقك الإلكتروني" aria-label="بريد صديقك الإلكتروني" maxLength={254}
          style={{ minHeight: 48, borderRadius: 12, border: "1px solid var(--card-glass-border)", background: "var(--bg-primary)", color: "var(--text-primary)", padding: "0 14px", fontFamily: font, fontSize: 15, textAlign: "right", width: "100%", boxSizing: "border-box" }} />
        <Button type="submit" disabled={busy} className="min-h-12">
          {busy ? "جاري الإرسال..." : "أرسل الدعوة"}
        </Button>
        {msg && <p role="status" style={{ fontSize: 13, color: msg.ok ? "#40C8C8" : "#F87171" }}>{msg.text}</p>}
      </form>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 18 }}>
        {([["دعوات مرسلة", rows.length], ["أصدقاء انضموا", joined], ["خصومات حصلت عليها", rewards]] as const).map(([label, n]) => (
          <div key={label} style={{ textAlign: "center", padding: "10px 4px", borderRadius: 12, background: "rgba(123,53,192,0.08)" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{n}</div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{label}</div>
          </div>
        ))}
      </div>

      {rows.length > 0 && (
        <ul aria-label="دعواتي" tabIndex={0} style={{ listStyle: "none", padding: 0, margin: "16px 0 0", display: "flex", flexDirection: "column", gap: 8, maxHeight: 400, overflowY: "auto" }}>
          {rows.map((r) => (
            <li key={r.id} style={{ padding: 12, borderRadius: 12, border: "1px solid var(--card-glass-border)", fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <span style={{ color: "var(--text-primary)", fontWeight: 700, overflowWrap: "anywhere" }}>{r.friend}</span>
                <span style={{ color: "#40C8C8" }}>{STATUS_AR[r.status] ?? r.status}</span>
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 4 }}>{day(r.date)}</div>
            </li>
          ))}
        </ul>
      )}
      <ReferralWallet rows={wallet} loading={walletLoading} error={walletError} retry={() => void refresh()} />
    </section>
  );
}
