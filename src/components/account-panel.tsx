import { useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/lib/theme";
import { toast } from "sonner";

const font = "Cairo, 'Noto Sans Arabic', sans-serif";

type Level = "beginner" | "intermediate" | "advanced";
type Tier = "course" | "course_ai";

interface ProfileRow {
  id: string;
  email: string | null;
  level: Level;
  display_name?: string | null;
  nationality_flag?: string | null;
  nationality_name?: string | null;
  nationality_code?: string | null;
  created_at?: string;
}
interface SubRow {
  tier: Tier;
  status: string;
  amount?: number | null;
  created_at?: string;
}

const ARAB_COUNTRIES = [
  { code: "AE", name: "الإمارات", flag: "🇦🇪" },
  { code: "SA", name: "السعودية", flag: "🇸🇦" },
  { code: "KW", name: "الكويت", flag: "🇰🇼" },
  { code: "QA", name: "قطر", flag: "🇶🇦" },
  { code: "BH", name: "البحرين", flag: "🇧🇭" },
  { code: "OM", name: "عُمان", flag: "🇴🇲" },
  { code: "EG", name: "مصر", flag: "🇪🇬" },
  { code: "JO", name: "الأردن", flag: "🇯🇴" },
  { code: "LB", name: "لبنان", flag: "🇱🇧" },
  { code: "IQ", name: "العراق", flag: "🇮🇶" },
  { code: "SY", name: "سوريا", flag: "🇸🇾" },
  { code: "YE", name: "اليمن", flag: "🇾🇪" },
  { code: "LY", name: "ليبيا", flag: "🇱🇾" },
  { code: "TN", name: "تونس", flag: "🇹🇳" },
  { code: "DZ", name: "الجزائر", flag: "🇩🇿" },
  { code: "MA", name: "المغرب", flag: "🇲🇦" },
  { code: "SD", name: "السودان", flag: "🇸🇩" },
  { code: "PS", name: "فلسطين", flag: "🇵🇸" },
  { code: "MR", name: "موريتانيا", flag: "🇲🇷" },
  { code: "SO", name: "الصومال", flag: "🇸🇴" },
  { code: "DJ", name: "جيبوتي", flag: "🇩🇯" },
  { code: "KM", name: "جزر القمر", flag: "🇰🇲" },
];

export default function AccountPanel() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [sub, setSub] = useState<SubRow | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      void reload();
    };
    window.addEventListener("cours:open-account", onOpen);
    return () => window.removeEventListener("cours:open-account", onOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reload = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const [{ data: p }, { data: s }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle(),
      supabase.from("subscriptions").select("*").eq("user_id", session.user.id).eq("status", "active").maybeSingle(),
    ]);
    setProfile((p as ProfileRow) ?? null);
    setSub((s as SubRow) ?? null);
  };

  if (!open) return null;

  const name = profile?.display_name || profile?.email?.split("@")[0] || "طالب كورسي";
  const firstLetter = (name[0] ?? "ك").toUpperCase();
  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString("ar-EG", { month: "long", year: "numeric" }) : "";

  const toggleItem = (id: string) => setExpanded((e) => (e === id ? null : id));

  const handleLogout = async () => {
    await supabase.auth.signOut();
    close();
    navigate({ to: "/login" });
  };

  return (
    <>
      <div className="panel-overlay" onClick={close} />
      <aside className={`account-panel open`} style={{ fontFamily: font, direction: "rtl" }}>
        <div className="panel-header">
          <div className="drawer-handle" />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 16px 16px" }}>
            <strong style={{ color: "var(--text-primary)", fontSize: 16 }}>حسابي</strong>
            <button onClick={close} aria-label="إغلاق" style={{ background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: 22, cursor: "pointer" }}>×</button>
          </div>
        </div>

        {/* User Info */}
        <div style={{ margin: 16, background: "linear-gradient(160deg, rgba(123,53,192,0.08), rgba(64,200,200,0.05))", border: "1px solid rgba(123,53,192,0.2)", borderRadius: 14, padding: 18, textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #7B35C0, #40C8C8)", color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 22 }}>
            {firstLetter}
          </div>
          <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 16, marginTop: 8 }}>{name}</div>
          {profile?.nationality_flag && (
            <div style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 2 }}>{profile.nationality_flag} {profile.nationality_name}</div>
          )}
          {memberSince && <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 6 }}>عضو منذ {memberSince}</div>}
        </div>

        {/* Current course */}
        <div style={{ padding: "0 16px" }}>
          <SectionLabel>✦ كورسي الحالي</SectionLabel>
          <button onClick={() => { close(); navigate({ to: "/course/ai" }); }} style={ctaButtonStyle}>تابع كورسك ←</button>
        </div>

        {/* Settings */}
        <div style={{ padding: "0 16px" }}>
          <SectionLabel>✦ إعدادات الحساب</SectionLabel>

          <PanelItem icon="✏️" label="تغيير الاسم المعروض" open={expanded === "name"} onClick={() => toggleItem("name")}>
            <DisplayNameForm currentName={profile?.display_name ?? ""} onSaved={reload} />
          </PanelItem>

          <PanelItem icon="🏳️" label="تغيير الجنسية" open={expanded === "nat"} onClick={() => toggleItem("nat")}>
            <NationalityPicker profile={profile} onSaved={reload} />
          </PanelItem>

          <PanelItem icon="🔐" label="تغيير كلمة المرور" open={expanded === "pwd"} onClick={() => toggleItem("pwd")}>
            <PasswordForm />
          </PanelItem>

          <PanelItem icon="📧" label="تغيير البريد الإلكتروني" open={expanded === "email"} onClick={() => toggleItem("email")}>
            <EmailForm />
          </PanelItem>

          <PanelItem icon="🌙" label={`${theme === "dark" ? "الوضع الليلي" : "الوضع النهاري"} مفعّل`} onClick={toggleTheme} />
        </div>

        {/* Subscription */}
        <div style={{ padding: "0 16px" }}>
          <SectionLabel>✦ الاشتراك والفواتير</SectionLabel>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: 14, marginBottom: 10 }}>
            <Row label="الباقة" value={sub?.tier === "course_ai" ? "كورس + مساعد AI" : "كورس"} />
            <Row label="المستوى" value={profile?.level === "advanced" ? "متقدم" : profile?.level === "intermediate" ? "متوسط" : "مبتدئ"} />
            <Row label="الحالة" value={<span style={{ color: "#3DD6A0" }}>{sub?.status === "active" ? "نشط ✓" : sub?.status ?? "—"}</span>} />
          </div>
          <PanelItem icon="⬆️" label="ترقية المستوى" onClick={() => { close(); toast.info("صفحة الدفع قيد التطوير"); }} />
        </div>

        {/* Support */}
        <div style={{ padding: "0 16px" }}>
          <SectionLabel>✦ المساعدة والدعم</SectionLabel>
          <PanelItem icon="💬" label="تواصل مع الدعم" onClick={() => { window.location.href = "mailto:support@coursi.ai"; }} />
          <PanelItem icon="📋" label="الشروط والأحكام" onClick={() => window.open("https://coursi.ai/terms", "_blank")} />
          <PanelItem icon="🔒" label="سياسة الخصوصية" onClick={() => window.open("https://coursi.ai/privacy", "_blank")} />
        </div>

        <button onClick={handleLogout} style={{ margin: "20px 16px 40px", padding: "14px", background: "transparent", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: 50, fontFamily: font, fontWeight: 700, cursor: "pointer", display: "block", width: "calc(100% - 32px)" }}>
          🚪 تسجيل الخروج
        </button>
      </aside>
    </>
  );
}

