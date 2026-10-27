import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { isNative, openExternal } from "@/lib/native";
import { getMyAccess } from "@/lib/iap.functions";
import { courseProductId, LEVEL_LABEL_AR, type IapLevel } from "@/lib/iap-products";
import { IapBuyButton, RestorePurchasesButton } from "@/components/iap-buy-button";

export const Route = createFileRoute("/subscribe")({
  component: SubscribePage,
  head: () => ({ meta: [{ title: "اختر خطتك — كورسي" }] }),
});

const font = "Cairo, 'Noto Sans Arabic', sans-serif";
const LEVELS: IapLevel[] = ["beginner", "intermediate", "advanced"];
const LEVEL_DESC: Record<IapLevel, string> = {
  beginner: "٨ فصول · من الصفر للاستخدام اليومي",
  intermediate: "١٠ فصول · من الاستخدام للاحتراف",
  advanced: "١٢ فصل · بناء منتجات وأعمال كاملة",
};

function SubscribePage() {
  const navigate = useNavigate();
  const loadAccess = useServerFn(getMyAccess);
  const [ready, setReady] = useState(false);
  const [level, setLevel] = useState<IapLevel>("beginner");
  const [withTutor, setWithTutor] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate({ to: "/login" });
        return;
      }
      try {
        const a = await loadAccess();
        if (a.hasAccess) {
          navigate({ to: "/dashboard" });
          return;
        }
      } catch {
        /* show the plans anyway */
      }
      setReady(true);
    })();
  }, [navigate, loadAccess]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };
  const goDashboard = () => navigate({ to: "/dashboard" });

  const card: React.CSSProperties = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 18,
    padding: 20,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        fontFamily: font,
        direction: "rtl",
        padding: "28px 16px 60px",
      }}
    >
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <h1
          style={{
            color: "var(--text-primary)",
            fontSize: 26,
            fontWeight: 800,
            textAlign: "center",
          }}
        >
          اختر مستواك وابدأ التعلّم
        </h1>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: 14,
            textAlign: "center",
            marginTop: 8,
            lineHeight: 1.9,
          }}
        >
          دفعة واحدة · وصول دائم · بدون اشتراك شهري
        </p>

        {!ready ? (
          <p style={{ color: "var(--text-secondary)", textAlign: "center", marginTop: 40 }}>
            جاري التحميل...
          </p>
        ) : !isNative() ? (
          <div
            style={{
              ...card,
              marginTop: 24,
              textAlign: "center",
              color: "var(--text-secondary)",
              lineHeight: 2,
            }}
          >
            لا توجد خطة نشطة على هذا الحساب. للاشتراك زر coursi.ai
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22 }}>
              {LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  style={{
                    ...card,
                    textAlign: "right",
                    cursor: "pointer",
                    fontFamily: font,
                    border: level === l ? "2px solid #7B35C0" : "1px solid var(--border)",
                  }}
                >
                  <div style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: 17 }}>
                    المستوى {LEVEL_LABEL_AR[l]}
                  </div>
                  <div style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>
                    {LEVEL_DESC[l]}
                  </div>
                </button>
              ))}
            </div>

            <label
              style={{
                ...card,
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 14,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={withTutor}
                onChange={(e) => setWithTutor(e.target.checked)}
                style={{ width: 22, height: 22 }}
              />
              <span style={{ color: "var(--text-primary)", fontSize: 14, lineHeight: 1.8 }}>
                أضف المعلم الذكي (مساعد عربي على تيليجرام ٢٤/٧)
              </span>
            </label>

            <div style={{ marginTop: 18 }}>
              <IapBuyButton
                productId={courseProductId(level, withTutor)}
                label={`ابدأ المستوى ${LEVEL_LABEL_AR[level]}`}
                onSuccess={goDashboard}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
              <RestorePurchasesButton onRestored={goDashboard} />
            </div>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: 12,
                textAlign: "center",
                marginTop: 16,
                lineHeight: 1.9,
              }}
            >
              الدفع عبر حسابك في المتجر. عملية شراء لمرة واحدة وليست اشتراكاً متجدداً.
            </p>
          </>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 18,
            marginTop: 26,
            fontSize: 12,
          }}
        >
          <button
            onClick={() => void openExternal("https://terms.coursi.ai")}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              textDecoration: "underline",
              fontFamily: font,
            }}
          >
            الشروط والأحكام
          </button>
          <button
            onClick={() => void openExternal("https://terms.coursi.ai/privacy")}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              textDecoration: "underline",
              fontFamily: font,
            }}
          >
            سياسة الخصوصية
          </button>
          <button
            onClick={signOut}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              textDecoration: "underline",
              fontFamily: font,
            }}
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
}
