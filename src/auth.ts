import type { Hex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
  createAuthRequestMessage,
  createAuthVerifyMessageFromChallenge,
  createECDSAMessageSigner,
  createEIP712AuthMessageSigner
} from "@erc7824/nitrolite";

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

export function buildAuthRequest(params: {
  address: Hex;
  application: string;
  sessionKeyAddress: Hex;
  allowanceAsset: string;
  allowanceAmount: string;
  expiresAt: bigint;
  scope: string;
}) {
  return createAuthRequestMessage({
    address: params.address,
    application: params.application,
    session_key: params.sessionKeyAddress,
    allowances: [{ asset: params.allowanceAsset, amount: params.allowanceAmount }],
    expires_at: params.expiresAt,
    scope: params.scope
  });
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