const ctaButtonStyle: React.CSSProperties = {
  width: "100%",
  background: "linear-gradient(135deg, #7B35C0, #40C8C8)",
  color: "white",
  border: "none",
  padding: "12px",
  borderRadius: 50,
  fontFamily: font,
  fontWeight: 700,
  cursor: "pointer",
  marginTop: 10,
};

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div style={{ color: "var(--accent-purple-text)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, margin: "18px 0 10px" }}>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13, color: "var(--text-secondary)" }}>
      <span>{label}</span>
      <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{value}</span>
    </div>
  );
}

interface PanelItemProps {
  icon: string;
  label: string;
  onClick?: () => void;
  open?: boolean;
  children?: ReactNode;
}
function PanelItem({ icon, label, onClick, open, children }: PanelItemProps) {
  return (
    <div style={{ marginBottom: 8 }}>
      <button onClick={onClick} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text-primary)", fontFamily: font, fontSize: 14, cursor: "pointer", direction: "rtl" }}>
        <span><span style={{ marginLeft: 8 }}>{icon}</span>{label}</span>
        <span style={{ color: "var(--text-muted)" }}>{open ? "▾" : "‹"}</span>
      </button>
      {open && children && <div className="panel-inline-form">{children}</div>}
    </div>
  );
}

function DisplayNameForm({ currentName, onSaved }: { currentName: string; onSaved: () => void }) {
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSaving(false); return; }
    const { error } = await supabase.from("profiles").update({ display_name: name }).eq("id", session.user.id);
    setSaving(false);
    if (error) toast.error("تعذّر الحفظ");
    else { toast.success("تم الحفظ ✓"); onSaved(); }
  };
  return (
    <>
      <input className="panel-input" placeholder="اسم العرض بالعربية" value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={save} disabled={saving} style={ctaButtonStyle}>{saving ? "جاري الحفظ..." : "حفظ"}</button>
    </>
  );
}

