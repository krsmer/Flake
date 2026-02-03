import type { Hex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
  createAuthRequestMessage,
  createAuthVerifyMessageFromChallenge,
  createECDSAMessageSigner,
  createEIP712AuthMessageSigner
} from "@erc7824/nitrolite";
import type { MessageSigner } from "@erc7824/nitrolite";

import type { YellowClient } from "./client";

export type SessionAuth = {
  sessionPrivateKey: Hex;
  sessionAddress: Hex;
};

export function createSessionKey(): SessionAuth {
  const sessionPrivateKey = generatePrivateKey();
  const sessionAccount = privateKeyToAccount(sessionPrivateKey);
  return {
    sessionPrivateKey,
    sessionAddress: sessionAccount.address
  };
}

export async function buildAuthRequest(params: {
  address: Hex;
  application: string;
  sessionKeyAddress: Hex;
  allowanceAsset: string;
  allowanceAmount: string;
  expiresAt: bigint;
  scope: string;
}) {
  const authParams = {
    address: params.address,
    application: params.application,
    session_key: params.sessionKeyAddress,
    allowances: [{ asset: params.allowanceAsset, amount: params.allowanceAmount }],
    expires_at: params.expiresAt,
    scope: params.scope
  };

  return {
    authParams,
    payload: await createAuthRequestMessage(authParams)
  };
}

export function buildAuthVerifyFromChallenge(params: {
  walletClient: any;
  authParams: any;
  challenge: string;
  appName: string;
}) {
  const signer = createEIP712AuthMessageSigner(params.walletClient, params.authParams, {
    name: params.appName
  });
  return createAuthVerifyMessageFromChallenge(signer, params.challenge);
}

export function createSessionMessageSigner(sessionPrivateKey: Hex) {
  return createECDSAMessageSigner(sessionPrivateKey);
}

export async function authenticateWallet(params: {
  client: YellowClient;
  walletClient: any;
  address: Hex;
  application: string;
  allowanceAsset: string;
  allowanceAmount: string;
  scope: string;
  expiresAt: bigint;
}): Promise<{ session: SessionAuth; sessionSigner: MessageSigner }> {
  const session = createSessionKey();
  const { authParams, payload } = await buildAuthRequest({
    address: params.address,
    application: params.application,
    sessionKeyAddress: session.sessionAddress,
    allowanceAsset: params.allowanceAsset,
    allowanceAmount: params.allowanceAmount,
    expiresAt: params.expiresAt,
    scope: params.scope
  });

  const authChallenge = await params.client.sendAndWait(payload);
  const challengeMessage = authChallenge?.challenge_message;
  if (!challengeMessage) {
    throw new Error("Missing auth challenge message");
  }

  const verifyMsg = await buildAuthVerifyFromChallenge({
    walletClient: params.walletClient,
    authParams,
    challenge: challengeMessage,
    appName: params.application
  });

  await params.client.sendAndWait(verifyMsg);

  return {
    session,
    sessionSigner: createSessionMessageSigner(session.sessionPrivateKey)
  };
}
