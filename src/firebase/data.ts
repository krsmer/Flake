import {
  collection,
  getDocs,
  orderBy,
  query,
  where
} from "firebase/firestore";

import { getFirebaseClient } from "./client";

export type ServiceDepositRule =
  | { type: "fixed"; amountUsdc: string }
  | { type: "by_duration"; perMinuteUsdc: string; minUsdc?: string; maxUsdc?: string };

export type ProviderDoc = {
  id: string;
  name: string;
  walletAddress: string;
};

export type ServiceDoc = {
  id: string;
  providerId: string;
  name: string;
  durationMinutes: number;
  depositRule: ServiceDepositRule;
};

export type BookingDoc = {
  id: string;
  providerId: string;
  serviceId: string;
  slotId?: string;
  customerWallet: string;
  startTime: string;
  endTime: string;
  depositAmountUsdc: string;
  status: string;
  outcome?: string;
  appSessionId?: string;
  settlementStatus?: "pending" | "settled" | "failed";
  settlementTxHash?: string;
  settlementError?: string;
  createdAt: string;
};

export async function listProviders(): Promise<ProviderDoc[]> {
  const { db } = getFirebaseClient();
  const snap = await getDocs(collection(db, "providers"));
  return snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) }));
}

export async function listServices(providerId: string): Promise<ServiceDoc[]> {
  const { db } = getFirebaseClient();
  const q = query(
    collection(db, "services"),
    where("providerId", "==", providerId),
    orderBy("name", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) }));
}

export async function listBookingsByProvider(
  providerId: string
): Promise<BookingDoc[]> {
  const { db } = getFirebaseClient();
  const q = query(
    collection(db, "bookings"),
    where("providerId", "==", providerId),
    orderBy("startTime", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) }));
}

export async function listBookingsByCustomer(
  customerWallet: string
): Promise<BookingDoc[]> {
  const { db } = getFirebaseClient();
  const q = query(
    collection(db, "bookings"),
    where("customerWallet", "==", customerWallet),
    orderBy("startTime", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) }));
}

export type SlotDoc = {
  id: string;
  providerId: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  status: "open" | "booked";
};

export async function listOpenSlots(providerId: string): Promise<SlotDoc[]> {
  const { db } = getFirebaseClient();
  const q = query(
    collection(db, "slots"),
    where("providerId", "==", providerId),
    where("status", "==", "open"),
    orderBy("startTime", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) }));
}

export async function listSlotsByProvider(
  providerId: string
): Promise<SlotDoc[]> {
  const { db } = getFirebaseClient();
  const q = query(
    collection(db, "slots"),
    where("providerId", "==", providerId),
    orderBy("startTime", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) }));
}
