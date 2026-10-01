import type { Env } from "./env";
import { getSettings } from "./store";
import { BankError } from "./bank";

/**
 * Circle developer-controlled wallets ("managed wallets"). Circle holds the keys for these wallets; WE authorise each operation with
 * the entity secret (32-byte hex). The entity secret is a Cloudflare secret (CIRCLE_ENTITY_SECRET) — never in KV, never sent to a browser.
 * Every request needs a fresh single-use `entitySecretCiphertext` = base64(RSA-OAEP-SHA256(secretBytes, Circle's public key)).
 */
export interface DcwCfg { key: string; base: string; entitySecret: string; walletSetId: string; blockchain: string; enabled: boolean; maxSendUsd: number }

export async function dcwCfg(env: Env): Promise<DcwCfg> {
  const s = await getSettings(env);
  const n = Number(s.dcw_max_send_usd);
  return {
    key: s.dcw_api_key || env.CIRCLE_DCW_API_KEY || "",
    base: env.DCW_BASE || "https://api.circle.com",
    entitySecret: (env.CIRCLE_ENTITY_SECRET || "").trim(),
    walletSetId: s.dcw_wallet_set_id || env.CIRCLE_WALLET_SET_ID || "",
    blockchain: s.dcw_blockchain || env.DCW_BLOCKCHAIN || "ARC-TESTNET",
    enabled: (s.dcw_enabled ?? "true") !== "false",
    maxSendUsd: Number.isFinite(n) && s.dcw_max_send_usd ? n : 1000,
  };
}
export const dcwReady = (c: DcwCfg) => Boolean(c.key && c.entitySecret && c.walletSetId && c.enabled);

export async function dcwCall(c: DcwCfg, path: string, init: RequestInit = {}) {
  if (!c.key) throw new BankError("Managed wallets aren't configured — add the Circle developer-wallet API key in Admin → Finance → Banking.", 503);
  let res: Response;
  try { res = await fetch(c.base + path, { ...init, headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${c.key}`, ...(init.headers || {}) } }); }
  catch (e) { throw new BankError(`Circle is unreachable: ${(e as Error).message}`, 502); }
  let data: any = null; try { data = await res.json(); } catch { /* empty */ }
  if (!res.ok) throw new BankError(String(data?.message || `Circle error ${res.status}`), res.status >= 400 && res.status < 500 ? res.status : 502, data);
  return data;
}

let pubCache: { key: CryptoKey; at: number } | null = null;
async function publicKey(c: DcwCfg): Promise<CryptoKey> {
  if (pubCache && Date.now() - pubCache.at < 3600_000) return pubCache.key;
  const d = await dcwCall(c, "/v1/w3s/config/entity/publicKey");
  const pem: string = d?.data?.publicKey || "";
  const der = Uint8Array.from(atob(pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "")), (ch) => ch.charCodeAt(0));
  const key = await crypto.subtle.importKey("spki", der, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["encrypt"]);
  pubCache = { key, at: Date.now() };
  return key;
}

/** A new ciphertext for every call (each is single-use). */
export async function ciphertext(c: DcwCfg): Promise<string> {
  if (!/^[0-9a-fA-F]{64}$/.test(c.entitySecret)) throw new BankError("CIRCLE_ENTITY_SECRET is missing or isn't 32 bytes of hex.", 503);
  const bytes = Uint8Array.from(c.entitySecret.match(/../g)!.map((h) => parseInt(h, 16)));
  const enc = new Uint8Array(await crypto.subtle.encrypt({ name: "RSA-OAEP" }, await publicKey(c), bytes));
  let bin = ""; for (const b of enc) bin += String.fromCharCode(b);
  return btoa(bin);
}

/** Deterministic UUID-shaped idempotency key, so a retried request can never create a second wallet / transfer. */
export async function idemKey(seed: string): Promise<string> {
  const h = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(seed)))).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

export interface Managed { walletId: string; address: string; blockchain: string; createdAt: number }
export const dcwKey = (a: string) => `dcw:${a.toLowerCase()}`;
export const getManaged = async (env: Env, a: string) => (await env.RL_KV.get(dcwKey(a), "json")) as Managed | null;
