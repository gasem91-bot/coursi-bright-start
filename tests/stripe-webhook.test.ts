import { afterAll, beforeEach, expect, mock, test } from "bun:test";
import { fulfillCheckout, isAiCheckout, PRICE_MAP, LEVEL_UPGRADE_PRICE_ID, AI_TOPUP_PRICE_ID, AI_TOPUP_PRICE_ID_LEGACY } from "../src/lib/stripe-fulfillment.server";

type Row = Record<string, unknown>;
const aiPrice = Object.keys(PRICE_MAP)[0] ?? "";
let event: Row;
let prices: string[];
let sessions: Row[];
let rows: Record<string, Row[]>;
let writes: { table: string; value: Row }[];
let mails: Row[];
let createdUsers: number;
let walletCalls: number;
let referralCalls: { session: string; user: string }[];
let refundCalls: number;

function query(table: string) {
  let operation = "select";
  let value: Row = {};
  let single = false;
  const filters: ((row: Row) => boolean)[] = [];
  const chain = {
    select: () => chain,
    update: (next: Row) => { operation = "update"; value = next; return chain; },
    insert: (next: Row) => { operation = "insert"; value = next; return chain; },
    upsert: (next: Row) => { operation = "insert"; value = next; return chain; },
    delete: () => { operation = "delete"; return chain; },
    eq: (key: string, next: unknown) => { filters.push((row) => row[key] === next); return chain; },
    ilike: (key: string, next: string) => { filters.push((row) => String(row[key]).toLowerCase() === next.toLowerCase()); return chain; },
    gt: (key: string, next: number) => { filters.push((row) => Number(row[key]) > next); return chain; },
    order: () => chain,
    limit: () => chain,
    maybeSingle: () => { single = true; return chain; },
    then: (resolve: (result: { data: unknown; error: null }) => unknown) => {
      const existing = rows[table] ?? [];
      const found = existing.filter((row) => filters.every((filter) => filter(row)));
      if (operation !== "select") writes.push({ table, value });
      if (operation === "insert") { const inserted = { id: `${table}-${existing.length}`, ...value }; rows[table] = [...existing, inserted]; found.push(inserted); }
      if (operation === "update") found.forEach((row) => Object.assign(row, value));
      if (operation === "delete") rows[table] = existing.filter((row) => !found.includes(row));
      return Promise.resolve(resolve({ data: single ? found[0] ?? null : found, error: null }));
    },
  };
  return chain;
}

const admin = {
  from: query,
  auth: { admin: {
    createUser: async ({ email }: { email: string }) => { createdUsers++; return { data: { user: { id: "new-buyer", email } }, error: null }; },
    generateLink: async () => ({ data: { properties: { hashed_token: "fixture-token" } }, error: null }),
  } },
};

mock.module("@tanstack/react-router", () => ({ createFileRoute: () => (options: unknown) => ({ options }) }));
mock.module("@supabase/supabase-js", () => ({ createClient: () => admin }));
mock.module("@/integrations/supabase/client.server", () => ({ supabaseAdmin: admin }));
mock.module("stripe", () => ({ default: class {
  webhooks = { constructEventAsync: async () => event };
  checkout = { sessions: {
    // Each yielded item can come from a later Stripe page.
    listLineItems: () => (async function* () { for (const id of prices) yield { price: { id } }; })(),
    retrieve: async () => ({ total_details: {} }),
    list: async () => ({ data: sessions }),
  } };
} }));
mock.module("@/lib/wallet-stripe.server", () => ({ synchronizeSessionWallets: async () => { walletCalls++; } }));
mock.module("@/lib/referral-backend.server", () => ({
  processReferralCheckout: async (_admin: unknown, _stripe: unknown, session: { id: string }, user: string) => {
    referralCalls.push({ session: session.id, user });
    const referral = rows.referrals?.find((row) => row.referred_user_id === user);
    if (referral) Object.assign(referral, { status: "purchased", stripe_session_id: session.id });
  },
  applySignupReferral: async () => {},
  processReferralRefund: async () => { refundCalls++; },
}));
mock.module("@/lib/welcome-email.server", () => ({ buildWelcomeHtml: () => "welcome", WELCOME_SUBJECT: "welcome" }));
mock.module("@/lib/level-upgrade-email.server", () => ({ buildLevelUpgradeHtml: () => "upgrade", LEVEL_UPGRADE_SUBJECT: "upgrade" }));
mock.module("@/lib/ai-upgrade-email.server", () => ({ buildAiUpgradeHtml: () => "topup", AI_UPGRADE_SUBJECT: "topup", AI_TUTOR_BOT_LINK: "https://example.com" }));

