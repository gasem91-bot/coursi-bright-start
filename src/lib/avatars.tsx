import avatar01 from "../../public/avatars/avatar-01.png.asset.json";
import avatar02 from "../../public/avatars/avatar-02.png.asset.json";
import avatar03 from "../../public/avatars/avatar-03.png.asset.json";
import avatar04 from "../../public/avatars/avatar-04.png.asset.json";
import avatar05 from "../../public/avatars/avatar-05.png.asset.json";
import avatar06 from "../../public/avatars/avatar-06.png.asset.json";
import avatar07 from "../../public/avatars/avatar-07.png.asset.json";
import avatar08 from "../../public/avatars/avatar-08.png.asset.json";
import avatar09 from "../../public/avatars/avatar-09.png.asset.json";
import avatar10 from "../../public/avatars/avatar-10.png.asset.json";
import avatar11 from "../../public/avatars/avatar-11.png.asset.json";
import avatar12 from "../../public/avatars/avatar-12.png.asset.json";

// Keep the original stored keys and picker order; every placement shares these managed images.
const AVATAR_ASSETS: Record<string, { url: string }> = {
  a1: avatar01,
  a2: avatar02,
  a3: avatar03,
  a4: avatar04,
  a5: avatar05,
  a6: avatar06,
  a7: avatar07,
  a8: avatar08,
  a9: avatar09,
  a10: avatar10,
  a11: avatar11,
  a12: avatar12,
};
export const AVATAR_IDS = Object.keys(AVATAR_ASSETS);
export const DEFAULT_AVATAR_ID = "a1";

// Retain the existing export so the picker, header and profile need no selection changes.
export function AvatarSvg({ id, size = 44, title }: { id?: string | null; size?: number; title?: string }) {
  const asset = AVATAR_ASSETS[id ?? ""] ?? avatar01;
  return <img src={asset.url} width={size} height={size} alt={title ?? "الصورة الرمزية"} className="block shrink-0 rounded-full object-cover" />;
}
