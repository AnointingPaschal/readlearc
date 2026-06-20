import { BrowserProvider, JsonRpcSigner } from "ethers";
import type { WalletClient } from "viem";

export function walletClientToSigner(walletClient: WalletClient): JsonRpcSigner {
  const { account, chain, transport } = walletClient;
  if (!account) throw new Error("No account connected");
  const provider = new BrowserProvider(transport as any, chain ? { chainId: chain.id, name: chain.name } : undefined);
  return new JsonRpcSigner(provider, account.address);
}

export function walletClientToProvider(walletClient: WalletClient): BrowserProvider {
  const { chain, transport } = walletClient;
  return new BrowserProvider(transport as any, chain ? { chainId: chain.id, name: chain.name } : undefined);
}
