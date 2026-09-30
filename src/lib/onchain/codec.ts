/**
 * Body codec for on-chain content.
 *
 *  container  := "RL" | version(1) | flags(1) | payload        flags bit0 = gzip
 *  stored     := container                       (free content)
 *             |  iv(12) | AES-256-GCM(container) (paid content; key released by /api/content/key)
 *
 * The stored bytes are split into chunks and emitted as `Chunk` logs by ContentStore.
 */
import { ethers } from "ethers";

const te = new TextEncoder();
const td = new TextDecoder();

export const utf8 = (s: string) => te.encode(s);
export const fromUtf8 = (b: Uint8Array) => td.decode(b);
export const hex2bytes = (h: string) => ethers.getBytes(h.startsWith("0x") ? h : "0x" + h);
export const bytes2hex = (b: Uint8Array) => ethers.hexlify(b);

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream as unknown as ReadableWritablePair<Uint8Array, Uint8Array>));
  return new Uint8Array(await out.arrayBuffer());
}
export const gzip = (b: Uint8Array) => pipe(b, new CompressionStream("gzip"));
export const gunzip = (b: Uint8Array) => pipe(b, new DecompressionStream("gzip"));

export function concat(parts: Uint8Array[]): Uint8Array {
  let n = 0;
  for (const p of parts) n += p.length;
  const out = new Uint8Array(n);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

export function splitChunks(bytes: Uint8Array, size: number): Uint8Array[] {
  const out: Uint8Array[] = [];
  for (let i = 0; i < bytes.length; i += size) out.push(bytes.subarray(i, Math.min(i + size, bytes.length)));
  return out.length ? out : [new Uint8Array(0)];
}

export async function pack(payload: Uint8Array, compress = true): Promise<Uint8Array> {
  const body = compress ? await gzip(payload) : payload;
  const head = new Uint8Array([0x52, 0x4c, 1, compress ? 1 : 0]);
  return concat([head, body]);
}

export async function unpack(container: Uint8Array): Promise<Uint8Array> {
  if (container[0] !== 0x52 || container[1] !== 0x4c) throw new Error("Not a Readlearc container");
  const body = container.subarray(4);
  return container[3] & 1 ? gunzip(body) : body;
}

async function aesKey(raw: Uint8Array, usage: KeyUsage) {
  return crypto.subtle.importKey("raw", raw as BufferSource, "AES-GCM", false, [usage]);
}

export async function aesEncrypt(rawKey: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(rawKey, "encrypt"), data as BufferSource));
  return concat([iv, ct]);
}

export async function aesDecrypt(rawKey: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const iv = data.slice(0, 12);
  const ct = data.slice(12);
  return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv }, await aesKey(rawKey, "decrypt"), ct));
}

export const hashBytes = (b: Uint8Array) => ethers.keccak256(b);

/** Encode text → stored bytes (optionally encrypted). */
export async function encodeText(text: string, key?: Uint8Array): Promise<Uint8Array> {
  const container = await pack(utf8(text), true);
  return key ? aesEncrypt(key, container) : container;
}

export async function decodeText(stored: Uint8Array, key?: Uint8Array): Promise<string> {
  const container = key ? await aesDecrypt(key, stored) : stored;
  return fromUtf8(await unpack(container));
}
