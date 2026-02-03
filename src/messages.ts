import type { Hex } from "viem";

type NitroRequest = [number, string, Record<string, unknown>, number];
type NitroEnvelope = { req?: NitroRequest; res?: [number, string, any, number] };

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

export function getRequestIdFromPayload(payload: string): number | null {
  try {
    const parsed = JSON.parse(payload) as NitroEnvelope;
    if (parsed.req && typeof parsed.req[0] === "number") {
      return parsed.req[0];
    }
  } catch {
    return null;
  }
  return null;
}
