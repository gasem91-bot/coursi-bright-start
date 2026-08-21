import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/contexts/ProfileContext";
import PortalHeader from "@/components/portal-nav";
import { createSupportTicket } from "@/lib/support.functions";
import {
  CATEGORY_LABEL,
  TICKET_CATEGORIES,
  TICKET_STATUS_COLOR,
  TICKET_STATUS_LABEL,
  ticketRef,
  type TicketCategory,
} from "@/lib/support";

export const Route = createFileRoute("/support")({
  component: SupportPage,
  head: () => ({
    meta: [
      { title: "الدعم الفني — COURSI" },
      { name: "description", content: "أرسل تذكرة دعم لفريق كورسي وتابع حالة طلباتك السابقة." },
      { property: "og:title", content: "الدعم الفني — COURSI" },
      { property: "og:description", content: "أرسل تذكرة دعم لفريق كورسي وتابع حالة طلباتك السابقة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const font = "Cairo, 'Noto Sans Arabic', sans-serif";

interface Ticket {
  id: string;
  category: string;
  message: string;
  status: string;
  created_at: string;
}

function SupportPage() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const submit = useServerFn(createSupportTicket);

  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<TicketCategory>("technical");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const loadTickets = async (uid: string) => {
    const { data } = await supabase
      .from("support_tickets")
      .select("id, category, message, status, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    setTickets((data as Ticket[]) ?? []);
  };

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate({ to: "/login" });
        return;
      }
      setUserId(session.user.id);
      setEmail(session.user.email ?? "");
      await loadTickets(session.user.id);
      setLoading(false);
    })();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 5) {
      toast.error("اكتب وصفاً أوضح للمشكلة (٥ أحرف على الأقل)");
      return;
    }
    setSending(true);
    try {
      const res = await submit({ data: { category, message: message.trim() } });
      if (res.ok) {
        setConfirmation(res.ticketRef);
        setMessage("");
        toast.success(`تم استلام تذكرتك ${res.ticketRef}`);
        if (userId) await loadTickets(userId);
      } else {
        toast.error("تعذّر إرسال التذكرة، حاول مرة أخرى");
      }
    } catch {
      toast.error("تعذّر إرسال التذكرة، حاول مرة أخرى");
    } finally {
      setSending(false);
    }
  };

  const name = profile?.display_name?.trim() || (profile?.email || email || "").split("@")[0] || "مستخدم كورسي";

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--bg-secondary, #0D0D14)",
    border: "1px solid var(--border, #24243A)",
    borderRadius: 14,
    color: "var(--text-primary, #fff)",
    padding: "12px 14px",
    fontSize: 14,
    fontFamily: font,
  };

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "var(--bg-primary, #060410)", fontFamily: font }}>
      <PortalHeader />
      <main style={{ maxWidth: 820, margin: "0 auto", padding: "24px 16px 96px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--text-primary)", marginBottom: 6 }}>
          🎧 الدعم الفني
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>
          أرسل مشكلتك وسيتواصل معك فريق كورسي على بريدك الإلكتروني.
        </p>

        {confirmation && (
          <div
            style={{
              background: "rgba(61,214,160,0.08)",
              border: "1px solid rgba(61,214,160,0.35)",
              borderRadius: 16,
              padding: "16px 18px",
              marginBottom: 20,
              color: "#3DD6A0",
              fontSize: 14,
              lineHeight: 1.9,
            }}
          >
            ✅ تم استلام تذكرتك بنجاح — رقم التذكرة <b>{confirmation}</b>
            <br />
            أرسلنا لك رسالة تأكيد إلى {profile?.email || email}. سنعود إليك قريباً.
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            background: "var(--bg-card, #0B0A16)",
            border: "1px solid var(--border, #24243A)",
            borderRadius: 20,
            padding: 20,
            marginBottom: 32,
          }}
        >
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              الحساب: <b style={{ color: "var(--text-primary)" }}>{name}</b> · {profile?.email || email}
            </div>
            <label style={{ display: "grid", gap: 6, fontSize: 13, color: "var(--text-secondary)" }}>
              التصنيف
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TicketCategory)}
                style={inputStyle}
              >
                {TICKET_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "grid", gap: 6, fontSize: 13, color: "var(--text-secondary)" }}>
              تفاصيل المشكلة
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                placeholder="اشرح المشكلة بالتفصيل..."
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.9 }}
              />
            </label>
            <button
              type="submit"
              disabled={sending}
              style={{
                background: "linear-gradient(135deg,#7B35FF,#00D4C8)",
                border: "none",
                borderRadius: 50,
                color: "#fff",
                fontWeight: 900,
                fontSize: 15,
                padding: "14px 32px",
                cursor: sending ? "wait" : "pointer",
                opacity: sending ? 0.7 : 1,
                fontFamily: font,
                justifySelf: "start",
              }}
            >
              {sending ? "جارٍ الإرسال..." : "إرسال التذكرة"}
            </button>
          </div>
        </form>

        <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", marginBottom: 12 }}>
          تذاكري السابقة
        </h2>
        {loading ? (
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>جارٍ التحميل...</p>
        ) : tickets.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>لا توجد تذاكر بعد.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {tickets.map((t) => (
              <div
                key={t.id}
                style={{
                  background: "var(--bg-card, #0B0A16)",
                  border: "1px solid var(--border, #24243A)",
                  borderRadius: 16,
                  padding: 16,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  <span style={{ fontWeight: 800, color: "#00D4C8", fontSize: 13, letterSpacing: 1 }}>
                    {ticketRef(t.id)}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: TICKET_STATUS_COLOR[t.status] ?? "#888",
                      border: `1px solid ${TICKET_STATUS_COLOR[t.status] ?? "#888"}55`,
                      borderRadius: 20,
                      padding: "3px 12px",
                    }}
                  >
                    {TICKET_STATUS_LABEL[t.status] ?? t.status}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>
                  {CATEGORY_LABEL[t.category] ?? t.category} ·{" "}
                  {new Date(t.created_at).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}
                </div>
                <div style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.9, whiteSpace: "pre-wrap" }}>
                  {t.message}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
