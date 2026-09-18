import { useState } from "react";
import { toast } from "sonner";
import {
  arabicDate,
  certificateId,
  LEVEL_ACCENT,
  LEVEL_LABEL,
  LEVEL_STATEMENT,
  type Level,
} from "@/lib/certificate";

const arabicFont = "Cairo, 'Noto Sans Arabic', sans-serif";
const wordmarkFont = "'Six Caps', Impact, sans-serif";
const paper = "#FAF9F4";
const ink = "#242127";

export interface CertificateData {
  level: Level;
  userName: string;
  date: Date;
  certId: string;
}

const NODE_POSITIONS: Record<Level, Array<[number, number]>> = {
  beginner: [[0, 0]],
  intermediate: [[0, -20], [-23, 17], [23, 17]],
  advanced: [[0, -27], [-27, -7], [27, -7], [-19, 25], [19, 25], [0, 5]],
};

const NODE_LINKS: Record<Level, Array<[number, number]>> = {
  beginner: [],
  intermediate: [[0, 1], [0, 2], [1, 2]],
  advanced: [[0, 1], [0, 2], [1, 5], [2, 5], [1, 3], [2, 4], [3, 5], [4, 5], [3, 4]],
};

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  points: Array<[number, number]>,
  stroke: string,
  width: number,
  fill?: string,
) {
  ctx.beginPath();
  points.forEach(([x, y], index) => (index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.stroke();
}

function drawFrame(ctx: CanvasRenderingContext2D, accent: string, width: number, height: number) {
  const outer = [[54, 54], [width - 54, 54], [width - 54, height - 54], [54, height - 54]] as Array<[number, number]>;
  drawPolygon(ctx, outer, accent, 12);

  const cut = 46;
  const inset = 82;
  const inner = [
    [inset + cut, inset], [width - inset - cut, inset], [width - inset, inset + cut],
    [width - inset, height - inset - cut], [width - inset - cut, height - inset],
    [inset + cut, height - inset], [inset, height - inset - cut], [inset, inset + cut],
  ] as Array<[number, number]>;
  drawPolygon(ctx, inner, accent, 3);

  ctx.save();
  ctx.globalAlpha = 0.42;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1;
  for (let offset = 96; offset <= 116; offset += 5) {
    ctx.strokeRect(offset, offset, width - offset * 2, height - offset * 2);
  }
  ctx.restore();

  const corner = 82;
  const depth = 105;
  const corners: Array<Array<[number, number]>> = [
    [[54, 54], [54 + depth, 54], [54 + depth - corner, 82], [82, 82], [82, 54 + depth - corner]],
    [[width - 54, 54], [width - 54 - depth, 54], [width - 54 - depth + corner, 82], [width - 82, 82], [width - 82, 54 + depth - corner]],
    [[54, height - 54], [54 + depth, height - 54], [54 + depth - corner, height - 82], [82, height - 82], [82, height - 54 - depth + corner]],
    [[width - 54, height - 54], [width - 54 - depth, height - 54], [width - 54 - depth + corner, height - 82], [width - 82, height - 82], [width - 82, height - 54 - depth + corner]],
  ];
  corners.forEach((points) => drawPolygon(ctx, points, accent, 2, `${accent}24`));
}

function drawMedallion(ctx: CanvasRenderingContext2D, level: Level, cx: number, cy: number, radius: number) {
  const accent = LEVEL_ACCENT[level];
  ctx.save();
  ctx.shadowColor = `${accent}70`;
  ctx.shadowBlur = 28;
  const gradient = ctx.createRadialGradient(cx - radius * 0.28, cy - radius * 0.3, 4, cx, cy, radius);
  gradient.addColorStop(0, "#FFFFFF");
  gradient.addColorStop(0.18, accent);
  gradient.addColorStop(1, "#28212E");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  for (const scale of [0.88, 0.74]) {
    ctx.strokeStyle = scale === 0.88 ? paper : accent;
    ctx.globalAlpha = scale === 0.88 ? 0.65 : 1;
    ctx.lineWidth = scale === 0.88 ? 3 : 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * scale, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const nodeScale = radius / 68;
  const positions = NODE_POSITIONS[level].map(([x, y]) => [cx + x * nodeScale, cy + y * nodeScale] as [number, number]);
  ctx.strokeStyle = paper;
  ctx.lineWidth = 4 * nodeScale;
  NODE_LINKS[level].forEach(([from, to]) => {
    const start = positions[from];
    const end = positions[to];
    if (!start || !end) return;
    ctx.beginPath();
    ctx.moveTo(start[0], start[1]);
    ctx.lineTo(end[0], end[1]);
    ctx.stroke();
  });
  positions.forEach(([x, y]) => {
    const node = ctx.createRadialGradient(x - 3, y - 4, 1, x, y, 10 * nodeScale);
    node.addColorStop(0, "#FFFFFF");
    node.addColorStop(0.35, paper);
    node.addColorStop(1, accent);
    ctx.fillStyle = node;
    ctx.beginPath();
    ctx.arc(x, y, 10 * nodeScale, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#2B2430";
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

function drawAuthenticatedStamp(ctx: CanvasRenderingContext2D, accent: string, cx: number, cy: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = accent;
  ctx.fillStyle = accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 62, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 49, 0, Math.PI * 2);
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.direction = "ltr";
  ctx.font = `22px ${wordmarkFont}`;
  ctx.fillText("AUTHENTICATED", 0, -40);
  ctx.font = `52px ${wordmarkFont}`;
  ctx.fillText("COURS!", 0, 17);
  ctx.font = `16px ${wordmarkFont}`;
  ctx.fillText("COURSI.AI", 0, 42);
  ctx.restore();
}

async function renderCertificate(data: CertificateData): Promise<HTMLCanvasElement> {
  const width = 1600;
  const height = 1131;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable");

  try {
    await Promise.all([
      document.fonts.load("400 100px 'Six Caps'"),
      document.fonts.load("900 64px Cairo"),
      document.fonts.load("600 28px Cairo"),
      document.fonts.ready,
    ]);
  } catch {
    // Browser font loading is best-effort; fallbacks preserve the export.
  }

  const accent = LEVEL_ACCENT[data.level];
  context.fillStyle = paper;
  context.fillRect(0, 0, width, height);
  const wash = context.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.7);
  wash.addColorStop(0, "rgba(255,255,255,0.92)");
  wash.addColorStop(1, `${accent}0B`);
  context.fillStyle = wash;
  context.fillRect(0, 0, width, height);
  drawFrame(context, accent, width, height);

  context.textAlign = "center";
  context.direction = "ltr";
  context.fillStyle = ink;
  context.font = `400 96px ${wordmarkFont}`;
  context.fillText("COURS!", width / 2, 190);
  context.font = `500 19px Arial, sans-serif`;
  context.fillStyle = accent;
  context.fillText("ARTIFICIAL INTELLIGENCE", width / 2, 220);

  drawMedallion(context, data.level, width / 2, 320, 82);

  context.direction = "rtl";
  context.fillStyle = ink;
  context.font = `700 48px ${arabicFont}`;
  context.fillText("شهادة إتمام", width / 2, 452);
  context.font = `900 66px ${arabicFont}`;
  context.fillText(data.userName, width / 2, 550);
  context.strokeStyle = accent;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(width / 2 - 370, 575);
  context.lineTo(width / 2 + 370, 575);
  context.stroke();

  context.fillStyle = accent;
  context.font = `700 28px ${arabicFont}`;
  context.fillText(`${LEVEL_LABEL[data.level]} - الذكاء الاصطناعي`, width / 2, 628);
  context.fillStyle = ink;
  context.font = `600 27px ${arabicFont}`;
  context.fillText(LEVEL_STATEMENT[data.level], width / 2, 695);

  const metaY = 855;
  context.strokeStyle = `${accent}A8`;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(250, metaY);
  context.lineTo(585, metaY);
  context.moveTo(1015, metaY);
  context.lineTo(1350, metaY);
  context.stroke();
  context.fillStyle = ink;
  context.direction = "ltr";
  context.font = `600 25px ${arabicFont}`;
  context.fillText(arabicDate(data.date), 417, metaY - 16);
  context.fillText("Date Issued", 417, metaY + 34);
  context.font = `600 25px Arial, sans-serif`;
  context.fillText("Founder and CEO", 1182, metaY + 20);

  context.fillStyle = "#686269";
  context.font = `500 18px Arial, sans-serif`;
  context.textAlign = "left";
  context.fillText(data.certId, 130, height - 105);
  drawAuthenticatedStamp(context, accent, width - 178, height - 160);
  return canvas;
}

function NodeSeal({ level }: { level: Level }) {
  const accent = LEVEL_ACCENT[level];
  const nodes = NODE_POSITIONS[level];
  return (
    <svg viewBox="0 0 160 160" aria-hidden="true" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <radialGradient id={`seal-${level}`} cx="36%" cy="28%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="24%" stopColor={accent} />
          <stop offset="100%" stopColor="#28212E" />
        </radialGradient>
        <filter id={`glow-${level}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle cx="80" cy="80" r="70" fill={`url(#seal-${level})`} stroke={accent} strokeWidth="4" />
      <circle cx="80" cy="80" r="60" fill="none" stroke={paper} strokeOpacity=".68" strokeWidth="2" />
      <circle cx="80" cy="80" r="50" fill="none" stroke={accent} strokeWidth="2" />
      {NODE_LINKS[level].map(([from, to]) => {
        const start = nodes[from];
        const end = nodes[to];
        if (!start || !end) return null;
        return <line key={`${from}-${to}`} x1={80 + start[0]} y1={80 + start[1]} x2={80 + end[0]} y2={80 + end[1]} stroke={paper} strokeWidth="4" />;
      })}
      {nodes.map(([x, y], index) => (
        <circle key={index} cx={80 + x} cy={80 + y} r="9" fill={paper} stroke="#2B2430" strokeWidth="2" filter={`url(#glow-${level})`} />
      ))}
    </svg>
  );
}

function AuthenticatedStamp({ accent }: { accent: string }) {
  return (
    <div style={{ width: 74, height: 74, border: `2px solid ${accent}`, borderRadius: "50%", display: "grid", placeItems: "center", color: accent, position: "relative", fontFamily: wordmarkFont, lineHeight: 1 }}>
      <div style={{ position: "absolute", inset: 6, border: `1px solid ${accent}`, borderRadius: "50%" }} />
      <span style={{ position: "absolute", top: 9, fontSize: 9, letterSpacing: 1 }}>AUTHENTICATED</span>
      <strong style={{ fontSize: 26, fontWeight: 400 }}>COURS!</strong>
      <span style={{ position: "absolute", bottom: 9, fontSize: 8, letterSpacing: 1 }}>COURSI.AI</span>
    </div>
  );
}

export default function CertificateCard({
  level,
  userName,
  userId,
  unlocked,
  completed,
  total,
  completedAt,
  certIdOverride,
  lockedHint,
}: {
  level: Level;
  userName: string;
  userId: string;
  unlocked: boolean;
  completed: number;
  total: number;
  completedAt?: Date;
  certIdOverride?: string;
  examScore?: number;
  examTotal?: number;
  lockedHint?: string;
}) {
  const [busy, setBusy] = useState(false);
  const accent = LEVEL_ACCENT[level];
  const certId = certIdOverride ?? certificateId(userId, level);
  const date = completedAt ?? new Date();
  const build = () => renderCertificate({ level, userName, date, certId });

  const downloadPng = async () => {
    setBusy(true);
    try {
      const canvas = await build();
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${certId}.png`;
      link.click();
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
      const imageUrl = canvas.toDataURL("image/png");
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("افتح النوافذ المنبثقة لتحميل PDF");
        return;
      }
      printWindow.document.write(
        `<html><head><title>${certId}</title><style>@page{size:A4 landscape;margin:0}html,body{width:297mm;height:210mm;margin:0;background:${paper};overflow:hidden}img{width:297mm;height:210mm;object-fit:fill;display:block}</style></head><body><img src="${imageUrl}" onload="window.focus();window.print()" /></body></html>`,
      );
      printWindow.document.close();
    } catch {
      toast.error("تعذّر إنشاء ملف PDF");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ background: unlocked ? `linear-gradient(160deg, ${accent}14, rgba(123,53,255,0.06))` : "var(--bg-card)", border: `1px solid ${unlocked ? `${accent}55` : "var(--border)"}`, borderRadius: 8, padding: 18, marginBottom: 12, fontFamily: arabicFont }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 30, opacity: unlocked ? 1 : 0.4 }}>{unlocked ? "🏆" : "🔒"}</div>
          <div>
            <div style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: 15 }}>شهادة {LEVEL_LABEL[level]}</div>
            <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 3 }}>
              {unlocked ? <span dir="ltr">{certId}</span> : lockedHint ?? `${completed}/${total} فصلاً — أكمل جميع الفصول ثم اجتز الاختبار النهائي`}
            </div>
          </div>
        </div>
        {unlocked ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={downloadPdf} disabled={busy} style={{ background: accent, color: "#FFFFFF", fontWeight: 800, fontSize: 13, padding: "10px 18px", borderRadius: 30, border: "none", cursor: busy ? "wait" : "pointer", fontFamily: arabicFont, opacity: busy ? 0.7 : 1 }}>⬇ تحميل PDF</button>
            <button onClick={downloadPng} disabled={busy} style={{ background: "transparent", color: accent, fontWeight: 700, fontSize: 13, padding: "10px 18px", borderRadius: 30, border: `1px solid ${accent}`, cursor: busy ? "wait" : "pointer", fontFamily: arabicFont, opacity: busy ? 0.7 : 1 }}>🖼 صورة PNG</button>
          </div>
        ) : (
          <div style={{ color: "var(--text-muted)", fontSize: 12, border: "1px dashed var(--border)", borderRadius: 30, padding: "8px 16px" }}>قيد الإنجاز</div>
        )}
      </div>
      {!unlocked && (
        <div style={{ marginTop: 12, height: 6, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${total ? (completed / total) * 100 : 0}%`, background: accent, transition: "width 0.8s" }} />
        </div>
      )}
      {unlocked && (
        <div style={{ marginTop: 14, borderRadius: 4, overflow: "hidden", border: `1px solid ${accent}55` }}>
          <CertificatePreview level={level} userName={userName} certId={certId} date={date} />
        </div>
      )}
    </div>
  );
}

function CertificatePreview({ level, userName, certId, date }: CertificateData) {
  const accent = LEVEL_ACCENT[level];
  return (
    <div style={{ background: paper, color: ink, aspectRatio: "1.414 / 1", textAlign: "center", direction: "rtl", position: "relative", isolation: "isolate", containerType: "inline-size" }}>
      <div style={{ position: "absolute", inset: 12, border: `4px solid ${accent}`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 22, border: `1px solid ${accent}`, opacity: 0.7, pointerEvents: "none", clipPath: "polygon(5% 0,95% 0,100% 8%,100% 92%,95% 100%,5% 100%,0 92%,0 8%)" }} />
      <div style={{ position: "absolute", inset: 28, border: `1px double ${accent}`, opacity: 0.32, pointerEvents: "none" }} />

      <div style={{ position: "absolute", top: "6%", left: 0, right: 0, zIndex: 1 }}>
        <div dir="ltr" style={{ fontFamily: wordmarkFont, fontSize: "9cqw", lineHeight: 0.82, letterSpacing: 1 }}>COURS!</div>
        <div dir="ltr" style={{ color: accent, fontFamily: "Arial, sans-serif", fontSize: "1cqw", letterSpacing: 2, marginTop: "0.7cqw" }}>ARTIFICIAL INTELLIGENCE</div>
      </div>

      <div style={{ position: "absolute", width: "15cqw", height: "15cqw", left: "42.5%", top: "21%", zIndex: 1 }}><NodeSeal level={level} /></div>

      <div style={{ position: "absolute", top: "44%", left: "8%", right: "8%", zIndex: 1 }}>
        <div style={{ fontSize: "3.5cqw", fontWeight: 700 }}>{"شهادة إتمام"}</div>
        <div style={{ fontSize: "5.4cqw", fontWeight: 900, lineHeight: 1.3, maxWidth: "80%", margin: "0.2cqw auto 0", borderBottom: `1px solid ${accent}` }}>{userName}</div>
        <div style={{ color: accent, fontSize: "1.8cqw", fontWeight: 700, marginTop: "0.7cqw" }}>{LEVEL_LABEL[level]} - الذكاء الاصطناعي</div>
        <div style={{ fontSize: "1.55cqw", fontWeight: 600, marginTop: "1.25cqw", whiteSpace: "nowrap" }}>{LEVEL_STATEMENT[level]}</div>
      </div>

      <div dir="ltr" style={{ position: "absolute", left: "11%", right: "11%", bottom: "10%", zIndex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12cqw" }}>
        <div style={{ borderTop: `1px solid ${accent}`, paddingTop: "0.5cqw" }}>
          <div style={{ fontFamily: arabicFont, fontSize: "1.35cqw", fontWeight: 600 }}>{arabicDate(date)}</div>
          <div style={{ fontFamily: "Arial, sans-serif", fontSize: "1.1cqw", marginTop: "0.2cqw" }}>Date Issued</div>
        </div>
        <div style={{ borderTop: `1px solid ${accent}`, paddingTop: "1.6cqw" }}>
          <div style={{ fontFamily: "Arial, sans-serif", fontSize: "1.1cqw" }}>Founder and CEO</div>
        </div>
      </div>

      <div dir="ltr" style={{ position: "absolute", left: "4.5%", bottom: "3.7%", color: "#686269", fontFamily: "Arial, sans-serif", fontSize: "1cqw" }}>{certId}</div>
      <div style={{ position: "absolute", right: "4.5%", bottom: "2.5%", width: "8cqw", height: "8cqw", transformOrigin: "bottom right" }}><div style={{ transform: "scale(calc(8cqw / 74px))", transformOrigin: "top left" }}><AuthenticatedStamp accent={accent} /></div></div>
    </div>
  );
}