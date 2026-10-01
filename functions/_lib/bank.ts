import { ethers } from "ethers";
import type { Env } from "./env";
import { getSettings } from "./store";
import { authenticate, type Caller } from "./auth";

/**
 * Banking helpers: Circle (USD bank rails: wire accounts, deposits, withdrawals) and Flutterwave (Nigerian banks, NGN payouts).
 * Credentials come from Cloudflare env vars or, if unset, from Admin → Finance → Banking (saved in KV, never sent to the browser).
 */
export interface BankCfg {
  circleKey: string; circleBase: string; circleAccount: string; clientEntityId: string;
  flwKey: string; flwBase: string; flwHash: string;
  rate: number; feePct: number; minUsd: number; maxUsd: number; ngEnabled: boolean;
}

export async function bankCfg(env: Env): Promise<BankCfg> {
  const s = await getSettings(env);
  const prod = (s.circle_env || env.CIRCLE_ENV || "sandbox").toLowerCase() === "production";
  const num = (v: string | undefined, d: number) => { const n = Number(v); return Number.isFinite(n) && v !== "" && v !== undefined ? n : d; };
  return {
    circleKey: s.circle_api_key || env.CIRCLE_API_KEY || "",
    circleBase: env.CIRCLE_BASE || (prod ? "https://api.circle.com" : "https://api-sandbox.circle.com"),
    circleAccount: s.circle_account_id || env.CIRCLE_ACCOUNT_ID || "",
    clientEntityId: s.circle_client_entity_id || env.CIRCLE_CLIENT_ENTITY_ID || "",
    flwKey: s.flutterwave_secret_key || env.FLUTTERWAVE_SECRET_KEY || "",
    flwBase: env.FLUTTERWAVE_BASE || "https://api.flutterwave.com/v3",
    flwHash: s.flutterwave_webhook_secret || env.FLUTTERWAVE_WEBHOOK_HASH || "",
    rate: num(s.ngn_per_usd, 0), feePct: num(s.ngn_fee_pct, 1), minUsd: num(s.ngn_min_usd, 1), maxUsd: num(s.ngn_max_usd, 1000),
    ngEnabled: (s.ngn_enabled ?? "true") !== "false",
  };
}

export class BankError extends Error { constructor(msg: string, public status = 502, public detail?: unknown) { super(msg); } }

