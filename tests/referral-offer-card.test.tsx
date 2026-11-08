import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  ReferralOfferCard,
  REFERRAL_OFFER_HREF,
  REFERRAL_OFFER_TITLE,
  REFERRAL_OFFER_TEXT,
} from "../src/components/referral-offer-card";

// Runs in its own process (see package.json "test" script): the webhook suite
// mocks @tanstack/react-router process-wide, which this render does not want.
test("referral card opens the account page at the friends/invite section", () => {
  const html = renderToStaticMarkup(ReferralOfferCard());
  expect(REFERRAL_OFFER_HREF).toBe("/profile#referrals");
  expect(html).toContain('href="/profile#referrals"');
  expect(html).toContain("ادعُ صديقك");
});

test("referral card carries the approved Arabic copy", () => {
  const html = renderToStaticMarkup(ReferralOfferCard());
  expect(REFERRAL_OFFER_TITLE).toBe("ادعُ صديقاً واربحا معاً");
  expect(REFERRAL_OFFER_TEXT).toContain("أرسل دعوة بالبريد لصديقك");
  expect(REFERRAL_OFFER_TEXT).toContain("كل خصم صالح 90 يوماً من تاريخ إصداره ولا يُجمع مع العروض الجارية");
  expect(html).toContain(REFERRAL_OFFER_TITLE);
  expect(html).toContain(REFERRAL_OFFER_TEXT);
});

test("referral card offers no code sharing or WhatsApp UI", () => {
  const html = renderToStaticMarkup(ReferralOfferCard());
  expect(html).not.toContain("واتساب");
  expect(html).not.toContain("WhatsApp");
  expect(html).not.toContain("نسخ");
  expect(html).not.toContain("clipboard");
});
