import type { CallableRequest } from "firebase-functions/v2/https";

import { collections } from "./db";
import type { SlotDoc } from "./types";

export async function createSlot(req: CallableRequest) {
  const data = (req.data ?? {}) as Record<string, unknown>;
  const providerId = String(data.providerId || "");
  const serviceId = String(data.serviceId || "");
  const startTime = String(data.startTime || "");
  const endTime = String(data.endTime || "");

  if (!providerId || !serviceId || !startTime || !endTime) {
    throw new Error("Missing required fields");
  }

  const startMs = Date.parse(startTime);
  const endMs = Date.parse(endTime);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    throw new Error("Invalid startTime/endTime");
  }

  const now = new Date().toISOString();
  const slot: SlotDoc = {
    providerId,
    serviceId,
    startTime,
    endTime,
    status: "open",
    createdAt: now,
    updatedAt: now
  };

  const ref = await collections.slots().add(slot);
  return { ok: true, slotId: ref.id };
}
