import type { Provider } from "./types";
import { saveProvider } from "./repo";

const provider: Provider = {
  id: "prov_1",
  name: "No-Flake Studio",
  walletAddress: "0xPROVIDER_WALLET",
  services: [
    {
      id: "svc_cut",
      name: "Haircut",
      durationMinutes: 45,
      priceUsdc: "25",
      depositRule: { type: "percent", percent: 20, minUsdc: "3", maxUsdc: "8" }
    },
    {
      id: "svc_consult",
      name: "Consultation",
      durationMinutes: 60,
      priceUsdc: "40",
      depositRule: { type: "by_duration", perMinuteUsdc: "0.2", minUsdc: "5" }
    }
  ]
};

export function seedProviders(): void {
  saveProvider(provider);
}
