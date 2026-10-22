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

const LEVEL_LABELS = { beginner: "مبتدئ", intermediate: "متوسط", advanced: "متقدم" };

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
  const [active, setActive] = useState("welcome");
  const [variants, setVariants] = useState<Record<string, { level: string; tier: string }>>({});
  const groups = previews?.filter((preview, index, all) => all.findIndex((item) => item.templateKey === preview.templateKey) === index) ?? [];
  const selected = (templateKey: string) => {
    const items = previews?.filter((item) => item.templateKey === templateKey) ?? [];
    const choice = variants[templateKey];
    return items.find((item) => (!item.level || item.level === (choice?.level ?? "beginner")) &&
      (!item.tier || item.tier === (choice?.tier ?? "course"))) ?? items[0];
  };
  const choose = (templateKey: string, field: "level" | "tier", value: string) => {
    setVariants((old) => ({ ...old, [templateKey]: { ...(old[templateKey] ?? { level: "beginner", tier: "course" }), [field]: value } }));
    setActive(templateKey);
    setShowPreview(true);
  };

  useEffect(() => {
    if (access !== "admin") return;
    let cancelled = false;
    setPreviewLoading(true);
    void fetchPreviews().then((res) => {
      if (cancelled) return;
      if (res.ok) setPreviews(res.previews);
      else setPreviewError(res.message ?? "تعذّر تحميل المعاينات");
    }).catch((err) => { if (!cancelled) setPreviewError(err instanceof Error ? err.message : String(err)); })
      .finally(() => { if (!cancelled) setPreviewLoading(false); });
    return () => { cancelled = true; };
  }, [access, fetchPreviews]);

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
    const keys = key ? [key] : groups.flatMap((group) => { const item = selected(group.templateKey); return item ? [item.key] : []; });
    setBusy(true);
    setGlobalMsg("");
    setStatus((s) => ({ ...s, ...Object.fromEntries(keys.map((k) => [k, { state: "sending" } as ItemStatus])) }));
    try {
      const res = await sendEmails({ data: { keys } });
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

  const current = selected(active);

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
              <Button size="lg" disabled={busy || !groups.length} onClick={() => void handleSend()}>
                {busy ? "جاري الإرسال…" : "أرسل كل الرسائل التجريبية لبريدي"}
              </Button>
              {globalMsg && (
                <p style={{ margin: "10px 0 0", color: "var(--text-secondary)", fontSize: 13 }}>{globalMsg}</p>
              )}
            </div>

            <div style={{ display: "grid", gap: 10, marginBottom: 28 }}>
              {groups.map((e) => {
                const item = selected(e.templateKey);
                if (!item) return null;
                const st = status[item.key];
                const choice = variants[e.templateKey];
                const levels = [...new Set(previews?.filter((p) => p.templateKey === e.templateKey).flatMap((p) => p.level ? [p.level] : []) ?? [])];
                return (
                  <div key={e.templateKey} style={{ ...box, padding: 14 }}>
                    <div
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}
                    >
                      <b style={{ color: "var(--text-primary)", fontSize: 15 }}>{e.label}</b>
                      <Button variant="outline" disabled={busy} onClick={() => void handleSend(item.key)}>
                        {st?.state === "sending" ? "جاري الإرسال…" : "أرسل لبريدي"}
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      {levels.length > 0 && <label className="flex items-center gap-2 text-foreground">
                        المستوى
                        <select aria-label={`المستوى — ${e.label}`} value={choice?.level ?? "beginner"}
                          onChange={(event) => choose(e.templateKey, "level", event.target.value)}
                          className="min-h-12 rounded-md border border-input bg-background text-foreground px-3">
                          {levels.map((level) => <option key={level} value={level}>{LEVEL_LABELS[level]}</option>)}
                        </select>
                      </label>}
                      {e.tier && <div role="group" aria-label={`المساعد — ${e.label}`} className="flex gap-2">
                        <Button variant={(choice?.tier ?? "course") === "course" ? "default" : "outline"}
                          aria-pressed={(choice?.tier ?? "course") === "course"} onClick={() => choose(e.templateKey, "tier", "course")}>بدون مساعد</Button>
                        <Button variant={choice?.tier === "course_ai" ? "default" : "outline"}
                          aria-pressed={choice?.tier === "course_ai"} onClick={() => choose(e.templateKey, "tier", "course_ai")}>مع المساعد</Button>
                      </div>}
                      <Button variant="ghost" onClick={() => { setActive(e.templateKey); setShowPreview(true); }}>معاينة</Button>
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
              <Button variant="ghost" onClick={() => void togglePreview()}>
                {showPreview ? "إخفاء معاينة القوالب" : "عرض معاينة القوالب"}
              </Button>
              {previewLoading && <p className="text-muted-foreground">جاري تحميل المعاينات…</p>}
              {previewError && <p className="text-destructive">{previewError}</p>}
              {showPreview && (
                <div style={{ marginTop: 14 }}>
                  {previewLoading && <p style={{ color: "var(--text-secondary)" }}>جاري تحميل المعاينات…</p>}
                  {previewError && (
                    <p style={{ color: "#ff6b6b", fontSize: 13 }}>تعذّر تحميل المعاينات — {previewError}</p>
                  )}
                  {previews && current && (
                    <>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {groups.map((group) => <Button key={group.templateKey}
                          variant={group.templateKey === active ? "default" : "outline"}
                          onClick={() => setActive(group.templateKey)}>{group.label}</Button>)}
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
                        style={{ width: "100%", height: 900, border: "none", borderRadius: 12, background: "var(--bg-primary)" }}
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