function NationalityPicker({ profile, onSaved }: { profile: ProfileRow | null; onSaved: () => void }) {
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [nationalityOpen, setNationalityOpen] = useState(false);
  const [selectedNationality, setSelectedNationality] = useState(profile?.nationality_code || "");

  useEffect(() => {
    setSelectedNationality(profile?.nationality_code || "");
  }, [profile?.nationality_code]);

  useEffect(() => {
    if (!nationalityOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNationalityOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [nationalityOpen]);

  const selectedCountry = ARAB_COUNTRIES.find((country) => country.code === selectedNationality);

  const handleSelectCountry = async (country: typeof ARAB_COUNTRIES[number]) => {
    setSelectedNationality(country.code);
    setNationalityOpen(false);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { error } = await supabase.from("profiles").update({
      nationality_code: country.code,
      nationality_name: country.name,
      nationality_flag: country.flag,
    }).eq("id", session.user.id);
    if (error) toast.error("تعذّر الحفظ");
    else { toast.success("تم تحديث الجنسية بنجاح ✓"); onSaved(); }
  };
  return (
    <div className="custom-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className="dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded={nationalityOpen}
        onClick={() => setNationalityOpen((isOpen) => !isOpen)}
      >
        <span>{selectedCountry ? `${selectedCountry.flag} ${selectedCountry.name}` : "اختر جنسيتك"}</span>
        <span aria-hidden="true">▾</span>
      </button>

      {nationalityOpen && (
        <div className="dropdown-list" role="listbox">
          {ARAB_COUNTRIES.map((country) => (
          <button
            type="button"
            key={country.code}
            className="dropdown-option"
            role="option"
            aria-selected={country.code === selectedNationality}
            onClick={() => handleSelectCountry(country)}
          >
            <span>{country.flag}</span>
            <span>{country.name}</span>
          </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PasswordForm() {
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const save = async () => {
    if (pwd.length < 6) { toast.error("كلمة المرور قصيرة"); return; }
    if (pwd !== confirm) { toast.error("كلمتا المرور غير متطابقتين"); return; }
    const { error } = await supabase.auth.updateUser({ password: pwd });
    if (error) toast.error(error.message); else toast.success("تم تغيير كلمة المرور ✓");
  };
  return (
    <>
      <input className="panel-input" type="password" placeholder="كلمة المرور الجديدة" value={pwd} onChange={(e) => setPwd(e.target.value)} />
      <input className="panel-input" type="password" placeholder="تأكيد كلمة المرور" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      <button onClick={save} style={ctaButtonStyle}>حفظ</button>
    </>
  );
}

function EmailForm() {
  const [email, setEmail] = useState("");
  const save = async () => {
    if (!email.includes("@")) { toast.error("بريد غير صحيح"); return; }
    const { error } = await supabase.auth.updateUser({ email });
    if (error) toast.error(error.message); else toast.success("تم إرسال رابط التأكيد ✓");
  };
  return (
    <>
      <input className="panel-input" type="email" placeholder="البريد الجديد" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button onClick={save} style={ctaButtonStyle}>إرسال</button>
    </>
  );
}
