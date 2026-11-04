import { Copy, Check, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { availableCredit, walletStatus, type WalletCode } from "@/lib/referral-wallet";
import { CURRENT_VERTICAL } from "@/lib/verticals";

const LABEL = { active: "نشط", used: "مستخدم", expired: "منتهي", cancelled: "ملغى" };
const day = (date: string) => new Date(date).toLocaleDateString("ar-AE");

export function ReferralWallet({ rows, loading, error, retry }: { rows: WalletCode[]; loading: boolean; error: boolean; retry: () => void }) {
  const [now, setNow] = useState(Date.now());
  const [copied, setCopied] = useState<string | null>(null);
  const [copyError, setCopyError] = useState(false);
  const active = rows.filter((r) => walletStatus(r, now) === "active");
  const history = rows.filter((r) => walletStatus(r, now) !== "active");
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  async function copy(row: WalletCode) {
    try { await navigator.clipboard.writeText(row.code); setCopied(row.id); setCopyError(false); }
    catch { setCopyError(true); }
  }
  return <div id="wallet" dir="rtl" className="referral-wallet scroll-mt-20 mt-6 border-t border-border pt-5 text-foreground">
    <style>{`
      .referral-wallet { margin-top:24px; padding-top:20px; color:var(--text-primary); }
      .referral-wallet > p { margin-top:12px; }
      .referral-wallet ul { margin-top:16px; padding:0; list-style:none; }
      .referral-wallet ul > li { padding:14px; margin-bottom:12px; border:1px solid var(--card-glass-border); border-radius:8px; background:var(--bg-secondary); }
      .referral-wallet li > p, .referral-wallet li > div + div { margin-top:10px; }
      .referral-wallet button { min-width:48px; min-height:48px; padding:12px; border-color:var(--card-glass-border); }
      .referral-wallet p[dir="ltr"] { text-align:right; }
      .referral-wallet .text-muted-foreground { color:var(--text-secondary); }
    `}</style>
    <h3 className="flex items-center gap-2 text-lg font-bold"><Wallet aria-hidden="true" />محفظتي</h3>
    <p className="mt-3 text-sm text-muted-foreground">الرصيد المتاح</p>
    <p className="text-3xl font-bold" dir="ltr">{loading ? "…" : error ? "—" : `$${availableCredit(rows, CURRENT_VERTICAL, now).toFixed(2)} USD`}</p>
    <p className="mt-3 text-sm leading-7 text-muted-foreground">هذه أكواد خصم وليست نقوداً؛ يُستخدم كود واحد عند الدفع ولا يُجمع مع العروض الجارية.</p>
    {loading && <p role="status" className="mt-4 text-muted-foreground">جاري تحميل المحفظة...</p>}
    {error && <div role="alert" className="mt-4"><p>تعذّر تحميل المحفظة.</p><Button variant="outline" className="min-h-12 mt-2" onClick={retry}>حاول مرة أخرى</Button></div>}
    {!loading && !error && rows.length === 0 && <p className="mt-4 text-sm text-muted-foreground">لا توجد أكواد خصم في محفظتك بعد.</p>}
    {copyError && <p role="status" className="text-destructive mt-2">تعذّر النسخ، يمكنك تحديد الكود ونسخه.</p>}
    {[{ items: active, label: "أكواد محفظتي", collapsed: false }, { items: history, label: "سجل المحفظة", collapsed: true }].map(({ items, label, collapsed }) => {
      const list = items.length > 0 ? <ul aria-label={label} tabIndex={0} className="mt-4 max-h-[32rem] overflow-y-auto overscroll-contain space-y-3">
      {items.map((r) => <li key={r.id} className="rounded-lg border border-border p-3">
        <div className="flex items-center justify-between gap-2">
          <b dir="ltr" className="min-w-0 break-all text-sm select-all">{r.code}</b>
          <Button type="button" variant="outline" size="icon" className="min-h-12 min-w-12 shrink-0" aria-label={`نسخ الكود ${r.code}`} title="نسخ الكود" onClick={() => void copy(r)}>
            {copied === r.id ? <Check /> : <Copy />}
          </Button>
        </div>
        <p className="mt-2 text-sm break-words">{r.kind === "friend" ? `خصم ترحيب بدعوة من ${r.person}` : `مكافأة بسبب شراء ${r.person}`}</p>
        <div className="mt-2 flex flex-wrap justify-between gap-2 text-sm"><b dir="ltr">${(r.amount_cents / 100).toFixed(2)} USD</b><span>{LABEL[walletStatus(r, now)]}</span></div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span>تاريخ الإصدار: {day(r.issued_at)}</span><span>تاريخ الانتهاء: {day(r.expires_at)}</span></div>
      </li>)}
    </ul> : null;
      return collapsed ? (list && <details key={label} className="mt-4"><summary className="min-h-12 cursor-pointer py-3 font-bold">{label} ({items.length})</summary>{list}</details>) : <div key={label}>{list}</div>;
    })}
    {copied && <p role="status" className="mt-2 text-sm text-muted-foreground">تم نسخ الكود.</p>}
  </div>;
}