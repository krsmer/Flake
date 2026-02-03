import type { Hex } from "viem";

type NitroRequest = [number, string, Record<string, unknown>, number];

export function buildRequest(
  requestId: number,
  method: string,
  params: Record<string, unknown>
): NitroRequest {
  return [requestId, method, params, Date.now()];
}

export function wrapSignedRequest(req: NitroRequest, sigs: Hex[]) {
  return JSON.stringify({ req, sig: sigs });
}
