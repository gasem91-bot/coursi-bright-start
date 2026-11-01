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
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  async function copy(row: WalletCode) {
    try { await navigator.clipboard.writeText(row.code); setCopied(row.id); setCopyError(false); }
    catch { setCopyError(true); }
  }
  return <div dir="rtl" className="mt-6 border-t border-border pt-5 text-foreground">
    <h3 className="flex items-center gap-2 text-lg font-bold"><Wallet aria-hidden="true" />محفظتي</h3>
    <p className="mt-3 text-sm text-muted-foreground">الرصيد المتاح</p>
    <p className="text-3xl font-bold" dir="ltr">{loading ? "…" : error ? "—" : `$${availableCredit(rows, CURRENT_VERTICAL, now).toFixed(2)} USD`}</p>
    <p className="mt-3 text-sm leading-7 text-muted-foreground">هذه أكواد خصم وليست نقوداً؛ يُستخدم كود واحد عند الدفع ولا يُجمع مع العروض الجارية.</p>
    {loading && <p role="status" className="mt-4 text-muted-foreground">جاري تحميل المحفظة...</p>}
    {error && <div role="alert" className="mt-4"><p>تعذّر تحميل المحفظة.</p><Button variant="outline" className="min-h-12 mt-2" onClick={retry}>حاول مرة أخرى</Button></div>}
    {!loading && !error && rows.length === 0 && <p className="mt-4 text-sm text-muted-foreground">لا توجد أكواد خصم في محفظتك بعد.</p>}
    {copyError && <p role="status" className="text-destructive mt-2">تعذّر النسخ، يمكنك تحديد الكود ونسخه.</p>}
    {rows.length > 0 && <ul aria-label="أكواد محفظتي" tabIndex={0} className="mt-4 max-h-[32rem] overflow-y-auto overscroll-contain space-y-3">
      {rows.map((r) => <li key={r.id} className="rounded-lg border border-border p-3">
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
    </ul>}
    {copied && <p role="status" className="mt-2 text-sm text-muted-foreground">تم نسخ الكود.</p>}
  </div>;
}