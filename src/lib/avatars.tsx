// Preset avatars: original simple illustrations, inline SVG, brand palette.
// Saved as profiles.avatar_id; null/unknown falls back to DEFAULT_AVATAR_ID.

const TEAL = "#40C8C8";
const PURPLE = "#7B35C0";
const MINT = "#3DD6A0";
const DARK = "#14121C";
const SKIN = ["#F2C9A0", "#D9A577", "#B07A50", "#8A5A3A"];

type Spec = { bg: string; skin: string; hair: string; style: "short" | "long" | "hijab" | "cap" | "curly" | "bald" | "bun" | "ghutra" | "bot" | "spiky"; glasses?: boolean; beard?: boolean };

const SPECS: Record<string, Spec> = {
  a1: { bg: TEAL, skin: SKIN[0], hair: DARK, style: "short" },
  a2: { bg: PURPLE, skin: SKIN[1], hair: MINT, style: "hijab" },
  a3: { bg: MINT, skin: SKIN[2], hair: DARK, style: "curly", glasses: true },
  a4: { bg: PURPLE, skin: SKIN[0], hair: "#5A3A22", style: "long" },
  a5: { bg: TEAL, skin: SKIN[3], hair: DARK, style: "bald", beard: true },
  a6: { bg: MINT, skin: SKIN[1], hair: PURPLE, style: "hijab", glasses: true },
  a7: { bg: PURPLE, skin: SKIN[2], hair: TEAL, style: "cap" },
  a8: { bg: TEAL, skin: SKIN[0], hair: "#F5F5F5", style: "ghutra", beard: true },
  a9: { bg: MINT, skin: SKIN[3], hair: DARK, style: "bun" },
  a10: { bg: PURPLE, skin: SKIN[1], hair: DARK, style: "spiky", glasses: true },
  a11: { bg: TEAL, skin: "#BFC7D5", hair: PURPLE, style: "bot" },
  a12: { bg: MINT, skin: SKIN[2], hair: "#3B2416", style: "short", beard: true },
};

export const AVATAR_IDS = Object.keys(SPECS);
export const DEFAULT_AVATAR_ID = "a1";

function hairShape(s: Spec) {
  switch (s.style) {
    case "short": return <path d="M30 44c0-14 10-22 20-22s20 8 20 22c-4-6-10-9-20-9s-16 3-20 9z" fill={s.hair} />;
    case "long": return <path d="M28 70V44c0-14 10-22 22-22s22 8 22 22v26h-8V46c-4-5-8-7-14-7s-10 2-14 7v24z" fill={s.hair} />;
    case "curly": return <g fill={s.hair}>{[32, 40, 50, 60, 68].map((x) => <circle key={x} cx={x} cy={32} r={8} />)}</g>;
    case "bun": return <g fill={s.hair}><circle cx={50} cy={20} r={8} /><path d="M30 44c0-14 10-20 20-20s20 6 20 20c-6-5-12-7-20-7s-14 2-20 7z" /></g>;
    case "spiky": return <path d="M30 42l4-14 6 8 4-12 6 10 6-10 4 12 6-8 4 14c-6-5-12-7-20-7s-14 2-20 7z" fill={s.hair} />;
    case "cap": return <g fill={s.hair}><path d="M30 42c0-12 9-20 20-20s20 8 20 20z" /><rect x={48} y={38} width={28} height={5} rx={2.5} /></g>;
    case "hijab": return <path d="M24 86V48c0-16 12-28 26-28s26 12 26 28v38H64V50c0-8-6-14-14-14s-14 6-14 14v36z" fill={s.hair} />;
    case "ghutra": return <g><path d="M24 80V46c0-14 12-24 26-24s26 10 26 24v34H66V48c-4-6-10-9-16-9s-12 3-16 9v32z" fill={s.hair} /><rect x={30} y={30} width={40} height={5} rx={2.5} fill={DARK} /></g>;
    default: return null;
  }
}

export function AvatarSvg({ id, size = 44, title }: { id?: string | null; size?: number; title?: string }) {
  const s = SPECS[id ?? ""] ?? SPECS[DEFAULT_AVATAR_ID];
  const isBot = s.style === "bot";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={title ?? "الصورة الرمزية"} style={{ display: "block", borderRadius: "50%" }}>
      <circle cx={50} cy={50} r={50} fill={DARK} />
      <circle cx={50} cy={50} r={46} fill={s.bg} opacity={0.9} />
      <path d="M18 100c2-18 15-28 32-28s30 10 32 28z" fill={isBot ? s.hair : DARK} opacity={isBot ? 1 : 0.85} />
      {s.style === "hijab" || s.style === "ghutra" ? hairShape(s) : null}
      {isBot ? (
        <g>
          <rect x={30} y={30} width={40} height={36} rx={10} fill={s.skin} />
          <line x1={50} y1={30} x2={50} y2={20} stroke={s.skin} strokeWidth={3} />
          <circle cx={50} cy={18} r={4} fill={MINT} />
          <circle cx={41} cy={47} r={5} fill={DARK} />
          <circle cx={59} cy={47} r={5} fill={DARK} />
          <rect x={42} y={56} width={16} height={3} rx={1.5} fill={DARK} />
        </g>
      ) : (
        <g>
          <ellipse cx={50} cy={50} rx={18} ry={20} fill={s.skin} />
          {s.style !== "hijab" && s.style !== "ghutra" ? hairShape(s) : null}
          <circle cx={43} cy={50} r={2.4} fill={DARK} />
          <circle cx={57} cy={50} r={2.4} fill={DARK} />
          <path d="M44 59c3 3 9 3 12 0" stroke={DARK} strokeWidth={2.2} fill="none" strokeLinecap="round" />
          {s.beard && <path d="M33 54c2 14 8 18 17 18s15-4 17-18c-4 6-9 8-17 8s-13-2-17-8z" fill={DARK} opacity={0.8} />}
          {s.glasses && (
            <g stroke={DARK} strokeWidth={1.8} fill="none">
              <circle cx={43} cy={50} r={5} />
              <circle cx={57} cy={50} r={5} />
              <line x1={48} y1={50} x2={52} y2={50} />
            </g>
          )}
        </g>
      )}
    </svg>
  );
}
