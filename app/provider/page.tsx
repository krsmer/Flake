"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { completeBooking } from "../../src/firebase/bookings";
import { createSlot } from "../../src/firebase/slots";
import {
  listBookingsByProvider,
  listServices,
  listSlotsByProvider,
  type ServiceDoc,
  type SlotDoc
} from "../../src/firebase/data";

export default function ProviderPage() {
  const router = useRouter();
  const [providerId, setProviderId] = useState("prov_1");
  const [services, setServices] = useState<ServiceDoc[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [slots, setSlots] = useState<SlotDoc[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const role = window.localStorage.getItem("role");
    if (role !== "provider") {
      router.replace("/");
    }
  }, [router]);

  useEffect(() => {
    refreshBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId]);

  useEffect(() => {
    if (!providerId) return;
    listServices(providerId)
      .then((rows) => {
        setServices(rows);
        if (!serviceId && rows[0]) {
          setServiceId(rows[0].id);
        }
      })
      .catch(() => setServices([]));
  }, [providerId, serviceId]);

  useEffect(() => {
    if (!providerId) return;
    refreshSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId]);

  async function refreshBookings() {
    setLoading(true);
    try {
      const rows = await listBookingsByProvider(providerId);
      setBookings(rows);
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }

  async function refreshSlots() {
    try {
      const rows = await listSlotsByProvider(providerId);
      setSlots(rows);
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to load slots");
    }
  }

  const selectedService = useMemo(
    () => services.find((service) => service.id === serviceId) || null,
    [services, serviceId]
  );

  async function createProviderSlot() {
    setMsg(null);
    try {
      if (!selectedService) throw new Error("Select a service");
      if (!startTime) throw new Error("Select a start time");
      const startIso = new Date(startTime).toISOString();
      const endIso = new Date(
        new Date(startTime).getTime() + 60 * 60 * 1000
      ).toISOString();
      await createSlot({
        providerId,
        serviceId: selectedService.id,
        startTime: startIso,
        endTime: endIso
      });
      setStartTime("");
      await refreshSlots();
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to create slot");
    }
  }

  async function markOutcome(bookingId: string, outcome: "show" | "no_show") {
    setMsg(null);
    try {
      await completeBooking({ bookingId, providerId, outcome });
      await refreshBookings();
    } catch (e: any) {
      setMsg(e?.message ?? "Failed");
    }
  }

  return (
    <main className="min-h-screen px-6 py-14">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <section className="rounded-3xl border p-8 shadow-xl sm:p-10" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">Provider</h1>
                <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
                  Manage bookings and resolve outcomes.
                </p>
              </div>
              <span className="rounded-full border px-3 py-1 text-xs uppercase tracking-wide" style={{ borderColor: "var(--accent-2)", color: "var(--accent)" }}>
                Provider
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs uppercase tracking-wide" style={{ color: "var(--accent)" }}>
                Provider ID
                <input
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--border)", background: "transparent" }}
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                />
              </label>
              <div className="flex items-end">
                <button
                  className="rounded-xl border px-4 py-3 text-sm font-semibold"
                  style={{ borderColor: "var(--accent-2)" }}
                  type="button"
                  onClick={refreshBookings}
                  disabled={loading}
                >
                  {loading ? "Refreshing..." : "Refresh Bookings"}
                </button>
              </div>
            </div>

            {msg && (
              <p className="text-sm" style={{ color: "var(--accent)" }}>
                {msg}
              </p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border p-8 sm:p-10" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-semibold">Create Slot</h2>
              <p className="mt-2 text-sm" style={{ color: "var(--accent)" }}>
                Add a 60-minute slot for students to book.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs uppercase tracking-wide" style={{ color: "var(--accent)" }}>
                Service
                <select
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--border)", background: "transparent" }}
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                >
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs uppercase tracking-wide" style={{ color: "var(--accent)" }}>
                Start Time
                <input
                  type="datetime-local"
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--border)", background: "transparent" }}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </label>
            </div>

            <button
              className="rounded-xl border px-4 py-3 text-sm font-semibold"
              style={{ borderColor: "var(--accent-2)", background: "var(--accent-3)" }}
              type="button"
              onClick={createProviderSlot}
            >
              Create Slot
            </button>

            {slots.length > 0 && (
              <div className="space-y-2">
                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="rounded-xl border px-4 py-3 text-xs"
                    style={{ borderColor: "var(--border)", color: "var(--accent)" }}
                  >
                    <div className="flex items-center justify-between" style={{ color: "var(--text)" }}>
                      <span>{slot.serviceId}</span>
                      <span style={{ color: "var(--accent)" }}>{slot.status}</span>
                    </div>
                    <div className="mt-1" style={{ color: "var(--accent)" }}>
                      {new Date(slot.startTime).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border p-8 sm:p-10" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="space-y-3">
            {bookings.length === 0 && (
              <p className="text-sm" style={{ color: "var(--accent)" }}>
                No bookings found.
              </p>
            )}
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="rounded-xl border px-4 py-3 text-sm"
                style={{ borderColor: "var(--border)", color: "var(--accent)" }}
              >
                <div className="flex items-center justify-between" style={{ color: "var(--text)" }}>
                  <span>{booking.serviceId}</span>
                  <span style={{ color: "var(--accent)" }}>{booking.status}</span>
                </div>
                <div className="mt-1 text-xs" style={{ color: "var(--accent)" }}>
                  {booking.startTime}
                </div>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <button
                    className="rounded-xl border px-3 py-2 text-xs font-semibold"
                    style={{ borderColor: "var(--accent-2)", background: "var(--accent-3)" }}
                    type="button"
                    onClick={() => markOutcome(booking.id, "show")}
                  >
                    Mark Show
                  </button>
                  <button
                    className="rounded-xl border px-3 py-2 text-xs font-semibold"
                    style={{ borderColor: "var(--accent-2)" }}
                    type="button"
                    onClick={() => markOutcome(booking.id, "no_show")}
                  >
                    Mark No-show
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-white/10 pt-6">
            <button
              className="rounded-xl border px-4 py-3 text-sm font-semibold"
              style={{ borderColor: "var(--accent-2)" }}
              type="button"
              onClick={() => router.push("/")}
            >
              Back to Home
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
