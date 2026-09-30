/**
 * GET /api/agent — machine-readable surface for AI agents.
 *
 *   /api/agent                      → catalogue of published articles + prices (public)
 *   /api/agent?contentId=12         → the article text, if the calling wallet has access on-chain.
 *                                     Authenticate with `Authorization: RL <addr>.<ts>.<sig>`
 *                                     (see src/lib/onchain/auth.ts). Otherwise HTTP 402 with the exact
 *                                     on-chain call to make: Payments.payToRead(contentId, referrer).
 *
 * Payment and access are on-chain (Payments.hasAccess) — there is no API account or card involved.
 */
import { ethers } from "ethers";
import type { Env } from "../_lib/env";
import { err, json } from "../_lib/env";
import { authenticate } from "../_lib/auth";
import { chainFor } from "../_lib/chain";
import { deriveKey } from "../_lib/store";
import { aesDecrypt, fromUtf8, hex2bytes, unpack } from "../../src/lib/onchain/codec";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const chain = await chainFor(env);
  if (!chain.store || !chain.pay) return err("Contracts are not configured.", 503);
  const url = new URL(request.url);
  const idParam = url.searchParams.get("contentId");

  if (!idParam) {
    const n = Number(await chain.store.count());
    const from = Math.max(1, n - 99);
    const cards = n ? await chain.store.getCards(from, n) : [];
    const items = cards
      .map((c: ethers.Result, i: number) => ({ c, id: from + i }))
      .filter(({ c }: { c: ethers.Result }) => Number(c.status) === 1 && c.finalized && Number(c.kind) === 0)
      .map(({ c, id }: { c: ethers.Result; id: number }) => ({
        id, title: c.title, blurb: c.blurb, category: c.category, author: c.author,
        priceUsdc: ethers.formatUnits(c.price, 6), url: `${url.origin}/article/${id}`,
      }));
    return json({
      name: "Readlearc", chainId: chain.cfg.chainId, payments: chain.cfg.payments, usdc: chain.cfg.usdc,
      howToPay: "approve USDC to `payments`, then call payToRead(contentId, referrer=0x0). Then GET /api/agent?contentId=<id> with a wallet-signed Authorization header.",
      articles: items,
    });
  }

  const id = Number(idParam);
  const who = await authenticate(request, env, "", chain);
  if (!who) return json({ error: "Wallet authentication required", scheme: "Authorization: RL <address>.<unixSeconds>.<signature>", message: "readlearc-auth\\n<METHOD> <pathname>\\n<ts>\\n<sha256(body)>" }, 401);

  let c: ethers.Result;
  try { c = await chain.store.get(id); } catch { return err("Not found", 404); }
  if (Number(c.kind) !== 0 || Number(c.status) !== 1 || !c.finalized) return err("Not available", 404);
  const allowed = who.admin || (await chain.pay.hasAccess(id, who.address));
  if (!allowed) {
    return json({ error: "Payment required", payment: { chainId: chain.cfg.chainId, contract: chain.cfg.payments, method: "payToRead(uint256,address)", args: [id, ethers.ZeroAddress], token: chain.cfg.usdc, amount: ethers.formatUnits(c.price, 6) } }, 402);
  }

  const topic = chain.store.interface.getEvent("Chunk")!.topicHash;
  const pad = (n: number) => ethers.zeroPadValue(ethers.toBeHex(n), 32);
  const logs = await chain.provider.getLogs({ address: chain.cfg.contentStore, fromBlock: Number(c.firstBlock), toBlock: Number(c.lastBlock), topics: [topic, pad(id), pad(Number(c.version))] });
  const parts = new Map<number, Uint8Array>();
  for (const l of logs) { const p = chain.store.interface.parseLog(l)!; parts.set(Number(p.args.index), ethers.getBytes(p.args.data)); }
  const chunks: Uint8Array[] = [];
  for (let i = 0; i < Number(c.chunkCount); i++) { const p = parts.get(i); if (!p) return err("Chunk missing on-chain", 502); chunks.push(p); }
  let stored = ethers.getBytes(ethers.concat(chunks));
  if (c.encrypted) stored = await aesDecrypt(hex2bytes(await deriveKey(env, `a/${id}/${Number(c.version)}`)), stored);
  const html = fromUtf8(await unpack(stored));
  return json({ id, title: c.title, author: c.author, category: c.category, content: html });
};
