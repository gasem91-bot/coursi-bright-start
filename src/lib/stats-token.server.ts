import { createHash, timingSafeEqual } from "node:crypto";

export function matchesStatsToken(provided: string, expected: string | undefined): boolean {
  if (!expected || !provided) return false;
  // Fixed-size digests prevent differing token lengths from bypassing
  // the constant-time comparison. No token or digest is logged or returned.
  return timingSafeEqual(createHash("sha256").update(provided).digest(), createHash("sha256").update(expected).digest());
}