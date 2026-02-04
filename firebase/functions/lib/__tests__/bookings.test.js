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
import { createBooking, cancelBooking, completeBooking } from "../bookings";
describe("bookings handlers", () => {
    beforeEach(() => {
        const fake = globalThis.__fakeDb;
        fake?.reset?.();
    });
    it("creates booking and marks slot booked", async () => {
        const fake = globalThis.__fakeDb;
        const slotRef = await fake.collections.slots().add({
            providerId: "prov_1",
            serviceId: "svc_1",
            startTime: new Date(Date.now() + 60_000).toISOString(),
            endTime: new Date(Date.now() + 3_600_000).toISOString(),
            status: "open"
        });
        const res = await createBooking({
            data: {
                providerId: "prov_1",
                serviceId: "svc_1",
                slotId: slotRef.id,
                customerWallet: "0xCUST",
                depositAmountUsdc: "5"
            }
        });
        expect(res.ok).toBe(true);
        const slot = fake.stores.slots.get(slotRef.id);
        expect(slot?.status).toBe("booked");
    });
    it("cancels booking before deadline", async () => {
        const fake = globalThis.__fakeDb;
        const bookingRef = fake.collections.bookings().doc("bk_1");
        await bookingRef.set({
            providerId: "prov_1",
            serviceId: "svc_1",
            customerWallet: "0xCUST",
            startTime: new Date(Date.now() + 86_400_000).toISOString(),
            endTime: new Date(Date.now() + 87_000_000).toISOString(),
            depositAmountUsdc: "5",
            status: "confirmed",
            cancelDeadline: new Date(Date.now() + 86_300_000).toISOString(),
            decisionDeadline: new Date(Date.now() + 87_100_000).toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        const res = await cancelBooking({
            data: { bookingId: "bk_1", customerWallet: "0xCUST" }
        });
        expect(res.ok).toBe(true);
        const booking = fake.stores.bookings.get("bk_1");
        expect(booking?.status).toBe("canceled");
    });
    it("completes booking with outcome", async () => {
        const fake = globalThis.__fakeDb;
        const bookingRef = fake.collections.bookings().doc("bk_2");
        await bookingRef.set({
            providerId: "prov_1",
            serviceId: "svc_1",
            customerWallet: "0xCUST",
            startTime: new Date(Date.now() + 60_000).toISOString(),
            endTime: new Date(Date.now() + 120_000).toISOString(),
            depositAmountUsdc: "5",
            status: "confirmed",
            cancelDeadline: new Date(Date.now() - 1).toISOString(),
            decisionDeadline: new Date(Date.now() + 3_600_000).toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        const res = await completeBooking({
            data: { bookingId: "bk_2", providerId: "prov_1", outcome: "show" }
        });
        expect(res.ok).toBe(true);
        const booking = fake.stores.bookings.get("bk_2");
        expect(booking?.status).toBe("completed");
        expect(booking?.outcome).toBe("show");
    });
});
