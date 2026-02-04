import { collections } from "./db.js";
export async function createSlot(req) {
    const data = (req.data ?? {});
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
    const slot = {
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
