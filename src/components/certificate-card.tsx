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
import { CERTIFICATE_TEMPLATE } from "@/lib/certificate-assets";
import { isNative, saveFile } from "@/lib/native";

const arabicFont = "Cairo, 'Noto Sans Arabic', sans-serif";
const paper = "#FAF9F4";
const ink = "#242127";

export interface CertificateData {
  level: Level;
  userName: string;
  date: Date;
  certId: string;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Certificate template failed to load"));
    image.src = src;
  });
}

async function renderCertificate(data: CertificateData): Promise<HTMLCanvasElement> {
  const width = 2336;
  const height = 1744;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable");

  const [template] = await Promise.all([
    loadImage(CERTIFICATE_TEMPLATE[data.level]),
    document.fonts.load("900 74px Cairo").catch(() => []),
    document.fonts.load("600 30px Cairo").catch(() => []),
    document.fonts.ready.catch(() => undefined),
  ]);

  context.drawImage(template, 0, 0, width, height);
  context.textAlign = "center";
  context.direction = "rtl";
  context.fillStyle = ink;
  context.font = `900 76px ${arabicFont}`;
  context.fillText(data.userName, width / 2, 905, 1120);

  context.direction = "ltr";
  context.font = `600 31px ${arabicFont}`;
  context.fillText(arabicDate(data.date), 828, 1392, 430);

  context.textAlign = "left";
  context.fillStyle = "#686269";
  context.font = "500 23px Arial, sans-serif";
  context.fillText(data.certId, 260, 1594);
  return canvas;
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
      await saveFile({ fileName: `${certId}.png`, dataUrl: canvas.toDataURL("image/png"), title: `شهادة ${LEVEL_LABEL[level]}` });
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
      if (isNative()) {
        await saveFile({ fileName: `${certId}.png`, dataUrl: imageUrl, title: `شهادة ${LEVEL_LABEL[level]}` });
        toast.success("تم حفظ الشهادة 🎉");
        return;
      }
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
  return (
    <div
      role="img"
      aria-label={`شهادة ${LEVEL_LABEL[level]} باسم ${userName}. ${LEVEL_STATEMENT[level]}`}
      style={{ aspectRatio: "2336 / 1744", position: "relative", overflow: "hidden", containerType: "inline-size", background: paper }}
    >
      <img src={CERTIFICATE_TEMPLATE[level]} alt="" draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "fill", display: "block" }} />
      <div dir="rtl" style={{ position: "absolute", top: "47.2%", left: "24%", right: "24%", color: ink, fontFamily: arabicFont, fontSize: "4.25cqw", fontWeight: 900, lineHeight: 1.2, textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userName}</div>
      <div dir="ltr" style={{ position: "absolute", left: "25.2%", width: "20.5%", top: "78.5%", color: ink, fontFamily: arabicFont, fontSize: "1.72cqw", fontWeight: 600, textAlign: "center" }}>{arabicDate(date)}</div>
      <div dir="ltr" style={{ position: "absolute", left: "11.1%", bottom: "8.1%", color: "#686269", fontFamily: "Arial, sans-serif", fontSize: "1.15cqw", fontWeight: 500 }}>{certId}</div>
    </div>
  );
}