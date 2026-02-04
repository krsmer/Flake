import WebSocket from "ws";
import {
  RPCProtocolVersion,
  createAppSessionMessage,
  createAuthRequestMessage,
  createAuthVerifyMessageFromChallenge,
  createCloseAppSessionMessage,
  createECDSAMessageSigner,
  createEIP712AuthMessageSigner,
  createSubmitAppStateMessage,
  NitroliteClient,
  WalletStateSigner
} from "@erc7824/nitrolite";
import { createPublicClient, createWalletClient, http } from "viem";
import {
  generatePrivateKey,
  mnemonicToAccount,
  privateKeyToAccount
} from "viem/accounts";
import { sepolia } from "viem/chains";
import type { Hex } from "viem";

const SEPOLIA_CUSTODY_ADDRESS =
  "0x019B65A265EB3363822f2752141b3dF16131b262";
const SEPOLIA_ADJUDICATOR_ADDRESS =
  "0x7c7ccbc98469190849BCC6c926307794fDfB11F2";
const YTEST_USD_TOKEN =
  "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

type YellowConfig = {
  clearnodeWsUrl: string;
  rpcUrl: string;
  appName: string;
  wallet1SeedPhrase: string;
  wallet2SeedPhrase: string;
  privateKey: string;
};

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function loadYellowConfig(): YellowConfig {
  return {
    clearnodeWsUrl: getEnv("CLEARNODE_WS_URL"),
    rpcUrl: getEnv("RPC_URL"),
    appName: getEnv("APP_NAME"),
    wallet1SeedPhrase: getEnv("WALLET_1_SEED_PHRASE"),
    wallet2SeedPhrase: getEnv("WALLET_2_SEED_PHRASE"),
    privateKey: getEnv("PRIVATE_KEY")
  };
}

type PendingRequest = {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
};

function createYellowClient(clearnodeWsUrl: string) {
  const ws = new WebSocket(clearnodeWsUrl);
  const pending = new Map<number, PendingRequest>();

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (Array.isArray(msg?.res)) {
        const requestId = msg.res[0];
        const handler = pending.get(requestId);
        if (handler) {
          pending.delete(requestId);
          handler.resolve(msg.res[2]);
        }
      }
    } catch {
      // ignore malformed messages
    }
  });

  return {
    ws,
    sendAndWait: (payload: string) =>
      new Promise<any>((resolve, reject) => {
        const requestId = (() => {
          try {
            const parsed = JSON.parse(payload);
            return parsed?.req?.[0];
          } catch {
            return null;
          }
        })();

        if (typeof requestId !== "number") {
          reject(new Error("Missing request id in payload"));
          return;
        }

        pending.set(requestId, { resolve, reject });
        ws.send(payload);
      }),
    close: () => ws.close()
  };
}

async function waitForOpen(ws: WebSocket) {
  if (ws.readyState === ws.OPEN) return;
  await new Promise<void>((resolve, reject) => {
    ws.onopen = () => resolve();
    ws.onerror = (err) => reject(err);
  });
}

function parseUsdcToBaseUnits(amount: string): bigint {
  const [whole, frac = ""] = amount.split(".");
  const fracPadded = (frac + "000000").slice(0, 6);
  const wholePart = whole ? BigInt(whole) : 0n;
  const fracPart = fracPadded ? BigInt(fracPadded) : 0n;
  return wholePart * 1_000_000n + fracPart;
}

async function authenticateWallet(params: {
  client: ReturnType<typeof createYellowClient>;
  walletClient: any;
  address: Hex;
  application: string;
  allowanceAsset: string;
  allowanceAmount: string;
  scope: string;
  expiresAt: bigint;
}) {
  const sessionPrivateKey = generatePrivateKey();
  const sessionAccount = privateKeyToAccount(sessionPrivateKey);

  const authParams = {
    address: params.address,
    application: params.application,
    session_key: sessionAccount.address,
    allowances: [
      { asset: params.allowanceAsset, amount: params.allowanceAmount }
    ],
    expires_at: params.expiresAt,
    scope: params.scope
  };

  const authRequest = await createAuthRequestMessage(authParams);
  const authChallenge = await params.client.sendAndWait(authRequest);
  const challengeMessage = authChallenge?.challenge_message;
  if (!challengeMessage) {
    throw new Error("Missing auth challenge message");
  }

  const signer = createEIP712AuthMessageSigner(
    params.walletClient,
    authParams,
    { name: params.application }
  );
  const verifyMsg = await createAuthVerifyMessageFromChallenge(
    signer,
    challengeMessage
  );
  await params.client.sendAndWait(verifyMsg);

  return {
    sessionSigner: createECDSAMessageSigner(sessionPrivateKey),
    sessionAddress: sessionAccount.address
  };
}

