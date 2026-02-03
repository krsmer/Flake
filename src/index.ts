import "dotenv/config";

import { loadConfig } from "./config";
import { seedProviders } from "./seed";
import { createYellowClient } from "./client";
import { buildCreateAppSessionPayload } from "./channels/create";

loadConfig();
seedProviders();

createYellowClient();

buildCreateAppSessionPayload(
  {
    protocol: "NitroRPC/0.5",
    participants: ["0xCUSTOMER", "0xPROVIDER"],
    weights: [50, 50],
    quorum: 100,
    challengeSeconds: 0,
    nonce: Date.now(),
    application: "No-Flake Booking"
  },
  [
    { participant: "0xCUSTOMER", asset: "usdc", amount: "5" },
    { participant: "0xPROVIDER", asset: "usdc", amount: "0" }
  ]
);
