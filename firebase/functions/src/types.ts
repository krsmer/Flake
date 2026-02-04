export type BookingStatus = "pending" | "confirmed" | "canceled" | "completed";
export type BookingOutcome = "show" | "no_show" | "auto_no_show" | "canceled";

export type ProviderDoc = {
  name: string;
  walletAddress: string;
  createdAt: string;
  updatedAt: string;
};

export type ServiceDepositRule =
  | { type: "fixed"; amountUsdc: string }
  | { type: "by_duration"; perMinuteUsdc: string; minUsdc?: string; maxUsdc?: string };

export type ServiceDoc = {
  providerId: string;
  name: string;
  durationMinutes: number;
  depositRule: ServiceDepositRule;
  createdAt: string;
  updatedAt: string;
};

export type BookingDoc = {
  providerId: string;
  serviceId: string;
  slotId?: string;
  customerWallet: string;
  startTime: string;
  endTime: string;
  depositAmountUsdc: string;
  status: BookingStatus;
  outcome?: BookingOutcome;
  cancelDeadline: string;
  decisionDeadline: string;
  appSessionId?: string;
  settlementStatus?: "pending" | "settled" | "failed";
  settlementTxHash?: string;
  settlementError?: string;
  auditHash?: string;
  createdAt: string;
  updatedAt: string;
};

export type SlotStatus = "open" | "booked";

export type SlotDoc = {
  providerId: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
  createdAt: string;
  updatedAt: string;
};
