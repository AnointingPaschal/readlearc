import { ethers } from "ethers";
import type { Env } from "./env";
import { getConfig, saveConfig, type RuntimeConfig } from "./store";
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

/**
 * Event scans must start at the block the contracts were deployed at; from block 0 a public RPC makes every page crawl.
 * If the config doesn't have it, find it once (binary search on eth_getCode) and remember it in KV.
 */
export async function ensureStartBlock(env: Env, cfg: Partial<RuntimeConfig>): Promise<number> {
  if (cfg.startBlock && cfg.startBlock > 0) return cfg.startBlock;
  const addr = cfg.contentStore || cfg.roles;
  if (!addr || !env.RL_KV) return 0;
  try {
    const rpc = cfg.rpcUrl || "https://rpc.mainnet.arc.io";
    const provider = new ethers.JsonRpcProvider(rpc, cfg.chainId || 5042, { staticNetwork: true, batchMaxCount: 1 });
    const latest = await provider.getBlockNumber();
    if ((await provider.getCode(addr, latest)) === "0x") return 0;
    let lo = 0, hi = latest;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if ((await provider.getCode(addr, mid)) === "0x") lo = mid + 1; else hi = mid;
    }
    const start = Math.max(0, lo - 1);
    await saveConfig(env, { startBlock: start });
    return start;
  } catch { return 0; /* RPC without historical state: keep scanning from 0 */ }
}
