import { computeAuditHash, writeOnChainAuditLogPlaceholder } from "./audit.js";
import { collections, db } from "./db.js";
async function resolveExpiredBookingsImpl(params) {
    const q = collections
        .bookings()
        .where("status", "==", "confirmed")
        .where("decisionDeadline", "<=", params.nowIso)
        .orderBy("decisionDeadline", "asc")
        .limit(params.limit);
    const snap = await q.get();
    if (snap.empty) {
        return { ok: true, scanned: 0, updated: 0, now: params.nowIso };
    }
    const batch = db.batch();
    let updated = 0;
    for (const doc of snap.docs) {
        const booking = doc.data();
        const patch = {
            status: "completed",
            outcome: "auto_no_show",
            updatedAt: params.nowIso
        };
        const auditHash = computeAuditHash({
            action: "auto_no_show",
            bookingId: doc.id,
            patch,
            booking
        });
        patch.auditHash = auditHash;
        writeOnChainAuditLogPlaceholder(auditHash);
        batch.update(doc.ref, patch);
        updated += 1;
    }
    await batch.commit();
    return { ok: true, scanned: snap.size, updated, now: params.nowIso };
}
export async function resolveExpiredBookings(req) {
    const data = req.data;
    const limit = typeof data?.limit === "number" && Number.isFinite(data.limit)
        ? Math.max(1, Math.min(500, Math.floor(data.limit)))
        : 100;
    const nowIso = new Date().toISOString();
    return resolveExpiredBookingsImpl({ nowIso, limit });
}
