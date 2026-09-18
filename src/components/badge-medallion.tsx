import { LockKeyhole } from "lucide-react";
import { useId, type CSSProperties } from "react";
import { LEVEL_ACCENT, LEVEL_LABEL, type Level } from "@/lib/certificate";

const paper = "#FAF9F4";

export const BADGE_NODE_POSITIONS: Record<Level, Array<[number, number]>> = {
  beginner: [[0, 0]],
  intermediate: [[0, -20], [-23, 17], [23, 17]],
  advanced: [[0, -27], [-27, -7], [27, -7], [-19, 25], [19, 25], [0, 5]],
};

export const BADGE_NODE_LINKS: Record<Level, Array<[number, number]>> = {
  beginner: [],
  intermediate: [[0, 1], [0, 2], [1, 2]],
  advanced: [[0, 1], [0, 2], [1, 5], [2, 5], [1, 3], [2, 4], [3, 5], [4, 5], [3, 4]],
};

interface BadgeMedallionProps {
  level: Level;
  locked?: boolean;
  size?: number | string;
  className?: string;
  style?: CSSProperties;
}

export function BadgeMedallion({ level, locked = false, size = 96, className, style }: BadgeMedallionProps) {
  const accent = LEVEL_ACCENT[level];
  const nodes = BADGE_NODE_POSITIONS[level];
  const reactId = useId().replace(/:/g, "");
  const uid = `badge-${level}-${reactId}`;

  return (
    <div
      className={className}
      role="img"
      aria-label={`${LEVEL_LABEL[level]}${locked ? " — مقفل" : ""}`}
      style={{ width: size, height: size, flex: "0 0 auto", position: "relative", ...style }}
    >
      <svg
        viewBox="0 0 180 180"
        aria-hidden="true"
        style={{ width: "100%", height: "100%", display: "block", filter: locked ? "grayscale(1) saturate(0)" : undefined, opacity: locked ? 0.62 : 1 }}
      >
        <defs>
          <radialGradient id={`${uid}-face`} cx="36%" cy="28%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="24%" stopColor={accent} />
            <stop offset="100%" stopColor="#28212E" />
          </radialGradient>
          <filter id={`${uid}-glow`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id={`${uid}-shadow`} x="-35%" y="-35%" width="170%" height="170%">
            <feDropShadow dx="0" dy="5" stdDeviation="7" floodColor={locked ? "#404047" : accent} floodOpacity=".55" />
          </filter>
        </defs>
        <g filter={`url(#${uid}-shadow)`}>
          <circle cx="90" cy="90" r="76" fill={`url(#${uid}-face)`} stroke={accent} strokeWidth="5" />
          <circle cx="90" cy="90" r="68" fill="none" stroke={paper} strokeOpacity=".58" strokeWidth="2" />
          <circle cx="90" cy="90" r="61" fill="none" stroke={accent} strokeWidth="2" />
          <circle cx="90" cy="90" r="55" fill="none" stroke={paper} strokeOpacity=".38" strokeWidth="1" strokeDasharray="2 3" />
          {BADGE_NODE_LINKS[level].map(([from, to]) => {
            const start = nodes[from];
            const end = nodes[to];
            if (!start || !end) return null;
            return <line key={`${from}-${to}`} x1={90 + start[0]} y1={90 + start[1]} x2={90 + end[0]} y2={90 + end[1]} stroke={paper} strokeWidth="4" />;
          })}
          {nodes.map(([x, y], index) => (
            <circle key={index} cx={90 + x} cy={90 + y} r="9" fill={paper} stroke="#2B2430" strokeWidth="2" filter={`url(#${uid}-glow)`} />
          ))}
        </g>
      </svg>
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
