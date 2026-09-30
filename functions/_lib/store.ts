import type { Env } from "./env";

/** Shape of the runtime config the SPA reads from /api/config (subset of src/lib/config.ts RLConfig). */
export interface RuntimeConfig {
  chainId: number; chainName: string; rpcUrl: string; explorerUrl: string; faucetUrl: string;
  usdc: string; roles: string; contentStore: string; social: string; monetization: string; payments: string;
  streamPay: string; treasury: string; startBlock: number; chunkBytes: number; txBytes: number;
}

const CONFIG_KEYS = ["chainId", "chainName", "rpcUrl", "explorerUrl", "faucetUrl", "usdc", "roles", "contentStore", "social", "monetization", "payments", "streamPay", "treasury", "startBlock", "chunkBytes", "txBytes"] as const;

/** Env defaults < KV (admin-saved). Only keys that have a value are returned. */
export async function getConfig(env: Env): Promise<Partial<RuntimeConfig>> {
  const fromEnv: Partial<RuntimeConfig> = {};
  const set = (k: keyof RuntimeConfig, v: string | undefined, num = false) => { if (v) (fromEnv as Record<string, unknown>)[k] = num ? Number(v) : v; };
  set("chainId", env.CHAIN_ID, true); set("chainName", env.CHAIN_NAME); set("rpcUrl", env.RPC_URL); set("explorerUrl", env.EXPLORER_URL);
  set("faucetUrl", env.FAUCET_URL); set("usdc", env.USDC_ADDRESS); set("roles", env.ROLES_ADDRESS); set("contentStore", env.CONTENT_STORE_ADDRESS);
  set("social", env.SOCIAL_ADDRESS); set("monetization", env.MONETIZATION_ADDRESS); set("payments", env.PAYMENTS_ADDRESS);
  set("streamPay", env.STREAM_PAY_ADDRESS); set("treasury", env.TREASURY_ADDRESS); set("startBlock", env.START_BLOCK, true);
  set("chunkBytes", env.CHUNK_BYTES, true); set("txBytes", env.TX_BYTES, true);
  const kv = ((await env.RL_KV.get("config", "json")) as Partial<RuntimeConfig> | null) ?? {};
  const out: Partial<RuntimeConfig> = { ...fromEnv };
  for (const [k, v] of Object.entries(kv)) if (v !== undefined && v !== null && v !== "") (out as Record<string, unknown>)[k] = v;
  return out;
}

export async function saveConfig(env: Env, patch: Record<string, unknown>) {
  const cur = ((await env.RL_KV.get("config", "json")) as Record<string, unknown> | null) ?? {};
  for (const k of CONFIG_KEYS) if (k in patch) cur[k] = patch[k];
  await env.RL_KV.put("config", JSON.stringify(cur));
  return cur;
}

export type Settings = Record<string, string>;
export const SECRET_KEY = /(api_key|secret|private|token|password)/i;

export async function getSettings(env: Env): Promise<Settings> {
  return ((await env.RL_KV.get("settings", "json")) as Settings | null) ?? {};
}
export async function saveSettings(env: Env, patch: Record<string, unknown>) {
  const cur = await getSettings(env);
  for (const [k, v] of Object.entries(patch)) cur[k] = String(v ?? "");
  await env.RL_KV.put("settings", JSON.stringify(cur));
}
export const publicSettings = (s: Settings): Settings => Object.fromEntries(Object.entries(s).filter(([k]) => !SECRET_KEY.test(k)));

/** Master secret for deriving content keys. */
let masterCache: string | null = null;
export async function masterSecret(env: Env): Promise<string> {
  if (env.CONTENT_MASTER_SECRET) return env.CONTENT_MASTER_SECRET;
  if (masterCache) return masterCache;
  let s = await env.RL_KV.get("master");
  if (!s) {
    s = Array.from(crypto.getRandomValues(new Uint8Array(32))).map((b) => b.toString(16).padStart(2, "0")).join("");
    await env.RL_KV.put("master", s);
    // re-read so concurrent first requests converge on the stored value
    s = (await env.RL_KV.get("master")) ?? s;
  }
  masterCache = s;
  return s;
}

export async function deriveKey(env: Env, label: string): Promise<string> {
  const secret = new TextEncoder().encode(await masterSecret(env));
  const k = await crypto.subtle.importKey("raw", secret, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(label)));
  return "0x" + Array.from(mac).map((b) => b.toString(16).padStart(2, "0")).join("");
}