async function call(base: string, key: string, who: string, path: string, init: RequestInit = {}) {
  if (!key) throw new BankError(`${who} isn't configured yet — add the API key in Admin → Finance → Banking.`, 503);
  let res: Response;
  try {
    res = await fetch(base + path, { ...init, headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${key}`, ...(init.headers || {}) } });
  } catch (e) { throw new BankError(`${who} is unreachable: ${(e as Error).message}`, 502); }
  let data: any = null;
  try { data = await res.json(); } catch { /* empty */ }
  if (!res.ok || (who === "Flutterwave" && data && data.status === "error")) {
    const msg = data?.externalMessage || data?.message || data?.data?.complete_message || `${who} error ${res.status}`;
    throw new BankError(String(msg), res.status >= 400 && res.status < 500 ? res.status : 502, data);
  }
  return data;
}

export const circle = async (env: Env, path: string, init?: RequestInit) => { const c = await bankCfg(env); return call(c.circleBase, c.circleKey, "Circle", path, init); };
export const flutterwave = async (env: Env, path: string, init?: RequestInit) => { const c = await bankCfg(env); return call(c.flwBase, c.flwKey, "Flutterwave", path, init); };

export const qs = (o: Record<string, string | number | undefined | null>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  const s = p.toString(); return s ? `?${s}` : "";
};

/** Verified wallet caller (or a 401 Response). */
export async function requireUser(request: Request, env: Env, body = ""): Promise<Caller | Response> {
  const who = await authenticate(request, env, body);
  if (!who) return new Response(JSON.stringify({ error: "Sign in with your wallet first" }), { status: 401, headers: { "Content-Type": "application/json" } });
  return who;
}

// ── per-user records in KV ──
export const lc = (a: string) => a.toLowerCase();
export async function kvList<T>(env: Env, key: string): Promise<T[]> { return ((await env.RL_KV.get(key, "json")) as T[] | null) ?? []; }
export async function kvPush<T>(env: Env, key: string, item: T, cap = 200) {
  const cur = await kvList<T>(env, key);
  await env.RL_KV.put(key, JSON.stringify([item, ...cur].slice(0, cap)));
}
export async function kvPatch<T extends { id: string }>(env: Env, key: string, id: string, patch: Partial<T>) {
  const cur = await kvList<T>(env, key);
  const i = cur.findIndex((x) => x.id === id);
  if (i >= 0) { cur[i] = { ...cur[i], ...patch }; await env.RL_KV.put(key, JSON.stringify(cur)); return cur[i]; }
  return null;
}

export interface WireLink { id: string; description: string; trackingRef?: string; status?: string; holder?: string; createdAt: number }
/** accountNumber is kept server-side only (Flutterwave pays by bank code + number) and is stripped before anything is sent to the browser. */
export interface NgAccount { id: string; bankCode: string; bankName: string; accountName: string; last4: string; accountNumber?: string; createdAt: number }
export const publicAcct = ({ accountNumber, ...rest }: NgAccount) => ({ ...rest, ready: Boolean(accountNumber) });
export interface Cashout { id: string; txHash: string; address: string; amountUsd: number; feeUsd: number; rate: number; ngn: number; bankName: string; accountName: string; last4: string; status: "processing" | "success" | "failed" | "reversed"; transferCode?: string; error?: string; createdAt: number; updatedAt?: number }

export const wiresKey = (a: string) => `bank:wires:${lc(a)}`;
export const ngKey = (a: string) => `bank:ng:${lc(a)}`;
export const cashKey = (a: string) => `bank:cash:${lc(a)}`;
export const CASH_ALL = "bank:cash:all";

/** Common Nigerian bank codes (CBN/NIP), used only if Flutterwave can't be reached for the live list. */
export const NG_BANKS_FALLBACK: { name: string; code: string }[] = [
  { name: "Access Bank", code: "044" }, { name: "Citibank Nigeria", code: "023" }, { name: "Ecobank Nigeria", code: "050" },
  { name: "Fidelity Bank", code: "070" }, { name: "First Bank of Nigeria", code: "011" }, { name: "First City Monument Bank", code: "214" },
  { name: "Globus Bank", code: "00103" }, { name: "Guaranty Trust Bank", code: "058" }, { name: "Heritage Bank", code: "030" },
  { name: "Keystone Bank", code: "082" }, { name: "Kuda Microfinance Bank", code: "50211" }, { name: "Moniepoint MFB", code: "50515" },
  { name: "OPay Digital Services", code: "999992" }, { name: "PalmPay", code: "999991" }, { name: "Polaris Bank", code: "076" },
  { name: "Providus Bank", code: "101" }, { name: "Stanbic IBTC Bank", code: "221" }, { name: "Standard Chartered Bank", code: "068" },
  { name: "Sterling Bank", code: "232" }, { name: "SunTrust Bank", code: "100" }, { name: "Titan Trust Bank", code: "000025" },
  { name: "Union Bank of Nigeria", code: "032" }, { name: "United Bank For Africa", code: "033" }, { name: "Unity Bank", code: "215" },
  { name: "Wema Bank", code: "035" }, { name: "Zenith Bank", code: "057" },
];

export const sha = async (t: string, algo = "SHA-256") => Array.from(new Uint8Array(await crypto.subtle.digest(algo, new TextEncoder().encode(t)))).map((b) => b.toString(16).padStart(2, "0")).join("");

export function errResp(e: unknown) {
  const be = e as BankError;
  return new Response(JSON.stringify({ error: be.message || "Bank request failed" }), { status: be.status || 500, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}

export const isResp = (x: unknown): x is Response => x instanceof Response;
export { ethers };
