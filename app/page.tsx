"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { createBooking } from "../src/firebase/bookings";
import {
  listBookingsByCustomer,
  listOpenSlots,
  listProviders,
  listServices,
  type ProviderDoc,
  type ServiceDoc,
  type SlotDoc
} from "../src/firebase/data";

export default function HomePage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [providers, setProviders] = useState<ProviderDoc[]>([]);
  const [services, setServices] = useState<ServiceDoc[]>([]);
  const [providerId, setProviderId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [slots, setSlots] = useState<SlotDoc[]>([]);
  const [slotId, setSlotId] = useState("");
  const [customerWallet, setCustomerWallet] = useState("0xCUSTOMER");
  const [bookings, setBookings] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setRole(window.localStorage.getItem("role"));
  }, []);

  useEffect(() => {
    listProviders()
      .then((rows) => {
        setProviders(rows);
        if (!providerId && rows[0]) {
          setProviderId(rows[0].id);
        }
      })
      .catch(() => setProviders([]));
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
    listOpenSlots(providerId)
      .then((rows) => {
        setSlots(rows);
        if (!slotId && rows[0]) {
          setSlotId(rows[0].id);
        }
      })
      .catch(() => setSlots([]));
  }, [providerId, slotId]);

  function choose(nextRole: "customer" | "provider") {
    window.localStorage.setItem("role", nextRole);
    setRole(nextRole);
    if (nextRole === "provider") router.push("/provider");
  }

  const selectedService = useMemo(
    () => services.find((service) => service.id === serviceId) || null,
    [services, serviceId]
  );

  function calcDeposit(service: ServiceDoc | null): string {
    if (!service) return "0";
    const rule = service.depositRule;
    if (rule.type === "fixed") return rule.amountUsdc;
    if (rule.type === "percent") {
      const raw = (Number(service.priceUsdc) * rule.percent) / 100;
      let value = raw;
      if (rule.minUsdc) value = Math.max(value, Number(rule.minUsdc));
      if (rule.maxUsdc) value = Math.min(value, Number(rule.maxUsdc));
      return value.toFixed(2);
    }
    const raw = Number(rule.perMinuteUsdc) * service.durationMinutes;
    let value = raw;
    if (rule.minUsdc) value = Math.max(value, Number(rule.minUsdc));
    if (rule.maxUsdc) value = Math.min(value, Number(rule.maxUsdc));
    return value.toFixed(2);
  }

  async function refreshBookings() {
    if (!customerWallet) return;
    setLoadingBookings(true);
    try {
      const rows = await listBookingsByCustomer(customerWallet);
      setBookings(rows);
    } finally {
      setLoadingBookings(false);
    }
  }

  async function createCustomerBooking() {
    setBusy(true);
    setMsg(null);
    try {
      if (!selectedService) throw new Error("Select a service");
      if (!slotId) throw new Error("Select a slot");

      const res = await createBooking({
        providerId,
        serviceId: selectedService.id,
        slotId,
        customerWallet,
        depositAmountUsdc: calcDeposit(selectedService)
      });

      setMsg(`Created booking: ${res.bookingId ?? "OK"}`);
      await refreshBookings();
    } catch (e: any) {
      setMsg(e?.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-14">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <section className="rounded-3xl border p-8 shadow-xl sm:p-10" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-4xl font-semibold tracking-tight">Flake</h1>
                <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
                  Lock a deposit once, resolve instantly off-chain.
                </p>
              </div>
              <span className="rounded-full border px-3 py-1 text-xs uppercase tracking-wide" style={{ borderColor: "var(--accent-2)", color: "var(--accent)" }}>
                Customer
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                className="rounded-xl px-4 py-3 text-sm font-semibold"
                style={{ background: "var(--accent-3)", color: "var(--text)" }}
                onClick={() => choose("customer")}
                type="button"
              >
                Continue as Customer
              </button>
              <button
                className="rounded-xl border px-4 py-3 text-sm font-semibold"
                style={{ borderColor: "var(--accent-2)" }}
                onClick={() => choose("provider")}
                type="button"
              >
                Continue as Provider
              </button>
            </div>

            {role && (
              <p className="text-xs uppercase tracking-wide" style={{ color: "var(--accent)" }}>
                Current role: <span style={{ color: "var(--text)" }}>{role}</span>
              </p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border p-8 sm:p-10" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-semibold">Create Booking</h2>
              <p className="mt-2 text-sm" style={{ color: "var(--accent)" }}>
                Pick a provider and service to create a booking.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs uppercase tracking-wide" style={{ color: "var(--accent)" }}>
                Provider
                <select
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--border)", background: "transparent" }}
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                >
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </label>

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
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs uppercase tracking-wide" style={{ color: "var(--accent)" }}>
                Customer Wallet
                <input
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--border)", background: "transparent" }}
                  value={customerWallet}
                  onChange={(e) => setCustomerWallet(e.target.value)}
                />
              </label>

              <label className="text-xs uppercase tracking-wide" style={{ color: "var(--accent)" }}>
                Slot
                <select
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--border)", background: "transparent" }}
                  value={slotId}
                  onChange={(e) => setSlotId(e.target.value)}
                >
                  {slots.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {new Date(slot.startTime).toLocaleString()}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-2" style={{ color: "var(--accent)" }}>
              <div className="rounded-xl border px-4 py-3" style={{ borderColor: "var(--border)" }}>
                Deposit
                <div className="mt-1 text-base font-semibold" style={{ color: "var(--text)" }}>
                  {calcDeposit(selectedService)} USDC
                </div>
              </div>
              <div className="rounded-xl border px-4 py-3" style={{ borderColor: "var(--border)" }}>
                Duration
                <div className="mt-1 text-base font-semibold" style={{ color: "var(--text)" }}>
                  {selectedService?.durationMinutes ?? 0} min
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                className="rounded-xl border px-4 py-3 text-sm font-semibold transition disabled:opacity-60"
                style={{ borderColor: "var(--accent-2)", background: "var(--accent-3)" }}
                type="button"
                disabled={busy}
                onClick={createCustomerBooking}
              >
                {busy ? "Creating..." : "Create Booking"}
              </button>
              <button
                className="rounded-xl border px-4 py-3 text-sm font-semibold"
                style={{ borderColor: "var(--accent-2)" }}
                type="button"
                onClick={refreshBookings}
                disabled={loadingBookings}
              >
                {loadingBookings ? "Refreshing..." : "Refresh My Bookings"}
              </button>
            </div>

            {msg && (
              <p className="text-sm" style={{ color: "var(--accent)" }}>
                {msg}
              </p>
            )}

            {bookings.length > 0 && (
              <div className="space-y-2">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="rounded-xl border px-4 py-3 text-xs"
                    style={{ borderColor: "var(--border)", color: "var(--accent)" }}
                  >
                    <div className="flex items-center justify-between" style={{ color: "var(--text)" }}>
                      <span>{booking.serviceId}</span>
                      <span style={{ color: "var(--accent)" }}>{booking.status}</span>
                    </div>
                    <div className="mt-1" style={{ color: "var(--accent)" }}>
                      {booking.startTime}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
