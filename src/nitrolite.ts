import { NitroliteClient, WalletStateSigner } from "@erc7824/nitrolite";
import { createPublicClient, createWalletClient, http } from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

import { loadConfig } from "./config";
import {
  SEPOLIA_ADJUDICATOR_ADDRESS,
  SEPOLIA_CUSTODY_ADDRESS
} from "./constants";

export function createNitroliteClient() {
  const config = loadConfig();
  const account = privateKeyToAccount(config.privateKey as `0x${string}`);

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(config.rpcUrl)
  });

  const walletClient = createWalletClient({
    chain: sepolia,
    transport: http(config.rpcUrl),
    account
  });

  const client = new NitroliteClient({
    publicClient,
    walletClient,
    stateSigner: new WalletStateSigner(walletClient),
    addresses: {
      custody: SEPOLIA_CUSTODY_ADDRESS,
      adjudicator: SEPOLIA_ADJUDICATOR_ADDRESS
    },
    chainId: sepolia.id,
    challengeDuration: 3600n
  });

  return { client, account, walletClient };
}
