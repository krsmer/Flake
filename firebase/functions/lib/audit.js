import { createHash } from "node:crypto";
export function computeAuditHash(input) {
    const payload = JSON.stringify(input);
    return createHash("sha256").update(payload).digest("hex");
}
export function writeOnChainAuditLogPlaceholder(_hash) {
    // Placeholder: integrate on-chain write (Sepolia) later.
    return { ok: true, txHash: null };
}
