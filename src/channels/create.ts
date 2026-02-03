import type { RPCAppDefinition, RPCAppSessionAllocation } from "@erc7824/nitrolite";

export type CreateAppSessionParams = RPCAppDefinition;

export type AppSessionAllocation = RPCAppSessionAllocation;

export type CreateAppSessionPayload = {
  definition: CreateAppSessionParams;
  allocations: AppSessionAllocation[];
};

export function buildCreateAppSessionPayload(
  params: CreateAppSessionParams,
  allocations: AppSessionAllocation[]
): CreateAppSessionPayload {
  return { definition: params, allocations };
}
