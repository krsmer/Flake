import type { CallableRequest } from "firebase-functions/v2/https";

import { computeAuditHash, writeOnChainAuditLogPlaceholder } from "./audit";
import { collections, db } from "./db";
import type { BookingDoc, BookingOutcome, SlotDoc } from "./types";

export async function createBooking(_req: CallableRequest) {
  const data = (_req.data ?? {}) as Record<string, unknown>;
  const providerId = String(data.providerId || "");
  const serviceId = String(data.serviceId || "");
  const customerWallet = String(data.customerWallet || "");
  const slotId = data.slotId ? String(data.slotId) : "";
  const depositAmountUsdc = String(data.depositAmountUsdc || "");
  const appSessionId = data.appSessionId ? String(data.appSessionId) : undefined;

  if (!providerId || !serviceId || !customerWallet || !slotId || !depositAmountUsdc) {
    throw new Error("Missing required fields");
  }

  const slotRef = collections.slots().doc(slotId);
  const slotSnap = await slotRef.get();
  if (!slotSnap.exists) {
    throw new Error("Slot not found");
  }
  const slot = slotSnap.data() as SlotDoc;
  if (slot.status !== "open") {
    throw new Error("Slot is not available");
  }
  if (slot.providerId !== providerId || slot.serviceId !== serviceId) {
    throw new Error("Slot/provider/service mismatch");
  }

  const startTime = slot.startTime;
  const endTime = slot.endTime;
  const startMs = Date.parse(startTime);
  const endMs = Date.parse(endTime);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    throw new Error("Invalid slot time range");
  }

  const cancelDeadline = new Date(startMs - 24 * 60 * 60 * 1000).toISOString();
  const decisionDeadline = new Date(endMs + 60 * 60 * 1000).toISOString();

  const now = new Date().toISOString();
  const booking: BookingDoc = {
    providerId,
    serviceId,
    slotId,
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
  batch.update(slotRef, { status: "booked", updatedAt: now });
  await batch.commit();
  return { ok: true, bookingId: bookingRef.id, auditHash };
}

export async function cancelBooking(_req: CallableRequest) {
  const data = (_req.data ?? {}) as Record<string, unknown>;
  const bookingId = String(data.bookingId || "");
  const customerWallet = String(data.customerWallet || "");
  if (!bookingId || !customerWallet) {
    throw new Error("Missing bookingId/customerWallet");
  }

  const ref = collections.bookings().doc(bookingId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Booking not found");
  const booking = snap.data() as BookingDoc;

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

  const updated: Partial<BookingDoc> = {
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

export async function completeBooking(_req: CallableRequest) {
  const data = (_req.data ?? {}) as Record<string, unknown>;
  const bookingId = String(data.bookingId || "");
  const providerId = String(data.providerId || "");
  const outcome = String(data.outcome || "") as BookingOutcome;

  if (!bookingId || !providerId || (outcome !== "show" && outcome !== "no_show")) {
    throw new Error("Missing/invalid bookingId/providerId/outcome");
  }

  const ref = collections.bookings().doc(bookingId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Booking not found");
  const booking = snap.data() as BookingDoc;

  if (booking.providerId !== providerId) {
    throw new Error("Not allowed");
  }
  if (booking.status !== "confirmed") {
    throw new Error("Booking is not completable");
  }

  const updated: Partial<BookingDoc> = {
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
