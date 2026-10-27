import { useEffect, useState, type CSSProperties } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { IAP_PRODUCT_BY_ID } from "@/lib/iap-products";
import {
  buyProduct,
  initIap,
  iapAvailable,
  loadStoreProducts,
  restoreStorePurchases,
} from "@/lib/iap";
import { syncIapPurchases } from "@/lib/iap.functions";

const font = "Cairo, 'Noto Sans Arabic', sans-serif";

export const gradientButton: CSSProperties = {
  width: "100%",
  minHeight: 48,
  border: "none",
  borderRadius: 50,
  background: "linear-gradient(135deg, #7B35C0, #40C8C8)",
  color: "#fff",
  fontWeight: 700,
  fontSize: 16,
  fontFamily: font,
  cursor: "pointer",
};

/** Grants access after a store purchase. RevenueCat can lag a moment, so retry briefly. */
export function useSyncPurchases() {
  const sync = useServerFn(syncIapPurchases);
  return async (): Promise<boolean> => {
    for (let i = 0; i < 8; i++) {
      try {
        const r = await sync();
        if (r.ok && r.hasAccess) return true;
      } catch {
        /* retry */
      }
      await new Promise((res) => setTimeout(res, 1500));
    }
    return false;
  };
}

/** Looks up the localized store price for a product id (e.g. "$34.99"). */
export function useStorePrice(productId: string): string {
  const fallback = `$${IAP_PRODUCT_BY_ID[productId]?.usd ?? ""}`;
  const [price, setPrice] = useState(fallback);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!(await iapAvailable())) return;
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        await initIap(user.id);
        const found = await loadStoreProducts([productId]);
        if (!cancelled && found[productId]) setPrice(found[productId].priceString);
      } catch {
        /* keep fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);
  return price;
}

/** One-tap purchase of a single in-app product. Native app only. */
export function IapBuyButton(props: {
  productId: string;
  label: string;
  onSuccess?: () => void;
  style?: CSSProperties;
  disabled?: boolean;
}) {
  const { productId, label, onSuccess, style, disabled } = props;
  const price = useStorePrice(productId);
  const syncAndCheck = useSyncPurchases();
  const [busy, setBusy] = useState(false);

  const buy = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("سجّل الدخول أولاً");
        return;
      }
      await initIap(user.id);
      const outcome = await buyProduct(productId);
      if (outcome === "cancelled") return;
      if (await syncAndCheck()) {
        toast.success("تم الشراء بنجاح ✓");
        onSuccess?.();
      } else {
        toast.error(
          "تمت العملية لكن لم يتم تفعيل حسابك بعد. اضغط «استعادة المشتريات» أو تواصل مع الدعم.",
        );
      }
    } catch {
      toast.error("تعذّر إتمام الشراء، حاول مرة أخرى");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={buy}
      disabled={busy || disabled}
      style={{ ...gradientButton, opacity: busy || disabled ? 0.6 : 1, ...style }}
    >
      {busy ? "جاري المعالجة..." : `${label} — ${price}`}
    </button>
  );
}

/** Store-mandated "Restore purchases" action. */
export function RestorePurchasesButton({ onRestored }: { onRestored?: () => void }) {
  const syncAndCheck = useSyncPurchases();
  const [busy, setBusy] = useState(false);
  const restore = async () => {
    setBusy(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await initIap(user.id);
      await restoreStorePurchases();
      if (await syncAndCheck()) {
        toast.success("تمت استعادة مشترياتك ✓");
        onRestored?.();
      } else toast.info("لا توجد مشتريات سابقة لاستعادتها");
    } catch {
      toast.error("تعذّرت استعادة المشتريات");
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      onClick={restore}
      disabled={busy}
      style={{
        background: "transparent",
        border: "1px solid var(--border)",
        color: "var(--text-primary)",
        borderRadius: 50,
        minHeight: 44,
        padding: "0 20px",
        fontFamily: font,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {busy ? "جاري الاستعادة..." : "استعادة المشتريات"}
    </button>
  );
}
