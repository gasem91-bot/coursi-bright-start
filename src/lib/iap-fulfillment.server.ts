// Turns a store purchase (Apple / Google, via RevenueCat) into portal access by
// reusing the exact same fulfilment rules as the web's Stripe checkout.
import {
  AI_TOPUP_PRICE_ID,
  LEVEL_UPGRADE_PRICE_ID,
  PRICE_MAP,
  fulfillCheckout,
  type FulfillResult,
} from "./stripe-fulfillment.server";
import { IAP_PRODUCT_BY_ID, type IapProduct } from "./iap-products";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;

function priceIdFor(product: IapProduct): string | null {
  if (product.kind === "topup") return AI_TOPUP_PRICE_ID;
  if (product.kind === "level_unlock") return LEVEL_UPGRADE_PRICE_ID;
  const tier = product.kind; // "course" | "course_ai"
  const hit = Object.entries(PRICE_MAP).find(
    ([, v]) => v.level === product.level && v.tier === tier,
  );
  return hit ? hit[0] : null;
}

export type StorePurchase = {
  productId: string;
  transactionId: string;
  store: string;
  purchasedAtMs: number;
};

export async function fulfillStorePurchase(
  admin: Admin,
  userId: string,
  purchase: StorePurchase,
): Promise<FulfillResult | { kind: "unknown_product" }> {
  const product = IAP_PRODUCT_BY_ID[purchase.productId];
  if (!product) return { kind: "unknown_product" };
  const priceId = priceIdFor(product);
  if (!priceId) return { kind: "unknown_product" };

  const { data: profile } = await admin
    .from("profiles")
    .select("email, level")
    .eq("id", userId)
    .maybeSingle();
  const email = (profile?.email as string | undefined) ?? "";
  if (!email) throw new Error("no profile email for store purchase");

  return fulfillCheckout(admin, {
    sessionId: `iap_${purchase.store}_${purchase.transactionId}`,
    email,
    priceId,
    metadata: {
      user_id: userId,
      source: "in_app_purchase",
      ...(product.kind === "topup"
        ? { upgrade: "course_ai_topup", level: (profile?.level as string) || "beginner" }
        : {}),
    },
    clientReferenceId: userId,
    amountTotal: Math.round(product.usd * 100),
    currency: "usd",
    createdUnix: Math.floor(purchase.purchasedAtMs / 1000),
    promoCode: null,
  });
}
