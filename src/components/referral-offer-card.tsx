import { Gift, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Destination of the Offers referral card: the account page invite box and «قائمة أصدقائي». */
export const REFERRAL_OFFER_HREF = "/profile#referrals";

export const REFERRAL_OFFER_TITLE = "ادعُ صديقاً واربحا معاً";

export const REFERRAL_OFFER_TEXT =
  "أرسل دعوة بالبريد لصديقك. يحصل صديقك على خصم 5$ عند الدفع، وتحصل أنت على خصم 5$ عندما يُكمل صديقك أول عملية شراء. كل خصم صالح 90 يوماً من تاريخ إصداره ولا يُجمع مع العروض الجارية.";

/**
 * Email-only referral invitation card for the Offers page.
 * Shown to every signed-in user; the invite box and friends list live on the account page.
 */
export function ReferralOfferCard() {
  return (
    <article data-offer="referral" className="rounded-lg border border-[var(--accent-green-border)] bg-[var(--accent-green-soft)] p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Gift className="size-6 text-[var(--accent-green-text)]" aria-hidden="true" />
        <h2 className="text-lg font-bold text-[var(--text-primary)]">{REFERRAL_OFFER_TITLE}</h2>
      </div>
      <p className="py-3 text-sm leading-7 text-[var(--text-secondary)]">{REFERRAL_OFFER_TEXT}</p>
      <Button asChild variant="outline" className="h-auto min-h-12 w-full whitespace-normal border-[var(--accent-green-border)] bg-[var(--bg-card)] px-5 py-3 font-bold text-[var(--accent-green-text)] hover:bg-[var(--accent-green-soft)] hover:text-[var(--accent-green-text)] sm:w-auto">
        <a href={REFERRAL_OFFER_HREF}>
          <span>ادعُ صديقك</span>
          <ArrowLeft aria-hidden="true" />
        </a>
      </Button>
    </article>
  );
}
