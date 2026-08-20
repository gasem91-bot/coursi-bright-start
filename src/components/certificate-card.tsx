import { useRef, useState } from "react";
import { toast } from "sonner";
import arabicLogo from "@/assets/arabic-logo.png.asset.json";
import {
  arabicDate,
  certificateId,
  courseName,
  LEVEL_ACCENT,
  LEVEL_LABEL,
  type Level,
} from "@/lib/certificate";

const font = "Cairo, 'Noto Sans Arabic', sans-serif";

export interface CertificateData {
  level: Level;
  userName: string;
  date: Date;
  certId: string;
}

/* ---------- canvas rendering ---------- */

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function renderCertificate(data: CertificateData): Promise<HTMLCanvasElement> {
  const W = 1600;
  const H = 1131;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  try {
    await Promise.all([
      document.fonts.load("900 64px Cairo"),
      document.fonts.load("700 34px Cairo"),
      document.fonts.load("400 26px Cairo"),
      document.fonts.ready,
    ]);
  } catch {
    /* fonts best-effort */
  }

  const accent = LEVEL_ACCENT[data.level];

  // Background
  ctx.fillStyle = "#060410";
  ctx.fillRect(0, 0, W, H);

  // Soft brand glows
  const glow1 = ctx.createRadialGradient(220, 160, 0, 220, 160, 620);
  glow1.addColorStop(0, "rgba(123,53,255,0.28)");
  glow1.addColorStop(1, "rgba(123,53,255,0)");
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, W, H);
  const glow2 = ctx.createRadialGradient(W - 200, H - 140, 0, W - 200, H - 140, 620);
  glow2.addColorStop(0, "rgba(0,212,200,0.22)");
  glow2.addColorStop(1, "rgba(0,212,200,0)");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, W, H);

  // Gradient frame
  const frame = ctx.createLinearGradient(60, 60, W - 60, H - 60);
  frame.addColorStop(0, "#7B35FF");
  frame.addColorStop(0.5, accent);
  frame.addColorStop(1, "#00D4C8");
  ctx.strokeStyle = frame;
  ctx.lineWidth = 6;
  roundRect(ctx, 48, 48, W - 96, H - 96, 34);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  roundRect(ctx, 74, 74, W - 148, H - 148, 24);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.direction = "rtl";

  // Logo
  const logo = await loadImage(arabicLogo.url);
  if (logo) {
    const lw = 260;
    const lh = (logo.height / logo.width) * lw;
    ctx.drawImage(logo, W / 2 - lw / 2, 120, lw, lh);
  } else {
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `900 54px ${font}`;
    ctx.fillText("COURSI", W / 2, 190);
  }

  // Heading
  ctx.fillStyle = accent;
  ctx.font = `800 28px ${font}`;
  ctx.fillText("شهادة إتمام", W / 2, 330);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = `900 52px ${font}`;
  ctx.fillText(LEVEL_LABEL[data.level], W / 2, 400);

  // Recipient
  ctx.fillStyle = "#B6AECC";
  ctx.font = `400 26px ${font}`;
  ctx.fillText("تُمنح هذه الشهادة إلى", W / 2, 480);

  const nameGrad = ctx.createLinearGradient(W / 2 - 400, 0, W / 2 + 400, 0);
  nameGrad.addColorStop(0, "#7B35FF");
  nameGrad.addColorStop(1, "#00D4C8");
  ctx.fillStyle = nameGrad;
  ctx.font = `900 68px ${font}`;
  ctx.fillText(data.userName, W / 2, 570);

  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 380, 605);
  ctx.lineTo(W / 2 + 380, 605);
  ctx.stroke();

  // Body
  ctx.fillStyle = "#CFC8DE";
  ctx.font = `500 30px ${font}`;
  ctx.fillText("لإكماله بنجاح جميع فصول دورة", W / 2, 675);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `700 34px ${font}`;
  ctx.fillText(courseName(data.level), W / 2, 730);

  // Footer meta
  const y = 900;
  ctx.font = `800 24px ${font}`;
  ctx.fillStyle = accent;
  ctx.fillText("تاريخ الإتمام", W / 2 + 380, y);
  ctx.fillText("رقم الشهادة", W / 2 - 380, y);
  ctx.fillStyle = "#E8E4F2";
  ctx.font = `500 26px ${font}`;
  ctx.fillText(arabicDate(data.date), W / 2 + 380, y + 46);
  ctx.direction = "ltr";
  ctx.fillText(data.certId, W / 2 - 380, y + 46);
  ctx.direction = "rtl";

  ctx.fillStyle = "#9590A8";
  ctx.font = `600 24px ${font}`;
  ctx.fillText("منصّة كورسي · COURSI.ai", W / 2, y + 30);

  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = `400 20px ${font}`;
  ctx.fillText("للتحقق من صحة الشهادة تواصل معنا عبر coursi.ai", W / 2, H - 110);

  return canvas;
}

/* ---------- component ---------- */

