/**
 * Content keys. Paid content is AES-GCM encrypted before it goes on-chain; the key for a piece of
 * content is derived server-side (HMAC of a master secret) and only released to wallets that the
 * chain says have access (Payments.hasAccess) — or, for video, that hold a funded StreamPay session.
 */
import type { ethers } from "ethers";
import { signedJson } from "@/lib/onchain/auth";
import { hex2bytes } from "@/lib/onchain/codec";

const cache = new Map<string, Uint8Array>();

export interface SessionProof { id: string; amountOwed: string; signature: string }

export async function getContentKey(signer: ethers.Signer, id: number, version: number): Promise<Uint8Array> {
  const k = `c:${id}:${version}`;
  const hit = cache.get(k);
  if (hit) return hit;
  const r = await signedJson<{ key?: string; error?: string }>(signer, "POST", "/api/content/key", { id, version });
  if (!r.ok || !r.data?.key) throw new Error(r.data?.error || `Key request failed (${r.status})`);
  const key = hex2bytes(r.data.key);
  cache.set(k, key);
  return key;
}

/** Video: keys for specific segments (server checks preview window / session voucher / receipts). */
export async function getSegmentKeys(
  signer: ethers.Signer | null,
  id: number,
  version: number,
  segments: number[],
  session?: SessionProof,
): Promise<{ keys: Map<number, Uint8Array>; paidThrough: number; denied: number[] }> {
  const keys = new Map<number, Uint8Array>();
  const need: number[] = [];
  for (const s of segments) {
    const hit = cache.get(`s:${id}:${version}:${s}`);
    if (hit) keys.set(s, hit); else need.push(s);
  }
  let paidThrough = 0;
  let denied: number[] = [];
  if (need.length) {
    const r = await signedJson<{ keys?: Record<string, string>; paidThrough?: number; denied?: number[]; error?: string }>(
      signer, "POST", "/api/content/key", { id, version, segments: need, session },
    );
    if (!r.ok) throw new Error(r.data?.error || `Key request failed (${r.status})`);
    for (const [seg, hex] of Object.entries(r.data.keys || {})) {
      const b = hex2bytes(hex);
      keys.set(Number(seg), b);
      cache.set(`s:${id}:${version}:${seg}`, b);
    }
    paidThrough = r.data.paidThrough ?? 0;
    denied = r.data.denied ?? [];
  }
  return { keys, paidThrough, denied };
}

export const clearKeyCache = () => cache.clear();
