import { computeAuditHash, writeOnChainAuditLogPlaceholder } from "./audit.js";
import { collections, db } from "./db.js";
import { runYellowSettlement } from "./yellow.js";
export async function createBooking(_req) {
    const data = (_req.data ?? {});
    const providerId = String(data.providerId || "");
    const serviceId = String(data.serviceId || "");
    const customerWallet = String(data.customerWallet || "");
    const slotId = data.slotId ? String(data.slotId) : "";
    const depositAmountUsdc = String(data.depositAmountUsdc || "");
    const startTimeInput = data.startTime ? String(data.startTime) : "";
    const endTimeInput = data.endTime ? String(data.endTime) : "";
    const appSessionId = data.appSessionId ? String(data.appSessionId) : undefined;
    if (!providerId || !serviceId || !customerWallet || !depositAmountUsdc) {
        throw new Error("Missing required fields");
    }
    let startTime = "";
    let endTime = "";
    let slotRef = null;
    if (slotId) {
        slotRef = collections.slots().doc(slotId);
        const slotSnap = await slotRef.get();
        if (!slotSnap.exists) {
            throw new Error("Slot not found");
        }
        const slot = slotSnap.data();
        if (slot.status !== "open") {
            throw new Error("Slot is not available");
        }
        if (slot.providerId !== providerId || slot.serviceId !== serviceId) {
            throw new Error("Slot/provider/service mismatch");
        }
        startTime = slot.startTime;
        endTime = slot.endTime;
    }
    else {
        if (!startTimeInput || !endTimeInput) {
            throw new Error("Missing startTime/endTime");
        }
        startTime = startTimeInput;
        endTime = endTimeInput;
    }
    const startMs = Date.parse(startTime);
    const endMs = Date.parse(endTime);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
        throw new Error("Invalid slot time range");
    }
    const cancelDeadline = new Date(startMs - 24 * 60 * 60 * 1000).toISOString();
    const decisionDeadline = new Date(endMs + 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();
    const booking = {
        providerId,
        serviceId,
        slotId: slotId || undefined,
        customerWallet,
        startTime,
        endTime,
        depositAmountUsdc,
        status: "confirmed",
        cancelDeadline,
        decisionDeadline,
        appSessionId,
        createdAt: now,
        updatedAt: now
    };
    const auditHash = computeAuditHash({ action: "create_booking", booking });
    booking.auditHash = auditHash;
    writeOnChainAuditLogPlaceholder(auditHash);
    const batch = db.batch();
    const bookingRef = collections.bookings().doc();
    batch.set(bookingRef, booking);
    if (slotRef) {
        batch.update(slotRef, { status: "booked", updatedAt: now });
    }
    await batch.commit();
    try {
        await bookingRef.update({ settlementStatus: "pending" });
        const yellowResult = await runYellowSettlement({
            bookingId: bookingRef.id,
            depositAmountUsdc
        });
        const rawSettlement = yellowResult.settlementResult;
        const settlementTxHash = typeof rawSettlement === "string"
            ? rawSettlement
            : String(rawSettlement?.hash ?? rawSettlement?.transactionHash ?? "");
        await bookingRef.update({
            appSessionId: yellowResult.appSessionId,
            settlementStatus: "settled",
            settlementTxHash
        });
    }
    catch (err) {
        await bookingRef.update({
            settlementStatus: "failed",
            settlementError: err?.message ?? "yellow settlement failed"
        });
    }
    return { ok: true, bookingId: bookingRef.id, auditHash };
}
export async function cancelBooking(_req) {
    const data = (_req.data ?? {});
    const bookingId = String(data.bookingId || "");
    const customerWallet = String(data.customerWallet || "");
    if (!bookingId || !customerWallet) {
        throw new Error("Missing bookingId/customerWallet");
    }
    const ref = collections.bookings().doc(bookingId);
    const snap = await ref.get();
    if (!snap.exists)
        throw new Error("Booking not found");
    const booking = snap.data();
    if (booking.customerWallet !== customerWallet) {
        throw new Error("Not allowed");
    }
    if (booking.status !== "confirmed") {
        throw new Error("Booking is not cancelable");
    }
    const nowMs = Date.now();
    const cancelDeadlineMs = Date.parse(booking.cancelDeadline);
    if (Number.isFinite(cancelDeadlineMs) && nowMs > cancelDeadlineMs) {
        throw new Error("Cancel deadline passed");
    }
    const updated = {
        status: "canceled",
        outcome: "canceled",
        updatedAt: new Date().toISOString()
    };
    const auditHash = computeAuditHash({ action: "cancel_booking", bookingId, updated });
    updated.auditHash = auditHash;
    writeOnChainAuditLogPlaceholder(auditHash);
    await ref.update(updated);
    return { ok: true, bookingId, auditHash };
}
export async function completeBooking(_req) {
    const data = (_req.data ?? {});
    const bookingId = String(data.bookingId || "");
    const providerId = String(data.providerId || "");
    const outcome = String(data.outcome || "");
    if (!bookingId || !providerId || (outcome !== "show" && outcome !== "no_show")) {
        throw new Error("Missing/invalid bookingId/providerId/outcome");
    }
    const ref = collections.bookings().doc(bookingId);
    const snap = await ref.get();
    if (!snap.exists)
        throw new Error("Booking not found");
    const booking = snap.data();
    if (booking.providerId !== providerId) {
        throw new Error("Not allowed");
    }
    if (booking.status !== "confirmed") {
        throw new Error("Booking is not completable");
    }
    const updated = {
        status: "completed",
        outcome,
        updatedAt: new Date().toISOString()
    };
    const auditHash = computeAuditHash({ action: "complete_booking", bookingId, updated });
    updated.auditHash = auditHash;
    writeOnChainAuditLogPlaceholder(auditHash);
    await ref.update(updated);
    return { ok: true, bookingId, auditHash };
}
