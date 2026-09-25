import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import PortalHeader from "@/components/portal-nav";
import { Button } from "@/components/ui/button";
import { getEmailPreviews, sendTestEmails } from "@/lib/email-preview.functions";

export const Route = createFileRoute("/admin/emails")({
  head: () => ({
    meta: [
      { title: "معاينة رسائل البريد — لوحة كورسي" },
      {
        name: "description",
        content: "معاينة داخلية لقوالب البريد في بوابة كورسي: الترحيب، تذاكر الدعم، وشهادة الإتمام.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "معاينة رسائل البريد — لوحة كورسي" },
      {
        property: "og:description",
        content: "معاينة داخلية لقوالب البريد في بوابة كورسي مع الموضوع والتنسيق النهائي.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminEmailsPage,
});

const font = "Cairo, 'Noto Sans Arabic', sans-serif";

function AdminEmailsPage() {
  const fetchPreviews = useServerFn(getEmailPreviews);
  const sendEmails = useServerFn(sendTestEmails);
  const [active, setActive] = useState(0);
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-email-previews"],
    queryFn: () => fetchPreviews(),
    staleTime: 5 * 60 * 1000,
  });

  const previews = data && data.ok ? data.previews : [];
  const current = previews[active];

  const handleSend = async (key?: string) => {
    setSending(true);
    setSendMsg("");
    try {
      const result = await sendEmails({ data: { key } });
      if (!result.ok) {
        const messages = {
          no_email: "لا يوجد بريد إلكتروني في حساب المشرف",
          forbidden: "هذه الصفحة مخصّصة للمشرفين فقط",
          misconfigured: "خدمة إرسال البريد غير مهيأة",
        };
        setSendMsg(messages[result.reason]);
      } else {
        const failed = result.failed.length > 0 ? ` — تعذّر: ${result.failed.join(", ")}` : "";
        setSendMsg(`تم إرسال ${result.sent.length} رسالة تجريبية إلى ${result.to}${failed}`);
      }
    } catch {
      setSendMsg("تعذّر إرسال الرسائل التجريبية");
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", fontFamily: font }} dir="rtl">
      <PortalHeader />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 64px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--text-primary)", marginBottom: 6 }}>
          معاينة رسائل البريد
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 22 }}>
          صفحة داخلية للمشرفين — تعرض كل قالب بريد ببيانات تجريبية مع الموضوع النهائي والتنسيق العربي.
        </p>

        {isLoading && <p style={{ color: "var(--text-secondary)" }}>جاري التحميل…</p>}
        {isError && <p style={{ color: "#ff6b6b" }}>تعذّر تحميل المعاينات.</p>}
        {data && !data.ok && (
          <div
            style={{
              border: "1px solid rgba(255,107,107,0.3)",
              background: "rgba(255,107,107,0.08)",
              borderRadius: 14,
              padding: 20,
              color: "var(--text-primary)",
            }}
          >
            هذه الصفحة مخصّصة للمشرفين فقط.
          </div>
        )}

        {current && (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
              {previews.map((p, i) => (
                <button
                  key={p.key}
                  onClick={() => setActive(i)}
                  style={{
                    fontFamily: font,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                    padding: "9px 16px",
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

            <div
              style={{
                border: "1px solid var(--border-color, rgba(128,128,128,0.25))",
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
                background: "var(--bg-secondary, rgba(128,128,128,0.06))",
                display: "grid",
                gap: 6,
                fontSize: 13,
                color: "var(--text-secondary)",
              }}
            >
              <div>
                <b style={{ color: "var(--text-primary)" }}>الموضوع:</b> {current.subject}
              </div>
              <div>
                <b style={{ color: "var(--text-primary)" }}>من:</b> {current.from}
              </div>
              <div>
                <b style={{ color: "var(--text-primary)" }}>إلى:</b> {current.to}
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              <Button disabled={sending} onClick={() => void handleSend(current.key)}>
                {sending ? "جاري الإرسال…" : "أرسل هذه الرسالة لبريدي"}
              </Button>
              <Button variant="outline" disabled={sending} onClick={() => void handleSend()}>
                {sending ? "جاري الإرسال…" : "أرسل كل الرسائل لبريدي"}
              </Button>
              {sendMsg && (
                <p style={{ width: "100%", margin: 0, color: "var(--text-secondary)", fontSize: 13 }}>
                  {sendMsg}
                </p>
              )}
            </div>

            <iframe
              key={current.key}
              title={`معاينة ${current.label}`}
              srcDoc={current.html}
              sandbox=""
              style={{
                width: "100%",
                height: 900,
                border: "1px solid var(--border-color, rgba(128,128,128,0.25))",
                borderRadius: 16,
                background: "#0A0A0A",
              }}
            />
          </>
        )}
      </main>
    </div>
  );
}
