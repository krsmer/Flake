import type { AppSessionAllocation } from "./create";

export type SubmitAppStatePayload = {
  app_session_id: string;
  allocations: AppSessionAllocation[];
};

export function buildSubmitAppStatePayload(
  appSessionId: string,
  allocations: AppSessionAllocation[]
): SubmitAppStatePayload {
  return { app_session_id: appSessionId, allocations }; // nitro-RPC snake_case, TYpeScript camelCase
}
