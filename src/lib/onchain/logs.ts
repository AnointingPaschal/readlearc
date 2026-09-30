/** Event-log access with automatic range bisection, plus reading content bodies out of `Chunk` logs. */
import { ethers } from "ethers";
import { readProvider } from "@/lib/chain";
import { cfg } from "@/lib/config";
import ContentStoreAbi from "@/abi/ContentStore.json";
import SocialAbi from "@/abi/Social.json";
import PaymentsAbi from "@/abi/Payments.json";
import MonetizationAbi from "@/abi/Monetization.json";
import StreamPayAbi from "@/abi/StreamPay.json";

export const IFACES = {
  store: new ethers.Interface(ContentStoreAbi as ethers.InterfaceAbi),
  social: new ethers.Interface(SocialAbi as ethers.InterfaceAbi),
  pay: new ethers.Interface(PaymentsAbi as ethers.InterfaceAbi),
  mon: new ethers.Interface(MonetizationAbi as ethers.InterfaceAbi),
  stream: new ethers.Interface(StreamPayAbi as ethers.InterfaceAbi),
};

export const topic = (iface: ethers.Interface, name: string) => iface.getEvent(name)!.topicHash;
export const pad = (n: number | bigint | string) =>
  typeof n === "string" && n.startsWith("0x") ? ethers.zeroPadValue(n, 32) : ethers.zeroPadValue(ethers.toBeHex(n), 32);

let latestCache: { at: number; n: number } | null = null;
export async function latestBlock(): Promise<number> {
  if (latestCache && Date.now() - latestCache.at < 4000) return latestCache.n;
  const n = await readProvider().getBlockNumber();
  latestCache = { at: Date.now(), n };
  return n;
}

/**
 * eth_getLogs over [from,to]. RPC providers cap the block range and/or result size; on any error we
 * split the range in half and retry, so this adapts to whatever limit the endpoint enforces.
 */
export async function getLogsAuto(filter: { address: string; topics: (string | string[] | null)[] }, from: number, to: number, depth = 0): Promise<ethers.Log[]> {
  try {
    return await readProvider().getLogs({ ...filter, fromBlock: from, toBlock: to });
  } catch (e) {
    if (from >= to || depth > 24) throw e;
    const mid = Math.floor((from + to) / 2);
    const [a, b] = await Promise.all([
      getLogsAuto(filter, from, mid, depth + 1),
      getLogsAuto(filter, mid + 1, to, depth + 1),
    ]);
    return a.concat(b);
  }
}

export async function scan(address: string, topics: (string | string[] | null)[], from = cfg.startBlock): Promise<ethers.Log[]> {
  const to = await latestBlock();
  const logs = await getLogsAuto({ address, topics }, Math.min(from, to), to);
  return logs.sort((a, b) => a.blockNumber - b.blockNumber || a.index - b.index);
}

// ── block timestamps (cached) ─────────────────────────────────────
const tsCache = new Map<number, number>();
export async function blockTime(n: number): Promise<number> {
  if (tsCache.has(n)) return tsCache.get(n)!;
  const b = await readProvider().getBlock(n);
  const t = b?.timestamp ?? 0;
  tsCache.set(n, t);
  return t;
}
export async function blockTimes(ns: number[]): Promise<Map<number, number>> {
  const uniq = [...new Set(ns)];
  await Promise.all(uniq.map((n) => blockTime(n)));
  return tsCache;
}

// ── content chunks ────────────────────────────────────────────────
const CHUNK_TOPIC = topic(IFACES.store, "Chunk");

/** Chunks of `id`/`version` within [firstBlock,lastBlock]; optionally only some indices. */
export async function fetchChunks(
  id: number | bigint,
  version: number,
  firstBlock: number,
  lastBlock: number,
  indices?: number[],
): Promise<Map<number, Uint8Array>> {
  const out = new Map<number, Uint8Array>();
  const topics: (string | string[] | null)[] = [CHUNK_TOPIC, pad(id), pad(version)];
  if (indices) topics.push(indices.map((i) => pad(i)));
  const logs = await getLogsAuto({ address: cfg.contentStore, topics }, firstBlock, lastBlock);
  for (const l of logs) {
    const p = IFACES.store.parseLog(l)!;
    out.set(Number(p.args.index), ethers.getBytes(p.args.data));
  }
  return out;
}

export function orderedConcat(map: Map<number, Uint8Array>, count: number): Uint8Array {
  const parts: Uint8Array[] = [];
  let n = 0;
  for (let i = 0; i < count; i++) {
    const p = map.get(i);
    if (!p) throw new Error(`Missing on-chain chunk ${i + 1}/${count}`);
    parts.push(p);
    n += p.length;
  }
  const all = new Uint8Array(n);
  let o = 0;
  for (const p of parts) { all.set(p, o); o += p.length; }
  return all;
}

export async function fetchThumb(id: number | bigint, block: number): Promise<Uint8Array | null> {
  const logs = await getLogsAuto({ address: cfg.contentStore, topics: [topic(IFACES.store, "Thumb"), pad(id)] }, block, block);
  if (!logs.length) return null;
  return ethers.getBytes(IFACES.store.parseLog(logs[logs.length - 1])!.args.data);
}
