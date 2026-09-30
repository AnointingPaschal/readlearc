import { ethers } from "ethers";
import type { Env } from "./env";
import { chainFor, isAdmin, type Chain } from "./chain";

/** Mirrors src/lib/onchain/auth.ts — the wallet signs "readlearc-auth\n<METHOD> <path>\n<ts>\n<sha256(body)>". */
const authMessage = (method: string, pathname: string, ts: number, bodyHash: string) => `readlearc-auth\n${method.toUpperCase()} ${pathname}\n${ts}\n${bodyHash}`;

async function sha256Hex(text: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface Caller { address: string; admin: boolean }

/** Returns the verified caller, or null when there's no/invalid/expired Authorization header. */
export async function authenticate(request: Request, env: Env, bodyText: string, chain?: Chain): Promise<Caller | null> {
  const h = request.headers.get("Authorization");
  if (!h?.startsWith("RL ")) return null;
  const [addr, tsStr, sig] = h.slice(3).split(".");
  const ts = Number(tsStr);
  if (!addr || !sig || !ts || !ethers.isAddress(addr)) return null;
  if (Math.abs(Date.now() / 1000 - ts) > 300) return null;
  try {
    const path = new URL(request.url).pathname;
    const recovered = ethers.verifyMessage(authMessage(request.method, path, ts, await sha256Hex(bodyText)), sig);
    if (recovered.toLowerCase() !== addr.toLowerCase()) return null;
    const c = chain ?? (await chainFor(env));
    return { address: ethers.getAddress(addr), admin: await isAdmin(env, c, addr) };
  } catch { return null; }
}
