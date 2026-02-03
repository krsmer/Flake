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
  | { type: "percent"; percent: number; minUsdc?: string; maxUsdc?: string }
  | { type: "by_duration"; perMinuteUsdc: string; minUsdc?: string; maxUsdc?: string };

export type ServiceDoc = {
  providerId: string;
  name: string;
  durationMinutes: number;
  priceUsdc: string;
  depositRule: ServiceDepositRule;
  createdAt: string;
  updatedAt: string;
};

export type BookingDoc = {
  providerId: string;
  serviceId: string;
  customerWallet: string;
  startTime: string;
  endTime: string;
  depositAmountUsdc: string;
  status: BookingStatus;
  outcome?: BookingOutcome;
  cancelDeadline: string;
  decisionDeadline: string;
  appSessionId?: string;
  auditHash?: string;
  createdAt: string;
  updatedAt: string;
};

