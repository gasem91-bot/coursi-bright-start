import { LockKeyhole } from "lucide-react";
import { useId, type CSSProperties } from "react";
import { LEVEL_LABEL, type Level } from "@/lib/certificate";
import { BADGE_IMAGE } from "@/lib/certificate-assets";

interface BadgeMedallionProps {
  level: Level;
  locked?: boolean;
  size?: number | string;
  className?: string;
  style?: CSSProperties;
}

export function BadgeMedallion({ level, locked = false, size = 96, className, style }: BadgeMedallionProps) {
  const reactId = useId().replace(/:/g, "");
  const labelId = `badge-${level}-${reactId}`;

  return (
    <div
      className={className}
      role="img"
      aria-label={`${LEVEL_LABEL[level]}${locked ? " — مقفل" : ""}`}
      aria-labelledby={labelId}
      style={{ width: size, height: size, flex: "0 0 auto", position: "relative", ...style }}
    >
      <span id={labelId} style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0 }}>
        {`${LEVEL_LABEL[level]}${locked ? " — مقفل" : ""}`}
      </span>
      <img
        src={BADGE_IMAGE[level]}
        alt=""
        aria-hidden="true"
        draggable={false}
        data-medallion-artwork={`glossy-3d-${level}`}
        style={{ width: "100%", height: "100%", display: "block", objectFit: "contain", filter: locked ? "grayscale(1) saturate(0)" : undefined, opacity: locked ? 0.62 : 1 }}
      />
      {locked && (
        <span
          aria-hidden="true"
          style={{ position: "absolute", right: "4%", bottom: "4%", width: "31%", height: "31%", borderRadius: "50%", background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-secondary)", display: "grid", placeItems: "center", boxShadow: "0 4px 12px color-mix(in srgb, var(--bg-primary) 65%, transparent)" }}
        >
          <LockKeyhole style={{ width: "54%", height: "54%" }} strokeWidth={2.4} />
        </span>
      )}
    </div>
  );
}
