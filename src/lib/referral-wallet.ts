export type WalletStatus = "active" | "used" | "expired" | "cancelled";
export type WalletCode = {
  id: string; vertical: string; code: string; kind: "friend" | "reward";
  amount_cents: number; issued_at: string; expires_at: string;
  redeemed_at: string | null; cancelled_at: string | null; person: string;
};
export function walletStatus(row: Pick<WalletCode, "redeemed_at" | "cancelled_at" | "expires_at">, now = Date.now()): WalletStatus {
  if (row.redeemed_at) return "used";
  if (row.cancelled_at) return "cancelled";
  if (new Date(row.expires_at).getTime() <= now) return "expired";
  return "active";
}
export function availableCredit(rows: WalletCode[], vertical: string, now = Date.now()) {
  return rows.filter((r) => r.vertical === vertical && walletStatus(r, now) === "active")
    .reduce((sum, r) => sum + r.amount_cents, 0) / 100;
}