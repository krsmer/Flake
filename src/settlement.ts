import type { Address } from "viem";

import { createNitroliteClient } from "./nitrolite";

export async function withdrawOnChain(params: {
  tokenAddress: Address;
  amount: bigint;
}) {
  const { client } = createNitroliteClient();
  return client.withdrawal(params.tokenAddress, params.amount);
}
