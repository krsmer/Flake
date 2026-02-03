import { createHash } from "node:crypto";

type AuditInput = Record<string, unknown>;

export function computeAuditHash(input: AuditInput): string {
  const payload = JSON.stringify(input);
  return createHash("sha256").update(payload).digest("hex");
}

export function writeOnChainAuditLogPlaceholder(_hash: string) {
  // Placeholder: integrate on-chain write (Sepolia) later.
  return { ok: true, txHash: null };
}
