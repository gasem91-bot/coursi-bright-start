import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import PortalHeader from "@/components/portal-nav";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  getEmailAdminStatus,
  getEmailPreviews,
  sendTestEmails,
  type EmailPreview,
} from "@/lib/email-preview.functions";

export const Route = createFileRoute("/admin/emails")({
  head: () => ({
    meta: [
      { title: "إرسال رسائل البريد التجريبية — لوحة كورسي" },
      {
        name: "description",
        content: "صفحة داخلية للمشرفين لإرسال نسخ تجريبية من كل رسائل بريد كورسي إلى بريد المشرف.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "إرسال رسائل البريد التجريبية — لوحة كورسي" },
      {
        property: "og:description",
        content: "إرسال نسخ تجريبية من قوالب بريد كورسي إلى بريد المشرف.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminEmailsPage,
});

const font = "Cairo, 'Noto Sans Arabic', sans-serif";

const EMAIL_TYPES: { key: string; label: string }[] = [
  { key: "welcome", label: "بريد الترحيب / تأكيد الدفع" },
  { key: "ticket-user", label: "تأكيد تذكرة الدعم (للمستخدم)" },
  { key: "ticket-support", label: "إشعار تذكرة جديدة (لفريق الدعم)" },
  { key: "reset", label: "إعادة تعيين كلمة المرور" },
  { key: "magiclink", label: "رابط الدخول السريع" },
  { key: "certificate", label: "شهادة الإتمام" },
  { key: "level-upgrade", label: "فتح مستوى جديد (دفعة الترقية)" },
  { key: "ai-upgrade", label: "تفعيل مساعد الذكاء الاصطناعي" },
];

type ItemStatus = { state: "sending" } | { state: "ok"; to: string } | { state: "error"; error: string };
type Access = "loading" | "signed_out" | "forbidden" | "admin" | "error";

const box = {
  border: "1px solid var(--border-color, rgba(128,128,128,0.25))",
  borderRadius: 14,
  background: "var(--bg-secondary, rgba(128,128,128,0.06))",
} as const;

function AdminEmailsPage() {
  const checkAdmin = useServerFn(getEmailAdminStatus);
  const sendEmails = useServerFn(sendTestEmails);
  const fetchPreviews = useServerFn(getEmailPreviews);

  const [access, setAccess] = useState<Access>("loading");
  const [accessError, setAccessError] = useState("");
  const [status, setStatus] = useState<Record<string, ItemStatus>>({});
  const [busy, setBusy] = useState(false);
  const [globalMsg, setGlobalMsg] = useState("");

  const [showPreview, setShowPreview] = useState(false);
  const [previews, setPreviews] = useState<EmailPreview[] | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        if (!cancelled) setAccess("signed_out");
        return;
      }
      try {
        const res = await checkAdmin();
        if (!cancelled) setAccess(res?.isAdmin ? "admin" : "forbidden");
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        if (/unauthor/i.test(msg)) setAccess("signed_out");
        else {
          setAccessError(msg);
          setAccess("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [checkAdmin]);

  const handleSend = async (key?: string) => {
    const keys = key ? [key] : EMAIL_TYPES.map((e) => e.key);
    setBusy(true);
    setGlobalMsg("");
    setStatus((s) => ({ ...s, ...Object.fromEntries(keys.map((k) => [k, { state: "sending" } as ItemStatus])) }));
    try {
      const res = await sendEmails({ data: { key } });
      if (!res || !res.ok) {
        const msg = res && !res.ok ? res.message : "لم يصل أي رد من الخادم";
        setStatus((s) => ({ ...s, ...Object.fromEntries(keys.map((k) => [k, { state: "error", error: msg } as ItemStatus])) }));
        setGlobalMsg(msg);
      } else {
        const next: Record<string, ItemStatus> = {};
        for (const k of keys) {
          const r = res.results.find((x) => x.key === k);
          next[k] = !r
            ? { state: "error", error: "لم يُرسل — القالب غير موجود على الخادم" }
            : r.ok
              ? { state: "ok", to: res.to }
              : { state: "error", error: r.error ?? "خطأ غير معروف" };
        }
        setStatus((s) => ({ ...s, ...next }));
        const okCount = res.results.filter((r) => r.ok).length;
        setGlobalMsg(`تم إرسال ${okCount} من ${res.results.length} رسالة تجريبية إلى ${res.to}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus((s) => ({ ...s, ...Object.fromEntries(keys.map((k) => [k, { state: "error", error: msg } as ItemStatus])) }));
      setGlobalMsg(`تعذّر الإرسال — ${msg}`);
    } finally {
      setBusy(false);
    }
  };

  const togglePreview = async () => {
    const open = !showPreview;
    setShowPreview(open);
    if (!open || previews || previewLoading) return;
    setPreviewLoading(true);
    setPreviewError("");
    try {
      const res = await fetchPreviews();
      if (res && res.ok && Array.isArray(res.previews) && res.previews.length > 0) setPreviews(res.previews);
      else if (res && !res.ok) setPreviewError(res.message ?? (res.reason === "forbidden" ? "مخصّصة للمشرفين فقط" : "لم تصل أي معاينات"));
      else setPreviewError("لم تصل أي معاينات من الخادم");
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : String(err));
    } finally {
      setPreviewLoading(false);
    }
  };

  const current = previews?.[Math.min(active, previews.length - 1)];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", fontFamily: font }} dir="rtl">
      <PortalHeader />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 64px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--text-primary)", marginBottom: 6 }}>
          إرسال رسائل البريد التجريبية
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 22 }}>
          صفحة داخلية للمشرفين — تُرسل كل رسالة إلى بريدك أنت فقط مع البادئة [تجربة].
        </p>

        {access === "loading" && <p style={{ color: "var(--text-secondary)" }}>جاري التحقق من الحساب…</p>}

        {(access === "signed_out" || access === "forbidden" || access === "error") && (
          <div
            style={{
              border: "1px solid rgba(255,107,107,0.3)",
              background: "rgba(255,107,107,0.08)",
              borderRadius: 14,
              padding: 20,
              color: "var(--text-primary)",
              display: "grid",
              gap: 12,
            }}
          >
            <div>
              {access === "signed_out" && "يجب تسجيل الدخول بحساب مشرف لعرض هذه الصفحة."}
              {access === "forbidden" && "هذه الصفحة مخصّصة للمشرفين فقط. سجّل الدخول بحساب مشرف."}
              {access === "error" && `تعذّر التحقق من الحساب — ${accessError}`}
            </div>
            <div>
              <Button asChild>
                <Link to="/login">تسجيل الدخول</Link>
              </Button>
            </div>
          </div>
        )}

        {access === "admin" && (
          <>
            <div style={{ marginBottom: 18 }}>
              <Button size="lg" disabled={busy} onClick={() => void handleSend()}>
                {busy ? "جاري الإرسال…" : "أرسل كل الرسائل التجريبية لبريدي"}
              </Button>
              {globalMsg && (
                <p style={{ margin: "10px 0 0", color: "var(--text-secondary)", fontSize: 13 }}>{globalMsg}</p>
              )}
            </div>

            <div style={{ display: "grid", gap: 10, marginBottom: 28 }}>
              {EMAIL_TYPES.map((e) => {
                const st = status[e.key];
                return (
                  <div key={e.key} style={{ ...box, padding: 14 }}>
                    <div
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}
                    >
                      <b style={{ color: "var(--text-primary)", fontSize: 15 }}>{e.label}</b>
                      <Button variant="outline" disabled={busy} onClick={() => void handleSend(e.key)}>
                        {st?.state === "sending" ? "جاري الإرسال…" : "أرسل لبريدي"}
                      </Button>
                    </div>
                    {st?.state === "ok" && (
                      <p style={{ margin: "8px 0 0", fontSize: 13, color: "#22c55e" }}>✓ تم الإرسال إلى {st.to}</p>
                    )}
                    {st?.state === "error" && (
                      <p style={{ margin: "8px 0 0", fontSize: 13, color: "#ff6b6b", wordBreak: "break-word" }}>
                        ✗ {st.error}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ ...box, padding: 14 }}>
              <button
                onClick={() => void togglePreview()}
                style={{
                  fontFamily: font,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-primary)",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {showPreview ? "▾ إخفاء معاينة القوالب" : "▸ عرض معاينة القوالب (اختياري)"}
              </button>
              {showPreview && (
                <div style={{ marginTop: 14 }}>
                  {previewLoading && <p style={{ color: "var(--text-secondary)" }}>جاري تحميل المعاينات…</p>}
                  {previewError && (
                    <p style={{ color: "#ff6b6b", fontSize: 13 }}>تعذّر تحميل المعاينات — {previewError}</p>
                  )}
                  {previews && current && (
                    <>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                        {previews.map((p, i) => (
                          <button
                            key={p.key}
                            onClick={() => setActive(i)}
                            style={{
                              fontFamily: font,
                              cursor: "pointer",
                              fontSize: 13,
                              fontWeight: 700,
                              padding: "8px 14px",
                              borderRadius: 999,
                              border:
                                i === active
                                  ? "1px solid rgba(123,53,192,0.6)"
                                  : "1px solid var(--border-color, rgba(128,128,128,0.25))",
                              background: i === active ? "rgba(123,53,192,0.15)" : "transparent",
                              color: "var(--text-primary)",
                            }}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 10px" }}>
                        <b style={{ color: "var(--text-primary)" }}>الموضوع:</b> {current.subject} ·{" "}
                        <b style={{ color: "var(--text-primary)" }}>من:</b> {current.from}
                      </p>
                      <iframe
                        key={current.key}
                        title={`معاينة ${current.label}`}
                        srcDoc={current.html}
                        sandbox=""
                        style={{ width: "100%", height: 900, border: "none", borderRadius: 12, background: "#0A0A0A" }}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