const originalFetch = globalThis.fetch;
const envKeys = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "RESEND_API_KEY"];
const savedEnv = envKeys.map((key) => process.env[key]);
for (const key of envKeys) process.env[key] = key === "SUPABASE_URL" ? "https://example.com" : "test-placeholder";
globalThis.fetch = (async (_input: unknown, init?: RequestInit) => {
  mails.push(JSON.parse(String(init?.body)) as Row);
  return new Response("{}", { status: 200 });
}) as typeof fetch;
const { Route } = await import("../src/routes/api/public/stripe-webhook");
const handler = (Route as unknown as { options: { server: { handlers: { POST: (args: { request: Request }) => Promise<Response> } } } }).options.server.handlers.POST;
async function deliver() {
  return handler({ request: new Request("https://example.com/api/public/stripe-webhook", { method: "POST", headers: { "stripe-signature": "verified-fixture" }, body: "{}" }) });
}
function existingBuyer() {
  rows.profiles = [{ id: "buyer", email: "buyer@example.com", level: "beginner" }];
  rows.subscriptions = [{ id: "sub", user_id: "buyer", tier: "course", status: "active", amount: 0 }];
}
beforeEach(() => {
  prices = [aiPrice]; sessions = []; rows = {}; writes = []; mails = []; createdUsers = 0; walletCalls = 0; referralCalls = []; refundCalls = 0;
  event = { type: "checkout.session.completed", data: { object: { id: "cs_fixture", customer_email: "buyer@example.com", metadata: {}, amount_total: 3000, currency: "usd", created: 1794000000, payment_status: "paid" } } };
});
afterAll(() => {
  globalThis.fetch = originalFetch;
  envKeys.forEach((key, index) => { const value = savedEnv[index]; if (value === undefined) delete process.env[key]; else process.env[key] = value; });
  mock.restore();
});

