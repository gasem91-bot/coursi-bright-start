// Client wrapper around RevenueCat (StoreKit on iOS, Google Play Billing on
// Android). Only ever runs inside the native shell; every import is lazy so
// the web build never loads native code.
import { isNative } from "./native";

// RevenueCat *public* SDK keys (safe to ship in the app).
const IOS_KEY = (import.meta.env.VITE_REVENUECAT_IOS_KEY as string | undefined) ?? "";
const ANDROID_KEY = (import.meta.env.VITE_REVENUECAT_ANDROID_KEY as string | undefined) ?? "";

export type StoreProductInfo = { id: string; title: string; priceString: string };

let configuredFor: string | null = null;

async function platform(): Promise<"ios" | "android" | "web"> {
  const { Capacitor } = await import("@capacitor/core");
  const p = Capacitor.getPlatform();
  return p === "ios" || p === "android" ? p : "web";
}

/** True when this build can sell through the store (native + SDK key present). */
export async function iapAvailable(): Promise<boolean> {
  if (!isNative()) return false;
  const p = await platform();
  return p === "ios" ? Boolean(IOS_KEY) : p === "android" ? Boolean(ANDROID_KEY) : false;
}

/** Links the store customer to the signed-in Supabase user id. */
export async function initIap(userId: string): Promise<void> {
  if (!(await iapAvailable())) throw new Error("iap_unavailable");
  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  if (configuredFor === null) {
    const p = await platform();
    await Purchases.configure({ apiKey: p === "ios" ? IOS_KEY : ANDROID_KEY, appUserID: userId });
  } else if (configuredFor !== userId) {
    await Purchases.logIn({ appUserID: userId });
  }
  configuredFor = userId;
}

export async function loadStoreProducts(ids: string[]): Promise<Record<string, StoreProductInfo>> {
  const { Purchases, PRODUCT_CATEGORY } = await import("@revenuecat/purchases-capacitor");
  const { products } = await Purchases.getProducts({
    productIdentifiers: ids,
    type: PRODUCT_CATEGORY.NON_SUBSCRIPTION,
  });
  const out: Record<string, StoreProductInfo> = {};
  for (const p of products) {
    out[p.identifier] = { id: p.identifier, title: p.title, priceString: p.priceString };
  }
  return out;
}

export type PurchaseOutcome = "purchased" | "cancelled";

export async function buyProduct(productId: string): Promise<PurchaseOutcome> {
  const { Purchases, PRODUCT_CATEGORY } = await import("@revenuecat/purchases-capacitor");
  const { products } = await Purchases.getProducts({
    productIdentifiers: [productId],
    type: PRODUCT_CATEGORY.NON_SUBSCRIPTION,
  });
  const product = products[0];
  if (!product) throw new Error("product_not_found");
  try {
    await Purchases.purchaseStoreProduct({ product });
    return "purchased";
  } catch (e) {
    if ((e as { userCancelled?: boolean }).userCancelled) return "cancelled";
    throw e;
  }
}

/** Re-delivers earlier purchases from the store account (required "Restore" button). */
export async function restoreStorePurchases(): Promise<void> {
  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  await Purchases.restorePurchases();
}
