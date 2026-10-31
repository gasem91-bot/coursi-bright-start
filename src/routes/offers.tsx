import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { LockKeyhole, Sparkles, ArrowLeft, LoaderCircle, TrendingUp, BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BadgeMedallion } from "@/components/badge-medallion";
import { createAiUpgradeCheckout, getUpgradeStatus, type UpgradeStatus } from "@/lib/upgrade.functions";
import { BUNDLE_OFFERS, BUNDLE_LIMITED_TIME_OFFER, getBundleOfferState, getBundleCheckoutUrl } from "@/lib/bundle-offers";
import { TRADING_OFFERS, TRADING_PRICES } from "@/lib/trading-offers";
import { useIsNative } from "@/lib/native";
import { IapBuyButton } from "@/components/iap-buy-button";

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
  const native = useIsNative();
  const navigate = useNavigate();
  const loadStatus = useServerFn(getUpgradeStatus);
  const startCheckout = useServerFn(createAiUpgradeCheckout);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState<Level>("beginner");
  const [status, setStatus] = useState<UpgradeStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [bundleOffer, setBundleOffer] = useState(() => getBundleOfferState());

  useEffect(() => {
    const refresh = () => setBundleOffer(getBundleOfferState());
    refresh();
    // Refresh open tabs at expiry (chunks avoid the browser timer limit).
    const timer = window.setInterval(refresh, 30_000);
    let cutoffTimer: number | undefined;
    const scheduleCutoff = () => {
      const remaining = Date.parse(BUNDLE_LIMITED_TIME_OFFER.endsAt) - Date.now();
      if (remaining <= 0) { refresh(); return; }
      cutoffTimer = window.setTimeout(scheduleCutoff, Math.min(remaining, 2_147_483_647));
    };
    scheduleCutoff();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      if (cutoffTimer !== undefined) window.clearTimeout(cutoffTimer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

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
    <main data-page="offers" className="page-content min-h-screen bg-[var(--bg-primary)] px-4 pt-6 pb-28" dir="rtl">
      {/* Mobile-only spacing fix: the unlayered `* { margin: 0 }` global reset cancels
          Tailwind's zero-specificity space-y utilities, so card padding and the gap
          between the two stacked cards are set here, scoped to this page. */}
      <style>{`
        main[data-page="offers"] [data-offer="bundle"] { padding: 24px; }
        main[data-page="offers"] [data-offer="trading"] { padding: 24px; }
        @media (max-width: 768px) {
          main[data-page="offers"] [data-offer="bundle"] { padding: 16px; }
          main[data-page="offers"] [data-offer="trading"] { padding: 16px; }
          main[data-page="offers"] [data-offer="ai-tutor"] { padding: 16px; }
          main[data-page="offers"] [data-offer="ai-tutor"] + [data-offer="next-level"] { margin-top: 0; }
        }
      `}</style>
      <div className="mx-auto max-w-[720px]">
        <h1 className="mb-6 text-[28px] font-extrabold text-[var(--text-primary)]">العروض</h1>
        {loading ? <p className="py-12 text-center text-[var(--text-secondary)]">جاري التحميل...</p> : (
          <div className="flex flex-col gap-5">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">كورس الذكاء الاصطناعي</h2>
            {status && (
              <article data-offer="ai-tutor" className="rounded-lg border border-[var(--accent-cyan-border)] bg-[var(--accent-cyan-soft)] p-6">
                <Sparkles className="mb-4 size-7 text-[var(--accent-cyan-text)]" aria-hidden="true" />
                <h2 className="text-xl font-bold text-[var(--text-primary)]">احصل على المعلم الذكي مقابل <bdi>{TUTOR_PRICE}</bdi> فقط</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">إجابات فورية بالعربية · يتذكر مستواك · متاح ٢٤/٧</p>
                {status.tier === "course_ai" ? (
                  <p className="mt-5 inline-flex items-center gap-2 rounded border border-[var(--accent-green-border)] bg-[var(--accent-green-soft)] px-3 py-2 text-sm font-bold text-[var(--accent-green-text)]">
                    <BadgeCheck className="size-4" aria-hidden="true" /> تملكه ✓
                  </p>
                ) : (<>
                {native ? (
                  <IapBuyButton
                    productId="coursi_tutor_topup"
                    label="أضف المعلم الذكي"
                    disabled={!status.eligible}
                    onSuccess={async () => setStatus(await loadStatus())}
                    style={{ marginTop: 20 }}
                  />
                ) : (
                <Button variant="outline" onClick={onUpgrade} disabled={busy || !status.eligible}
                  className="mt-5 h-auto min-h-11 w-full whitespace-normal border-[var(--accent-cyan-border)] bg-[var(--bg-card)] px-5 py-3 font-bold text-[var(--accent-cyan-text)] hover:bg-[var(--accent-cyan-soft)] hover:text-[var(--accent-cyan-text)] sm:w-auto">
                  {busy ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
                  {busy ? "جاري التحويل..." : `أضف المعلم الذكي — ${TUTOR_PRICE}`}
                  {!busy && <ArrowLeft aria-hidden="true" />}
                </Button>
                )}
                </>)}
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
            {!native && (<>
            <h2 className="pt-4 text-xl font-bold text-[var(--text-primary)]">كورس التداول</h2>
            <p className="-mt-3 text-sm leading-7 text-[var(--text-secondary)]">تصلك بيانات الدخول لبوابة التداول على بريدك بعد الدفع</p>
            {TRADING_OFFERS.map((offer) => (
              <article key={offer.level} data-offer="trading" className="rounded-lg border border-[var(--accent-purple-border)] bg-[var(--bg-secondary)] px-4 py-4 sm:px-6 sm:py-6">
                <div className="flex flex-wrap items-center gap-3">
                  <TrendingUp className="size-6 text-[var(--accent-purple-text)]" aria-hidden="true" />
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">{offer.name}</h3>
                </div>
                <p className="py-3 text-sm leading-7 text-[var(--text-secondary)]">دفعة واحدة</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button asChild variant="outline" className="h-auto min-h-12 whitespace-normal border-[var(--accent-cyan-border)] bg-[var(--bg-card)] px-3 py-3 text-[var(--accent-cyan-text)] hover:bg-[var(--accent-cyan-soft)] hover:text-[var(--accent-cyan-text)]">
                    <a href={offer.courseUrl}>
                      <span>الكورس فقط</span>
                      <bdi className="font-bold">${TRADING_PRICES.course}</bdi>
                      <ArrowLeft aria-hidden="true" />
                    </a>
                  </Button>
                  <div className="flex flex-col gap-1">
                    <Button asChild variant="outline" className="h-auto min-h-12 whitespace-normal border-[var(--accent-purple-border)] bg-[var(--bg-card)] px-3 py-3 text-[var(--accent-purple-text)] hover:bg-[var(--accent-purple-soft)] hover:text-[var(--accent-purple-text)]">
                      <a href={offer.botsUrl}>
                        <span>الكورس + بوت المعلم + بوت الإشارات</span>
                        <bdi className="font-bold">${TRADING_PRICES.bots}</bdi>
                        <ArrowLeft aria-hidden="true" />
                      </a>
                    </Button>
                    <p className="text-center text-xs text-[var(--text-secondary)]">إشارات تداول مدى الحياة</p>
                  </div>
                </div>
              </article>
            ))}
            </>)}
            {!native && (<>
             <h2 className="pt-4 text-xl font-bold text-[var(--text-primary)]">باقات الذكاء الاصطناعي + التداول</h2>
            {BUNDLE_OFFERS.map((bundle) => (
              <article key={bundle.level} data-offer="bundle" className="rounded-lg border border-[var(--accent-purple-border)] bg-[var(--bg-secondary)] px-4 py-4 sm:px-6 sm:py-6">
                <div className="flex flex-wrap items-center gap-3">
                  <BadgeMedallion level={bundle.level} size={56} />
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">باقة المستوى {bundle.label}</h3>
                  {bundleOffer.limitedTime && <span className="rounded border border-[var(--accent-purple-border)] bg-[var(--accent-purple-soft)] px-2 py-1 text-xs font-semibold text-[var(--accent-purple-text)]">عرض لفترة محدودة</span>}
                </div>
                <p className="py-3 text-sm leading-7 text-[var(--text-secondary)]">كورس الذكاء الاصطناعي + كورس التداول</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    {/* Invisible spacer matching the tutor card title so both buttons line up. */}
                    <p aria-hidden="true" className="invisible text-sm font-bold leading-6">الذكاء الاصطناعي + التداول — الكورس + بوتات التعلّم والإشارات</p>
                    <Button asChild variant="outline" className="h-auto min-h-12 whitespace-normal border-[var(--accent-cyan-border)] bg-[var(--bg-card)] px-3 py-3 text-[var(--accent-cyan-text)] hover:bg-[var(--accent-cyan-soft)] hover:text-[var(--accent-cyan-text)]">
                      <a href={getBundleCheckoutUrl(bundle.coursesUrl, "courses")} onClick={(event) => { event.currentTarget.href = getBundleCheckoutUrl(bundle.coursesUrl, "courses"); }}>
                        <span>الكورسات فقط</span>
                        <del className="text-[var(--text-secondary)]"><bdi>${bundleOffer.prices.courses.original}</bdi></del>
                        <bdi className="font-bold">${bundleOffer.prices.courses.price}</bdi>
                        <ArrowLeft aria-hidden="true" />
                      </a>
                    </Button>
                  </div>

                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-bold leading-6 text-[var(--text-primary)]">الذكاء الاصطناعي + التداول — الكورس + بوتات التعلّم والإشارات</p>
                    <Button asChild variant="outline" className="h-auto min-h-12 whitespace-normal border-[var(--accent-purple-border)] bg-[var(--bg-card)] px-3 py-3 text-[var(--accent-purple-text)] hover:bg-[var(--accent-purple-soft)] hover:text-[var(--accent-purple-text)]">
                      <a href={getBundleCheckoutUrl(bundle.tutorsUrl, "tutors")} onClick={(event) => { event.currentTarget.href = getBundleCheckoutUrl(bundle.tutorsUrl, "tutors"); }}>
                        <span>شراء مع بوتات التعلّم والإشارات —</span>
                        <del className="text-[var(--text-secondary)]"><bdi>${bundleOffer.prices.tutors.original}</bdi></del>
                        <bdi className="font-bold">${bundleOffer.prices.tutors.price}</bdi>
                        <ArrowLeft aria-hidden="true" />
                      </a>
                    </Button>
                  </div>

                </div>
              </article>
            ))}
            </>)}
            {/* Future drop offers can be added here. */}
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
