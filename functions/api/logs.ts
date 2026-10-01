import type { Env } from "../_lib/env";
import { err } from "../_lib/env";
import { chainFor } from "../_lib/chain";

/**
 * GET /api/logs?a=<contract>&t=<topics JSON>&f=<fromBlock>&v=<cache stamp> — read-only, edge-cached event logs
 * for the site's own contracts, plus the block timestamps involved. Replaces many slow browser→RPC round trips.
 */
const TTL = 15;
const TTL_RANGE = 3600; // explicit [from,to] ranges (content bodies, thumbnails) never change
const RANGE_ERR = /range|limit|exceed|too (many|large|big)|more than|10000|query returned|response size|max/i;
const hex = (n: number) => "0x" + n.toString(16);

async function rpc(url: string, calls: { method: string; params: unknown[] }[]) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(calls.map((c, i) => ({ jsonrpc: "2.0", id: i, ...c }))) });
  const j = (await res.json()) as any;
  const arr = Array.isArray(j) ? j : [j];
  return arr.sort((a, b) => a.id - b.id);
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env, waitUntil }) => {
  const url = new URL(request.url);
  const cache = (globalThis as any).caches?.default as Cache | undefined;
  const key = new Request(url.toString());
  if (cache) { const hit = await cache.match(key); if (hit) return hit; }
  try {
    const ch = await chainFor(env);
    const rpcUrl = ch.cfg.rpcUrl || "https://rpc.mainnet.arc.io";
    const allowed = [ch.cfg.roles, ch.cfg.contentStore, ch.cfg.social, ch.cfg.monetization, ch.cfg.payments, ch.cfg.streamPay].filter(Boolean).map((a) => String(a).toLowerCase());
    const address = String(url.searchParams.get("a") || "");
    if (!allowed.includes(address.toLowerCase())) return err("Unknown contract", 400);
    const topics = JSON.parse(url.searchParams.get("t") || "[]");
    if (!Array.isArray(topics) || topics.length > 4) return err("Bad topics", 400);
    const startBlock = Number(ch.cfg.startBlock || 0);
    const from = Math.max(Number(url.searchParams.get("f") || 0), 0);

    const latest = await ch.provider.getBlockNumber();
    const getLogs = async (a: number, b: number, depth = 0): Promise<any[]> => {
      try { return await ch.provider.send("eth_getLogs", [{ address, topics, fromBlock: hex(a), toBlock: hex(b) }]); }
      catch (e) {
        if (a >= b || depth > 6 || !RANGE_ERR.test(String((e as Error).message))) throw e;
        const mid = Math.floor((a + b) / 2);
        const [x, y] = await Promise.all([getLogs(a, mid, depth + 1), getLogs(mid + 1, b, depth + 1)]);
        return x.concat(y);
      }
    };
    const toQ = url.searchParams.get("to");
    const to = toQ ? Math.min(Number(toQ), latest) : latest;
    const raw = await getLogs(Math.min(Math.max(from, startBlock), to), to);
    const logs = raw.map((l) => ({ address: l.address, blockNumber: Number(l.blockNumber), index: Number(l.logIndex), transactionHash: l.transactionHash, topics: l.topics, data: l.data }));

    const times: Record<number, number> = {};
    const blocks = [...new Set(logs.map((l) => l.blockNumber))];
    if (blocks.length && blocks.length <= 200) {
      try {
        for (let i = 0; i < blocks.length; i += 100) {
          const part = blocks.slice(i, i + 100);
          const rs = await rpc(rpcUrl, part.map((b) => ({ method: "eth_getBlockByNumber", params: [hex(b), false] })));
          rs.forEach((r, k) => { if (r?.result?.timestamp) times[part[k]] = Number(r.result.timestamp); });
        }
      } catch { /* the browser fetches missing timestamps itself */ }
    }
    const res = new Response(JSON.stringify({ latest, logs, times }), { headers: { "Content-Type": "application/json", "Cache-Control": `public, max-age=${url.searchParams.has("to") ? TTL_RANGE : TTL}` } });
    if (cache) waitUntil(cache.put(key, res.clone()));
    return res;
  } catch (e) { return err((e as Error).message, 502); }
};
