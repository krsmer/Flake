import { httpsCallable } from "firebase/functions";

import { getFirebaseClient } from "./client";

export async function createSlot(input: {
  providerId: string;
  serviceId: string;
  startTime: string;
  endTime: string;
}) {
  const { functions } = getFirebaseClient();
  const fn = httpsCallable(functions, "create_slot");
  const res = await fn(input);
  return res.data as any;
}
