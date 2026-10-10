import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { LockKeyhole, Sparkles, ArrowLeft, LoaderCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BadgeMedallion } from "@/components/badge-medallion";
import { createAiUpgradeCheckout, getUpgradeStatus, type UpgradeStatus } from "@/lib/upgrade.functions";

export const Route = createFileRoute("/offers")({
  component: OffersPage,
  head: () => ({ meta: [
    { title: "العروض — كورسي" },
    { name: "description", content: "مساعد كورسي الذكي والمستوى التالي من كورسك." },
    { property: "og:title", content: "العروض — كورسي" },
    { property: "og:description", content: "مساعد كورسي الذكي والمستوى التالي من كورسك." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
});

type Level = "beginner" | "intermediate" | "advanced";
// Existing tutor checkout price verified in Stripe: USD 14, one-time. No price changes.
const TUTOR_PRICE = "$14";
const NEXT_LEVEL: Record<Level, "intermediate" | "advanced" | null> = {
  beginner: "intermediate", intermediate: "advanced", advanced: null,
};
const LEVEL_NAMES = { intermediate: "المتوسط", advanced: "المتقدم" };

function OffersPage() {
  const navigate = useNavigate();
  const loadStatus = useServerFn(getUpgradeStatus);
  const startCheckout = useServerFn(createAiUpgradeCheckout);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState<Level>("beginner");
  const [status, setStatus] = useState<UpgradeStatus | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate({ to: "/login" }); return; }
      try {
        const [upgradeStatus, { data: profile, error }] = await Promise.all([
          loadStatus(),
          supabase.from("profiles").select("level").eq("id", session.user.id).maybeSingle(),
        ]);
        if (error) throw error;
        if (cancelled) return;
        setStatus(upgradeStatus);
        setLevel(profile?.level ?? "beginner");
      } catch {
        if (!cancelled) toast.error("تعذّر تحميل حالة اشتراكك");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [navigate, loadStatus]);

  const onUpgrade = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await startCheckout();
      if ("url" in result) { window.location.href = result.url; return; }
      toast.error(result.error === "already_active" ? "المساعد مفعّل في حسابك بالفعل"
        : result.error === "not_eligible" ? "هذه الترقية متاحة لمشتركي الكورس فقط"
        : "تعذّر فتح صفحة الدفع، حاول مرة أخرى");
      if (result.error === "already_active") setStatus(await loadStatus());
    } catch {
      toast.error("تعذّر فتح صفحة الدفع، حاول مرة أخرى");
    }
    setBusy(false);
  };

  const nextLevel = NEXT_LEVEL[level];
  return (
    <main className="page-content min-h-screen bg-[var(--bg-primary)] px-4 pt-6 pb-28" dir="rtl">
      <div className="mx-auto max-w-[720px]">
        <h1 className="mb-6 text-[28px] font-extrabold text-[var(--text-primary)]">العروض</h1>
        {loading ? <p className="py-12 text-center text-[var(--text-secondary)]">جاري التحميل...</p> : (
          <div className="space-y-4">
            {status && status.tier !== "course_ai" && (
              <article data-offer="ai-tutor" className="rounded-lg border border-[var(--accent-cyan-border)] bg-[var(--accent-cyan-soft)] p-6">
                <Sparkles className="mb-4 size-7 text-[var(--accent-cyan-text)]" aria-hidden="true" />
                <h2 className="text-xl font-bold text-[var(--text-primary)]">احصل على المعلم الذكي مقابل <bdi>{TUTOR_PRICE}</bdi> فقط</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">إجابات فورية بالعربية · يتذكر مستواك · متاح ٢٤/٧</p>
                <Button variant="outline" onClick={onUpgrade} disabled={busy || !status.eligible}
                  className="mt-5 h-auto min-h-11 w-full whitespace-normal border-[var(--accent-cyan-border)] bg-[var(--bg-card)] px-5 py-3 font-bold text-[var(--accent-cyan-text)] hover:bg-[var(--accent-cyan-soft)] hover:text-[var(--accent-cyan-text)] sm:w-auto">
                  {busy ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
                  {busy ? "جاري التحويل..." : `أضف المعلم الذكي — ${TUTOR_PRICE}`}
                  {!busy && <ArrowLeft aria-hidden="true" />}
                </Button>
              </article>
            )}
            <article data-offer="next-level" aria-disabled="true" className="relative isolate min-h-64 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
              <div aria-hidden="true" className="pointer-events-none select-none px-6 py-8 text-center opacity-50 blur-[5px]">
                <BadgeMedallion level={nextLevel ?? "advanced"} size={100} className="mx-auto" />
                <div className="mt-4 text-xl font-bold text-[var(--text-primary)]">{nextLevel ? `كورس المستوى ${LEVEL_NAMES[nextLevel]}` : "المستوى التالي"}</div>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--card-glass)] px-5 py-6 text-center backdrop-blur-sm">
                <LockKeyhole className="size-8 text-[var(--accent-purple-text)]" aria-hidden="true" />
                <h2 className="text-lg font-bold text-[var(--text-primary)]">{nextLevel ? `كورس المستوى ${LEVEL_NAMES[nextLevel]}` : "المستوى التالي"}</h2>
                <p className="text-sm leading-7 text-[var(--text-secondary)]">{nextLevel ? "يُفتح عندما تصل إلى نهاية كورسك الحالي" : "أنت في أعلى المستويات"}</p>
              </div>
            </article>
            {/* Future bundle/drop offers can be added here; none are currently displayed. */}
          </div>
        )}
      </div>
    </main>
  );
}

// Referral UI retained for a future relaunch, intentionally not mounted for any user.
function ReferralOffer({ referralCode }: { referralCode: string }) {
  const copyReferral = async () => {
    try { await navigator.clipboard.writeText(referralCode); toast.success("تم النسخ ✓"); }
    catch { toast.error("تعذّر النسخ"); }
  };
  return (
    <div className="rounded-lg border border-[var(--accent-green-border)] bg-[var(--accent-green-soft)] p-6">
      <h3 className="text-lg font-bold text-[var(--text-primary)]">ادعُ صديقاً واربحا معاً</h3>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">شارك رمز الدعوة الخاص بك</p>
      <div className="my-4 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 text-center text-xl font-extrabold text-[var(--accent-cyan-text)]">{referralCode}</div>
      <Button variant="outline" onClick={copyReferral}>نسخ الرمز</Button>
    </div>
  );
}
