export type Role = "customer" | "provider";

export type BookingStatus = "pending" | "confirmed" | "canceled" | "completed";

export type BookingOutcome = "show" | "no_show" | "auto_no_show" | "canceled";

export type ServiceDepositRule =
  | { type: "fixed"; amountUsdc: string }
  | { type: "percent"; percent: number; minUsdc?: string; maxUsdc?: string }
  | { type: "by_duration"; perMinuteUsdc: string; minUsdc?: string; maxUsdc?: string };

export type Service = {
  id: string;
  name: string;
  durationMinutes: number;
  priceUsdc: string;
  depositRule: ServiceDepositRule;
};

export type Provider = {
  id: string;
  name: string;
  walletAddress: string;
  services: Service[];
};

export type AppSessionMeta = {
  sessionId: string;
  protocol: "NitroRPC/0.5";
  participants: [string, string];
  quorum: number;
  weights: [number, number];
  challengeSeconds: number;
};

export type Booking = {
  id: string;
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
  appSession?: AppSessionMeta;
  createdAt: string;
  updatedAt: string;
};
