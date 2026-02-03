import {
  createAppSessionMessage,
  createCloseAppSessionMessage,
  createSubmitAppStateMessage
} from "@erc7824/nitrolite";
import type { MessageSigner } from "@erc7824/nitrolite";

import type { Hex } from "viem";

import type { YellowClient } from "./client";
import type { AppSessionAllocation, CreateAppSessionParams } from "./channels/create";

type AppSessionCreateResult = {
  sessionId: Hex;
  response: any;
};

function parseMessage(message: string) {
  return JSON.parse(message);
}

async function addSignatures(
  messageJson: any,
  additionalSigners: MessageSigner[]
) {
  if (!additionalSigners.length) return messageJson;
  for (const signer of additionalSigners) {
    const sig = await signer(messageJson.req);
    messageJson.sig.push(sig);
  }
  return messageJson;
}

export async function createAppSession(params: {
  client: YellowClient;
  signer: MessageSigner;
  definition: CreateAppSessionParams;
  allocations: AppSessionAllocation[];
}): Promise<AppSessionCreateResult> {
  const msg = await createAppSessionMessage(params.signer, {
    definition: params.definition,
    allocations: params.allocations
  });

  const response = await params.client.sendAndWait(msg);
  const rawSessionId = response?.appSessionId || response?.app_session_id;
  if (typeof rawSessionId !== "string" || !rawSessionId.startsWith("0x")) {
    throw new Error("Missing appSessionId in response");
  }
  return { sessionId: rawSessionId as Hex, response };
}

export async function updateAppSession(params: {
  client: YellowClient;
  signer: MessageSigner;
  additionalSigners?: MessageSigner[];
  appSessionId: Hex;
  allocations: AppSessionAllocation[];
}) {
  const msg = await createSubmitAppStateMessage(params.signer, {
    app_session_id: params.appSessionId,
    allocations: params.allocations
  });

  const msgJson = parseMessage(msg);
  const finalMsg = await addSignatures(msgJson, params.additionalSigners ?? []);
  return params.client.sendAndWait(JSON.stringify(finalMsg));
}

export async function closeAppSession(params: {
  client: YellowClient;
  signer: MessageSigner;
  additionalSigners?: MessageSigner[];
  appSessionId: Hex;
  allocations: AppSessionAllocation[];
}) {
  const msg = await createCloseAppSessionMessage(params.signer, {
    app_session_id: params.appSessionId,
    allocations: params.allocations
  });

  const msgJson = parseMessage(msg);
  const finalMsg = await addSignatures(msgJson, params.additionalSigners ?? []);
  return params.client.sendAndWait(JSON.stringify(finalMsg));
}
