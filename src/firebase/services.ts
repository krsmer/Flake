import { httpsCallable } from "firebase/functions";

import { getFirebaseClient } from "./client";
import type { ServiceDepositRule } from "./data";

export type CreateServiceInput = {
  providerId: string;
  providerName: string;
  serviceName: string;
  durationMinutes: number;
  depositRule: ServiceDepositRule;
  walletAddress?: string;
};

export async function createService(input: CreateServiceInput) {
  const { functions } = getFirebaseClient();
  const fn = httpsCallable(functions, "create_service");
  const res = await fn(input);
  return res.data as any;
}