export default function CertificateCard({
  level,
  userName,
  userId,
  unlocked,
  completed,
  total,
  completedAt,
}: {
  level: Level;
  userName: string;
  userId: string;
  unlocked: boolean;
  completed: number;
  total: number;
  completedAt?: Date;
}) {
  const [busy, setBusy] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const accent = LEVEL_ACCENT[level];
  const certId = certificateId(userId, level);
  const date = completedAt ?? new Date();

  const build = () => renderCertificate({ level, userName, date, certId });

  const downloadPng = async () => {
    setBusy(true);
    try {
      const canvas = await build();
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${certId}.png`;
      a.click();
      toast.success("تم تحميل الشهادة 🎉");
    } catch {
      toast.error("تعذّر إنشاء الشهادة، حاول مرة أخرى");
    } finally {
      setBusy(false);
    }
  };

  const downloadPdf = async () => {
    setBusy(true);
    try {
      const canvas = await build();
      const url = canvas.toDataURL("image/png");
      const w = window.open("", "_blank");
      if (!w) {
        toast.error("افتح النوافذ المنبثقة لتحميل PDF");
        return;
      }
      w.document.write(
        `<html><head><title>${certId}</title><style>@page{size:A4 landscape;margin:0}html,body{margin:0;padding:0;background:#060410}img{width:100%;height:auto;display:block}</style></head><body><img src="${url}" onload="window.focus();window.print()" /></body></html>`,
      );
      w.document.close();
    } catch {
      toast.error("تعذّر إنشاء ملف PDF");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        background: unlocked
          ? `linear-gradient(160deg, ${accent}14, rgba(123,53,255,0.06))`
          : "var(--bg-card)",
        border: `1px solid ${unlocked ? `${accent}55` : "var(--border)"}`,
        borderRadius: 16,
        padding: 18,
        marginBottom: 12,
        fontFamily: font,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 30, opacity: unlocked ? 1 : 0.4 }}>{unlocked ? "🏆" : "🔒"}</div>
          <div>
            <div style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: 15 }}>
              شهادة {LEVEL_LABEL[level]}
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 3 }}>
              {unlocked ? (
                <span dir="ltr" style={{ letterSpacing: 1 }}>{certId}</span>
              ) : (
                `${completed}/${total} فصلاً — أكمل جميع الفصول لفتح الشهادة`
              )}
            </div>
          </div>
        </div>

        {unlocked ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={downloadPdf}
              disabled={busy}
              style={{
                background: `linear-gradient(135deg, #7B35FF, ${accent})`,
                color: "#fff",
                fontWeight: 800,
                fontSize: 13,
                padding: "10px 18px",
                borderRadius: 30,
                border: "none",
                cursor: busy ? "wait" : "pointer",
                fontFamily: font,
                opacity: busy ? 0.7 : 1,
              }}
            >
              ⬇ تحميل PDF
            </button>
            <button
              onClick={downloadPng}
              disabled={busy}
              style={{
                background: "transparent",
                color: accent,
                fontWeight: 700,
                fontSize: 13,
                padding: "10px 18px",
                borderRadius: 30,
                border: `1px solid ${accent}`,
                cursor: busy ? "wait" : "pointer",
                fontFamily: font,
                opacity: busy ? 0.7 : 1,
              }}
            >
              🖼 صورة PNG
            </button>
          </div>
        ) : (
          <div
            style={{
              color: "var(--text-muted)",
              fontSize: 12,
              border: "1px dashed var(--border)",
              borderRadius: 30,
              padding: "8px 16px",
            }}
          >
            قيد الإنجاز
          </div>
        )}
      </div>

      {!unlocked && (
        <div style={{ marginTop: 12, height: 6, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${total ? (completed / total) * 100 : 0}%`,
              background: `linear-gradient(90deg, #7B35FF, ${accent})`,
            }}
          />
        </div>
      )}

      {unlocked && (
        <div ref={previewRef} style={{ marginTop: 14, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
          <CertificatePreview level={level} userName={userName} certId={certId} date={date} />
        </div>
      )}
    </div>
  );
}

function CertificatePreview({
  level,
  userName,
  certId,
  date,
}: {
  level: Level;
  userName: string;
  certId: string;
  date: Date;
}) {
  const accent = LEVEL_ACCENT[level];
  return (
    <div
      style={{
        background: "#060410",
        padding: "26px 20px",
        textAlign: "center",
        direction: "rtl",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 10,
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.10)",
          pointerEvents: "none",
        }}
      />
      <img src={arabicLogo.url} alt="COURSI" style={{ height: 46, width: "auto", margin: "0 auto 10px", display: "block" }} />
      <div style={{ color: accent, fontSize: 11, fontWeight: 800, letterSpacing: 3 }}>شهادة إتمام</div>
      <div style={{ color: "#fff", fontWeight: 900, fontSize: 18, marginTop: 6 }}>{LEVEL_LABEL[level]}</div>
      <div style={{ color: "#B6AECC", fontSize: 11, marginTop: 12 }}>تُمنح هذه الشهادة إلى</div>
      <div
        style={{
          background: `linear-gradient(135deg, #7B35FF, ${accent})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          fontWeight: 900,
          fontSize: 26,
          padding: "6px 0",
        }}
      >
        {userName}
      </div>
      <div style={{ color: "#CFC8DE", fontSize: 12, maxWidth: 460, margin: "6px auto 0", lineHeight: 1.8 }}>
        لإكماله بنجاح جميع فصول دورة {courseName(level)}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, color: "#9590A8", fontSize: 10, padding: "0 12px" }}>
        <span dir="ltr">{certId}</span>
        <span>{arabicDate(date)}</span>
      </div>
    </div>
  );
}