async function createAppSession(params: {
  client: ReturnType<typeof createYellowClient>;
  signer: any;
  definition: any;
  allocations: any[];
}) {
  const msg = await createAppSessionMessage(params.signer, {
    definition: params.definition,
    allocations: params.allocations
  });
  const response = await params.client.sendAndWait(msg);
  const rawSessionId = response?.appSessionId || response?.app_session_id;
  if (typeof rawSessionId !== "string") {
    throw new Error("Missing appSessionId in response");
  }
  return rawSessionId as Hex;
}

function parseMessage(message: string) {
  return JSON.parse(message);
}

async function addSignatures(messageJson: any, signers: any[]) {
  for (const signer of signers) {
    const sig = await signer(messageJson.req);
    messageJson.sig.push(sig);
  }
  return messageJson;
}

async function updateAppSession(params: {
  client: ReturnType<typeof createYellowClient>;
  signer: any;
  additionalSigners: any[];
  appSessionId: Hex;
  allocations: any[];
}) {
  const msg = await createSubmitAppStateMessage(params.signer, {
    app_session_id: params.appSessionId,
    allocations: params.allocations
  });
  const msgJson = parseMessage(msg);
  const finalMsg = await addSignatures(msgJson, params.additionalSigners);
  return params.client.sendAndWait(JSON.stringify(finalMsg));
}

async function closeAppSession(params: {
  client: ReturnType<typeof createYellowClient>;
  signer: any;
  additionalSigners: any[];
  appSessionId: Hex;
  allocations: any[];
}) {
  const msg = await createCloseAppSessionMessage(params.signer, {
    app_session_id: params.appSessionId,
    allocations: params.allocations
  });
  const msgJson = parseMessage(msg);
  const finalMsg = await addSignatures(msgJson, params.additionalSigners);
  return params.client.sendAndWait(JSON.stringify(finalMsg));
}

function createNitroliteClient(rpcUrl: string, privateKey: string) {
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl)
  });
  const walletClient = createWalletClient({
    chain: sepolia,
    transport: http(rpcUrl),
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

  return { client };
}

export async function runYellowSettlement(params: {
  bookingId: string;
  depositAmountUsdc: string;
}) {
  const config = loadYellowConfig();
  const yellow = createYellowClient(config.clearnodeWsUrl);
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

  const scope = `flake.booking.${params.bookingId}`;
  const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 3600);

  const auth1 = await authenticateWallet({
    client: yellow,
    walletClient: wallet1,
    address: wallet1.account.address,
    application: config.appName,
    allowanceAsset: "ytest.usd",
    allowanceAmount: "1000000000",
    scope,
    expiresAt
  });
  const auth2 = await authenticateWallet({
    client: yellow,
    walletClient: wallet2,
    address: wallet2.account.address,
    application: config.appName,
    allowanceAsset: "ytest.usd",
    allowanceAmount: "1000000000",
    scope,
    expiresAt
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
    {
      participant: wallet1.account.address,
      asset: "ytest.usd",
      amount: params.depositAmountUsdc
    },
    { participant: wallet2.account.address, asset: "ytest.usd", amount: "0" }
  ];

  const appSessionId = await createAppSession({
    client: yellow,
    signer: auth1.sessionSigner,
    definition,
    allocations: initialAllocations
  });

  const finalAllocations = [
    { participant: wallet1.account.address, asset: "ytest.usd", amount: "0" },
    {
      participant: wallet2.account.address,
      asset: "ytest.usd",
      amount: params.depositAmountUsdc
    }
  ];

  await updateAppSession({
    client: yellow,
    signer: auth1.sessionSigner,
    additionalSigners: [auth2.sessionSigner],
    appSessionId,
    allocations: finalAllocations
  });

  await closeAppSession({
    client: yellow,
    signer: auth1.sessionSigner,
    additionalSigners: [auth2.sessionSigner],
    appSessionId,
    allocations: finalAllocations
  });

  const { client } = createNitroliteClient(config.rpcUrl, config.privateKey);
  const amountBaseUnits = parseUsdcToBaseUnits(params.depositAmountUsdc);
  const settlementResult = await client.withdrawal(
    YTEST_USD_TOKEN,
    amountBaseUnits
  );

  yellow.close();
  return { appSessionId, settlementResult };
}
