export type CreateAppSessionParams = {
  protocol: "NitroRPC/0.5";
  participants: [string, string];
  weights: [number, number];
  quorum: number;
  challengeSeconds: number;
  nonce: number;
  application: string;
};

export type AppSessionAllocation = {
  participant: string;
  asset: string;
  amount: string;
};

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
