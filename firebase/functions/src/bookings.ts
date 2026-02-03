import type { CallableRequest } from "firebase-functions/v2/https";

import { computeAuditHash, writeOnChainAuditLogPlaceholder } from "./audit";

export async function createBooking(_req: CallableRequest) {
  const hash = computeAuditHash({ action: "create_booking" });
  writeOnChainAuditLogPlaceholder(hash);
  return { ok: true, message: "createBooking not implemented", auditHash: hash };
}

export async function cancelBooking(_req: CallableRequest) {
  const hash = computeAuditHash({ action: "cancel_booking" });
  writeOnChainAuditLogPlaceholder(hash);
  return { ok: true, message: "cancelBooking not implemented", auditHash: hash };
}

export async function completeBooking(_req: CallableRequest) {
  const hash = computeAuditHash({ action: "complete_booking" });
  writeOnChainAuditLogPlaceholder(hash);
  return { ok: true, message: "completeBooking not implemented", auditHash: hash };
}
