"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { completeBooking } from "../../src/firebase/bookings";
import { createService } from "../../src/firebase/services";
import {
  listBookingsByProvider,
  listServices,
  type ServiceDoc
} from "../../src/firebase/data";

export default function ProviderPage() {
  const router = useRouter();
  const [providerId, setProviderId] = useState("prov_1");
  const [providerName, setProviderName] = useState("Provider");
  const [services, setServices] = useState<ServiceDoc[]>([]);
  const [serviceName, setServiceName] = useState("");
  const [serviceDuration, setServiceDuration] = useState("60");
  const [serviceDeposit, setServiceDeposit] = useState("5");
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
    refreshServices();
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

  async function refreshServices() {
    if (!providerId) return;
    try {
      const rows = await listServices(providerId);
      setServices(rows);
      // no-op: keep list for display
    } catch (e: any) {
      setServices([]);
      setMsg(e?.message ?? "Failed to load services");
    }
  }

  async function createProviderService() {
    setMsg(null);
    try {
      const durationMinutes = Number(serviceDuration);
      if (!providerId) throw new Error("Provider ID is required");
      if (!providerName) throw new Error("Provider name is required");
      if (!serviceName) throw new Error("Service name is required");
      if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
        throw new Error("Invalid duration");
      }
      if (!serviceDeposit) throw new Error("Deposit is required");

      await createService({
        providerId,
        providerName,
        serviceName,
        durationMinutes,
        depositRule: { type: "fixed", amountUsdc: serviceDeposit }
      });

      setServiceName("");
      await refreshServices();
      setMsg("Service created");
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to create service");
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
              <label className="text-xs uppercase tracking-wide" style={{ color: "var(--accent)" }}>
                Provider Name
                <input
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--border)", background: "transparent" }}
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
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
              <h2 className="text-lg font-semibold">Create Service</h2>
              <p className="mt-2 text-sm" style={{ color: "var(--accent)" }}>
                Add a service that students can book.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs uppercase tracking-wide" style={{ color: "var(--accent)" }}>
                Service Name
                <input
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--border)", background: "transparent" }}
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                />
              </label>

              <label className="text-xs uppercase tracking-wide" style={{ color: "var(--accent)" }}>
                Duration (minutes)
                <input
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--border)", background: "transparent" }}
                  value={serviceDuration}
                  onChange={(e) => setServiceDuration(e.target.value)}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs uppercase tracking-wide" style={{ color: "var(--accent)" }}>
                Deposit (USDC)
                <input
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--border)", background: "transparent" }}
                  value={serviceDeposit}
                  onChange={(e) => setServiceDeposit(e.target.value)}
                />
              </label>
            </div>

            <button
              className="rounded-xl border px-4 py-3 text-sm font-semibold"
              style={{ borderColor: "var(--accent-2)", background: "var(--accent-3)" }}
              type="button"
              onClick={createProviderService}
            >
              Create Service
            </button>

            {services.length > 0 && (
              <div className="space-y-2">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="rounded-xl border px-4 py-3 text-xs"
                    style={{ borderColor: "var(--border)", color: "var(--accent)" }}
                  >
                    <div className="flex items-center justify-between" style={{ color: "var(--text)" }}>
                      <span>{service.name}</span>
                    </div>
                    <div className="mt-1" style={{ color: "var(--accent)" }}>
                      {service.durationMinutes} min
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
                {booking.appSessionId && (
                  <div className="mt-1 text-xs" style={{ color: "var(--accent)" }}>
                    App Session: {booking.appSessionId}
                  </div>
                )}
                {booking.settlementStatus && (
                  <div className="mt-1 text-xs" style={{ color: "var(--accent)" }}>
                    Settlement: {booking.settlementStatus}
                  </div>
                )}
                {booking.settlementTxHash && (
                  <div className="mt-1 text-xs" style={{ color: "var(--accent)" }}>
                    Tx: {booking.settlementTxHash}
                  </div>
                )}
                {booking.settlementError && (
                  <div className="mt-1 text-xs" style={{ color: "var(--accent)" }}>
                    Error: {booking.settlementError}
                  </div>
                )}
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
