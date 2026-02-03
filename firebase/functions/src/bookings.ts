import type { CallableRequest } from "firebase-functions/v2/https";

export async function createBooking(_req: CallableRequest) {
  return { ok: true, message: "createBooking not implemented" };
}

export async function cancelBooking(_req: CallableRequest) {
  return { ok: true, message: "cancelBooking not implemented" };
}

export async function completeBooking(_req: CallableRequest) {
  return { ok: true, message: "completeBooking not implemented" };
}
