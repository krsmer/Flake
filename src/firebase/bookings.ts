import { httpsCallable } from "firebase/functions";

import { getFirebaseClient } from "./client";

export type CreateBookingInput = {
  providerId: string;
  serviceId: string;
  customerWallet: string;
  startTime: string;
  endTime: string;
  depositAmountUsdc: string;
  appSessionId?: string;
};

export async function createBooking(input: CreateBookingInput) {
  const { functions } = getFirebaseClient();
  const fn = httpsCallable(functions, "create_booking");
  const res = await fn(input);
  return res.data as any;
}

export async function cancelBooking(input: {
  bookingId: string;
  customerWallet: string;
}) {
  const { functions } = getFirebaseClient();
  const fn = httpsCallable(functions, "cancel_booking");
  const res = await fn(input);
  return res.data as any;
}

export async function completeBooking(input: {
  bookingId: string;
  providerId: string;
  outcome: "show" | "no_show";
}) {
  const { functions } = getFirebaseClient();
  const fn = httpsCallable(functions, "complete_booking");
  const res = await fn(input);
  return res.data as any;
}

