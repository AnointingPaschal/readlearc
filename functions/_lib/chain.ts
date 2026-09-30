import { ethers } from "ethers";
import type { Env } from "./env";
import { getConfig, type RuntimeConfig } from "./store";
import RolesAbi from "../../src/abi/Roles.json";
import ContentStoreAbi from "../../src/abi/ContentStore.json";
import MonetizationAbi from "../../src/abi/Monetization.json";
import PaymentsAbi from "../../src/abi/Payments.json";
import StreamPayAbi from "../../src/abi/StreamPay.json";

export interface Chain {
  cfg: Partial<RuntimeConfig>;
  provider: ethers.JsonRpcProvider;
  roles?: ethers.Contract; store?: ethers.Contract; mon?: ethers.Contract; pay?: ethers.Contract; stream?: ethers.Contract;
}

export async function chainFor(env: Env): Promise<Chain> {
  const cfg = await getConfig(env);
  const rpc = cfg.rpcUrl || "https://rpc.mainnet.arc.io";
  const chainId = cfg.chainId || 5042;
  const provider = new ethers.JsonRpcProvider(rpc, chainId, { staticNetwork: true, batchMaxCount: 1 });
  const mk = (addr: string | undefined, abi: unknown) => (addr ? new ethers.Contract(addr, abi as ethers.InterfaceAbi, provider) : undefined);
  return {
    cfg, provider,
    roles: mk(cfg.roles, RolesAbi), store: mk(cfg.contentStore, ContentStoreAbi), mon: mk(cfg.monetization, MonetizationAbi),
    pay: mk(cfg.payments, PaymentsAbi), stream: mk(cfg.streamPay, StreamPayAbi),
  };
}

export async function isAdmin(env: Env, chain: Chain, addr: string): Promise<boolean> {
  const boot = (env.ADMIN_ADDRESSES || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (boot.includes(addr.toLowerCase())) return true;
  if (!chain.roles) return false;
  try { return Boolean(await chain.roles.isAdmin(addr)); } catch { return false; }
}
