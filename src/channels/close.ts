import type { AppSessionAllocation } from "./create";

export type CloseAppSessionPayload = {
  app_session_id: string;
  allocations: AppSessionAllocation[];
};

export function buildCloseAppSessionPayload(
  appSessionId: string,
  allocations: AppSessionAllocation[]
): CloseAppSessionPayload {
  return { app_session_id: appSessionId, allocations };
}
