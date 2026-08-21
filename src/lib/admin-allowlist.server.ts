// Server-only admin allowlist. Override with the ADMIN_EMAILS env var
// (comma-separated) without touching code.

const FALLBACK = ["qasimalrijjal@gmail.com", "info@coursi.ai", "support@coursi.ai"];

export function adminEmails(): string[] {
  const raw = process.env["ADMIN_EMAILS"];
  const list = raw
    ? raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    : FALLBACK;
  return list.map((e) => e.toLowerCase());
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return adminEmails().includes(email.trim().toLowerCase());
}
