/**
 * Wallet-signed requests for Pages Functions. No cookies, no passwords: the server recovers the
 * signer from the signature and checks roles / receipts on-chain.
 *
 *   Authorization: RL <address>.<unixSeconds>.<signature>
 *   message      = "readlearc-auth\n<METHOD> <pathname>\n<ts>\n<sha256(body)>"
 */
import type { ethers } from "ethers";

export async function sha256Hex(text: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const authMessage = (method: string, pathname: string, ts: number, bodyHash: string) =>
  `readlearc-auth\n${method.toUpperCase()} ${pathname}\n${ts}\n${bodyHash}`;

export async function authHeader(signer: ethers.Signer, method: string, pathname: string, body: string): Promise<string> {
  const ts = Math.floor(Date.now() / 1000);
  const sig = await signer.signMessage(authMessage(method, pathname, ts, await sha256Hex(body)));
  return `RL ${await signer.getAddress()}.${ts}.${sig}`;
}

export async function signedJson<T = unknown>(signer: ethers.Signer | null, method: string, path: string, payload?: unknown): Promise<{ ok: boolean; status: number; data: T }> {
  const body = payload === undefined ? "" : JSON.stringify(payload);
  const headers: Record<string, string> = {};
  if (body) headers["Content-Type"] = "application/json";
  if (signer) headers["Authorization"] = await authHeader(signer, method, new URL(path, location.origin).pathname, body);
  const res = await fetch(path, { method, headers, body: body || undefined });
  let data: unknown = null;
  try { data = await res.json(); } catch { /* empty */ }
  return { ok: res.ok, status: res.status, data: data as T };
}
