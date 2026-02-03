import type { CallableRequest } from "firebase-functions/v2/https";

export async function resolveExpiredBookings(_req: CallableRequest) {
  return { ok: true, message: "resolveExpiredBookings not implemented" };
}
