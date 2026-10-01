/**
 * Runtime configuration.
 *
 * Chain + contract addresses are edited by the admin (Admin → Site → Contracts) and stored in
 * Cloudflare KV; the SPA reads them from `/api/config` at boot. Build-time `VITE_*` variables are
 * used as defaults so the app also works without any backend (e.g. `vite dev` with no Functions).
 *
 * This module uses top-level await, so everything that imports it sees the final values.
 */
export interface RLConfig {
  chainId: number;
  chainName: string;
  rpcUrl: string;
  explorerUrl: string;
  faucetUrl: string;
  usdc: string;
  roles: string;
  contentStore: string;
  social: string;
  monetization: string;
  payments: string;
  streamPay: string;
  treasury: string;
  /** first block of the deployment — event scans start here */
  startBlock: number;
  /** max bytes of a single on-chain chunk (calldata/log) */
  chunkBytes: number;
  /** max bytes per upload transaction */
  txBytes: number;
}

const env = import.meta.env;

export const cfg: RLConfig = {
  chainId: Number(env.VITE_CHAIN_ID || 5042),
  chainName: env.VITE_CHAIN_NAME || "Arc",
  rpcUrl: env.VITE_RPC_URL || "https://rpc.mainnet.arc.io",
  explorerUrl: (env.VITE_EXPLORER_URL || "https://explorer.arc.io").replace(/\/$/, ""),
  faucetUrl: env.VITE_FAUCET_URL || "https://faucet.circle.com",
  usdc: env.VITE_USDC_ADDRESS || "0x3600000000000000000000000000000000000000",
  roles: env.VITE_ROLES_ADDRESS || "",
  contentStore: env.VITE_CONTENT_STORE_ADDRESS || "",
  social: env.VITE_SOCIAL_ADDRESS || "",
  monetization: env.VITE_MONETIZATION_ADDRESS || "",
  payments: env.VITE_PAYMENTS_ADDRESS || "",
  streamPay: env.VITE_STREAM_PAY_ADDRESS || "",
  treasury: env.VITE_TREASURY_ADDRESS || "",
  startBlock: Number(env.VITE_START_BLOCK || 0),
  chunkBytes: Number(env.VITE_CHUNK_BYTES || 24_000),
  txBytes: Number(env.VITE_TX_BYTES || 120_000),
};

const CFG_KEY = "rl-cfg-v1";
function applyRemote(remote: Partial<RLConfig>) {
  for (const [k, v] of Object.entries(remote)) {
    if (v !== undefined && v !== null && v !== "") (cfg as unknown as Record<string, unknown>)[k] = v;
  }
  cfg.explorerUrl = cfg.explorerUrl.replace(/\/$/, "");
}

async function fetchRemote(timeoutMs: number): Promise<boolean> {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeoutMs);
    const r = await fetch("/api/config", { signal: ctl.signal });
    clearTimeout(t);
    if (!r.ok) return false;
    const remote = (await r.json()) as Partial<RLConfig>;
    applyRemote(remote);
    try { localStorage.setItem(CFG_KEY, JSON.stringify(remote)); } catch { /* ignore */ }
    return true;
  } catch { return false; /* offline / no Functions (plain `vite dev`): keep build-time defaults */ }
}

/**
 * Runtime config (contract addresses etc.) from Cloudflare KV. Returning visitors start instantly from the
 * copy saved on this device while a fresh one loads in the background; first-time visitors wait for it.
 */
export async function loadConfig(timeoutMs = 4000): Promise<void> {
  let cached: Partial<RLConfig> | null = null;
  try { cached = JSON.parse(localStorage.getItem(CFG_KEY) || "null"); } catch { /* ignore */ }
  if (cached && Object.keys(cached).length) {
    applyRemote(cached);
    void fetchRemote(timeoutMs);
    return;
  }
  await fetchRemote(timeoutMs);
}

await loadConfig();

/** True once every contract address needed by the app is known. */
export const isConfigured = () =>
  !!(cfg.roles && cfg.contentStore && cfg.social && cfg.monetization && cfg.payments);

export const txUrl = (hash: string) => `${cfg.explorerUrl}/tx/${hash}`;
export const addressUrl = (a: string) => `${cfg.explorerUrl}/address/${a}`;
