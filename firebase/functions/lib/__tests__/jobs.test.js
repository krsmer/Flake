import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../db", () => {
    const { createFakeFirestore } = require("./fakes/firestore.ts");
    const fake = createFakeFirestore();
    globalThis.__fakeDb = fake;
    return {
        collections: fake.collections,
        db: fake.db
    };
});
import { resolveExpiredBookings } from "../jobs";
describe("resolveExpiredBookings", () => {
    beforeEach(() => {
        const fake = globalThis.__fakeDb;
        fake?.reset?.();
    });
    it("auto-resolves expired confirmed bookings", async () => {
        const fake = globalThis.__fakeDb;
        const bookingRef = fake.collections.bookings().doc("bk_exp");
        await bookingRef.set({
            providerId: "prov_1",
            serviceId: "svc_1",
            customerWallet: "0xCUST",
            startTime: new Date(Date.now() - 3_600_000).toISOString(),
            endTime: new Date(Date.now() - 1_800_000).toISOString(),
            depositAmountUsdc: "5",
            status: "confirmed",
            cancelDeadline: new Date(Date.now() - 2_000_000).toISOString(),
            decisionDeadline: new Date(Date.now() - 1_000).toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        const res = await resolveExpiredBookings({ data: { limit: 10 } });
        expect(res.ok).toBe(true);
        const booking = fake.stores.bookings.get("bk_exp");
        expect(booking?.status).toBe("completed");
        expect(booking?.outcome).toBe("auto_no_show");
    });
});
