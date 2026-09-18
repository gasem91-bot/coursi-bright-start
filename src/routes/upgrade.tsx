import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createAiUpgradeCheckout, getUpgradeStatus, type UpgradeStatus } from "@/lib/upgrade.functions";

export const Route = createFileRoute("/upgrade")({
  component: UpgradePage,
  head: () => ({
    meta: [
      { title: "أضف مساعد الذكاء الاصطناعي — COURSI" },
      { name: "description", content: "أضف مساعد كورسي الذكي على تيليجرام إلى اشتراكك في الكورس مقابل ١٤ دولاراً لمرة واحدة." },
      { property: "og:title", content: "أضف مساعد الذكاء الاصطناعي — COURSI" },
      { property: "og:description", content: "ترقية لمرة واحدة تفتح مساعد كورسي الذكي على تيليجرام." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const font = "Cairo, 'Noto Sans Arabic', sans-serif";

function UpgradePage() {
  const navigate = useNavigate();
  const loadStatus = useServerFn(getUpgradeStatus);
  const startCheckout = useServerFn(createAiUpgradeCheckout);
  const [status, setStatus] = useState<UpgradeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success")) toast.success("تم الدفع بنجاح — تحقق من بريدك لرابط المساعد");
    if (params.get("canceled")) toast.info("تم إلغاء عملية الدفع");
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate({ to: "/login" });
        return;
      }
      try {
        setStatus(await loadStatus());
      } catch {
        toast.error("تعذّر تحميل حالة اشتراكك");
      }
      setLoading(false);
    })();
  }, [navigate, loadStatus]);

  const onUpgrade = async () => {
    setBusy(true);
    try {
      const res = await startCheckout();
      if ("url" in res) {
        window.location.href = res.url;
        return;
      }
      toast.error(
        res.error === "already_active"
          ? "المساعد مفعّل في حسابك بالفعل"
          : res.error === "not_eligible"
            ? "هذه الترقية متاحة لمشتركي الكورس فقط"
            : "تعذّر فتح صفحة الدفع، حاول مرة أخرى",
      );
    } catch {
      toast.error("تعذّر فتح صفحة الدفع، حاول مرة أخرى");
    }
    setBusy(false);
  };

  const shell = (children: React.ReactNode) => (
    <div
      className="page-content"
      style={{ minHeight: "100vh", background: "var(--bg-primary)", fontFamily: font, direction: "rtl", padding: "24px 16px", paddingBottom: 100 }}
    >
      <div style={{ maxWidth: 620, margin: "0 auto" }}>{children}</div>
    </div>
  );

  if (loading) {
    return shell(<p style={{ color: "var(--text-secondary)", textAlign: "center", marginTop: 60 }}>جاري التحميل...</p>);
  }

  return shell(
    <>
      <h1 style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: 28, marginBottom: 18 }}>
        أضف مساعد الذكاء الاصطناعي
      </h1>

      <div
        style={{
          background: "linear-gradient(160deg, rgba(64,200,200,0.08), rgba(123,53,192,0.05))",
          border: "1px solid rgba(64,200,200,0.25)",
          borderRadius: 16,
          padding: 24,
        }}
      >
        <span style={{ display: "inline-block", background: "rgba(64,200,200,0.15)", color: "var(--accent-cyan-text)", padding: "4px 12px", borderRadius: 30, fontSize: 11, fontWeight: 700 }}>
          إضافة لمرة واحدة
        </span>
        <div style={{ color: "var(--text-primary)", fontSize: 38, fontWeight: 800, marginTop: 14 }}>
          $14
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 2, marginTop: 12 }}>
          ✓ مساعد ذكي بالعربية على تيليجرام على مدار الساعة
          <br />
          ✓ يشرح دروس مستواك ويجيب عن أسئلتك
          <br />
          ✓ دفعة واحدة، بدون اشتراك شهري
        </p>

        {status?.tier === "course_ai" ? (
          <p style={{ color: "var(--accent-cyan-text)", fontWeight: 700, marginTop: 18 }}>
            المساعد مفعّل في حسابك بالفعل ✓
          </p>
        ) : status?.eligible ? (
          <button
            onClick={onUpgrade}
            disabled={busy}
            style={{
              marginTop: 20,
              width: "100%",
              background: "linear-gradient(135deg, #7B35C0, #40C8C8)",
              color: "white",
              border: "none",
              padding: "14px 22px",
              borderRadius: 50,
              fontFamily: font,
              fontWeight: 700,
              fontSize: 16,
              cursor: busy ? "default" : "pointer",
              opacity: busy ? 0.6 : 1,
            }}
          >
            {busy ? "جاري التحويل..." : "أضف المساعد الآن — $14"}
          </button>
        ) : (
          <p style={{ color: "var(--text-secondary)", marginTop: 18, fontSize: 14, lineHeight: 1.9 }}>
            هذه الترقية متاحة لمن اشترى الكورس فقط. إذا كنت تعتقد أن هناك خطأ، تواصل مع الدعم
          </p>
        )}
      </div>
    </>,
  );
}