for (const price of ["price_trading_only", "price_ai_trading_bundle"]) {
  test(`${price} creates no AI records and sends no email`, async () => {
    prices = [price];
    const response = await deliver();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, ignored: "not_ai" });
    expect(createdUsers).toBe(0); expect(writes).toEqual([]); expect(mails).toEqual([]);
    expect(walletCalls).toBe(1); expect(referralCalls).toEqual([]);
  });
}
test("AI purchase still creates account, level, active paid subscription and both emails", async () => {
  const response = await deliver();
  expect(response.status).toBe(200); expect(await response.json()).toEqual({ success: true });
  expect(createdUsers).toBe(1);
  expect(rows.profiles?.[0]?.level).toBe(PRICE_MAP[aiPrice]?.level);
  expect(rows.subscriptions?.[0]).toMatchObject({ user_id: "new-buyer", status: "active", amount_paid_cents: 3000, stripe_session_id: "cs_fixture", tier: PRICE_MAP[aiPrice]?.tier });
  expect(mails).toHaveLength(2);
});
test("AI line item after Trading items is fulfilled", async () => {
  prices = ["price_trading_only", "price_bundle", aiPrice];
  expect(await (await deliver()).json()).toEqual({ success: true }); expect(createdUsers).toBe(1);
});
test("level upgrade preserves tier and raises level", async () => {
  existingBuyer(); prices = [LEVEL_UPGRADE_PRICE_ID];
  expect(await (await deliver()).json()).toEqual({ success: true, upgrade: "level_upgrade" });
  expect(rows.profiles?.[0]?.level).toBe("intermediate"); expect(rows.subscriptions?.[0]?.tier).toBe("course");
  expect(createdUsers).toBe(0); expect(mails).toHaveLength(2);
});
for (const price of [AI_TOPUP_PRICE_ID, AI_TOPUP_PRICE_ID_LEGACY]) {
  test(`${price} top-up preserves level and grants tutor`, async () => {
    existingBuyer(); prices = [price];
    expect(await (await deliver()).json()).toEqual({ success: true, upgrade: "course_ai_topup" });
    expect(rows.profiles?.[0]?.level).toBe("beginner"); expect(rows.subscriptions?.[0]?.tier).toBe("course_ai");
    expect(createdUsers).toBe(0); expect(mails).toHaveLength(2);
  });
}
test("bundle buyer with a profile still marks invited referral purchased without AI fulfillment", async () => {
  existingBuyer(); prices = ["price_ai_trading_bundle"];
  rows.referrals = [{ referred_user_id: "buyer", status: "signed_up" }];
  expect(await (await deliver()).json()).toEqual({ received: true, ignored: "not_ai" });
  expect(referralCalls).toEqual([{ session: "cs_fixture", user: "buyer" }]);
  expect(rows.referrals[0]).toMatchObject({ status: "purchased", stripe_session_id: "cs_fixture" });
  expect(writes).toEqual([]); expect(mails).toEqual([]); expect(createdUsers).toBe(0); expect(walletCalls).toBe(2);
});
test("unknown fulfillment price fails before any database calls", async () => {
  await expect(fulfillCheckout(admin, { sessionId: "cs_unknown", email: "buyer@example.com", priceId: "price_unknown", metadata: {}, clientReferenceId: null, amountTotal: 7000, currency: "usd", createdUnix: 1794000000, promoCode: null })).rejects.toThrow("unknown_price");
  expect(writes).toEqual([]); expect(createdUsers).toBe(0);
});
test("allowlist accepts only AI prices or the two explicit upgrade metadata values", () => {
  for (const price of [...Object.keys(PRICE_MAP), LEVEL_UPGRADE_PRICE_ID, AI_TOPUP_PRICE_ID, AI_TOPUP_PRICE_ID_LEGACY]) expect(isAiCheckout(price, {})).toBe(true);
  expect(isAiCheckout("unknown", { upgrade: "level_upgrade" })).toBe(true);
  expect(isAiCheckout("unknown", { upgrade: "course_ai_topup" })).toBe(true);
  for (const price of ["unknown", "constructor", "toString", "price_trading_only"]) expect(isAiCheckout(price, { upgrade: "trading_upgrade" })).toBe(false);
});
for (const [price, revoked] of [["price_trading_only", false], ["price_ai_trading_bundle", false], [aiPrice, true]] as const) {
  test(`refund ${price} isolates AI revocation and retains referral/wallet handling`, async () => {
    existingBuyer(); prices = [price];
    rows.subscriptions?.push({ id: "activation", status: "active", stripe_session_id: "bundle:trading:grant" });
    Object.assign(rows.subscriptions?.[0] ?? {}, { stripe_session_id: "cs_refunded" });
    sessions = [{ id: "cs_refunded", metadata: {} }];
    event = { type: "charge.refunded", data: { object: { payment_intent: "pi_fixture" } } };
    expect(await (await deliver()).json()).toEqual({ received: true });
    expect(rows.subscriptions?.[0]?.status).toBe(revoked ? "inactive" : "active");
    expect(rows.subscriptions?.[1]?.status).toBe("active"); expect(refundCalls).toBe(1); expect(walletCalls).toBe(1); expect(mails).toEqual([]);
  });
}