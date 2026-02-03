import "dotenv/config";

import WebSocket from "ws";
import { createWalletClient, http } from "viem";
import { mnemonicToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { RPCProtocolVersion } from "@erc7824/nitrolite";

import { createYellowClient } from "../src/client";
import { authenticateWallet } from "../src/auth";
import { createAppSession, updateAppSession, closeAppSession } from "../src/appSessions";
import { loadConfig } from "../src/config";
import { YTEST_USD_TOKEN } from "../src/constants";
import { withdrawOnChain } from "../src/settlement";

async function waitForOpen(ws: WebSocket) {
  if (ws.readyState === ws.OPEN) return;
  await new Promise<void>((resolve, reject) => {
    ws.onopen = () => resolve();
    ws.onerror = (err) => reject(err);
  });
}

async function main() {
  const config = loadConfig();
  if (!config.wallet1SeedPhrase || !config.wallet2SeedPhrase) {
    throw new Error("Missing WALLET_1_SEED_PHRASE or WALLET_2_SEED_PHRASE");
  }

  const yellow = createYellowClient();
  await waitForOpen(yellow.ws);

  const wallet1 = createWalletClient({
    account: mnemonicToAccount(config.wallet1SeedPhrase),
    chain: sepolia,
    transport: http(config.rpcUrl)
  });

  const wallet2 = createWalletClient({
    account: mnemonicToAccount(config.wallet2SeedPhrase),
    chain: sepolia,
    transport: http(config.rpcUrl)
  });

  const auth1 = await authenticateWallet({
    client: yellow,
    walletClient: wallet1,
    address: wallet1.account.address,
    application: config.appName,
    allowanceAsset: "ytest.usd",
    allowanceAmount: "1000000000",
    scope: "flake.demo",
    expiresAt: BigInt(Math.floor(Date.now() / 1000) + 3600)
  });

  const auth2 = await authenticateWallet({
    client: yellow,
    walletClient: wallet2,
    address: wallet2.account.address,
    application: config.appName,
    allowanceAsset: "ytest.usd",
    allowanceAmount: "1000000000",
    scope: "flake.demo",
    expiresAt: BigInt(Math.floor(Date.now() / 1000) + 3600)
  });

  const definition = {
    protocol: RPCProtocolVersion.NitroRPC_0_4,
    participants: [wallet1.account.address, wallet2.account.address],
    weights: [50, 50],
    quorum: 100,
    challenge: 0,
    nonce: Date.now(),
    application: config.appName
  };

  const initialAllocations = [
    { participant: wallet1.account.address, asset: "ytest.usd", amount: "5" },
    { participant: wallet2.account.address, asset: "ytest.usd", amount: "0" }
  ];

  const { sessionId } = await createAppSession({
    client: yellow,
    signer: auth1.sessionSigner,
    definition,
    allocations: initialAllocations
  });

  const finalAllocations = [
    { participant: wallet1.account.address, asset: "ytest.usd", amount: "0" },
    { participant: wallet2.account.address, asset: "ytest.usd", amount: "5" }
  ];

  await updateAppSession({
    client: yellow,
    signer: auth1.sessionSigner,
    additionalSigners: [auth2.sessionSigner],
    appSessionId: sessionId,
    allocations: finalAllocations
  });

  await closeAppSession({
    client: yellow,
    signer: auth1.sessionSigner,
    additionalSigners: [auth2.sessionSigner],
    appSessionId: sessionId,
    allocations: finalAllocations
  });

  if (process.env.SETTLE_ON_CHAIN === "true") {
    const amount = BigInt(process.env.SETTLEMENT_AMOUNT || "0");
    if (amount > 0n) {
      await withdrawOnChain({
        tokenAddress: YTEST_USD_TOKEN,
        amount
      });
    }
  }

  yellow.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
