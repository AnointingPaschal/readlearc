/**
 * POST /api/content/key — releases AES keys for on-chain encrypted content.
 *
 * The content itself is public on the chain (as ciphertext). This function is the lock: it derives
 * per-content / per-segment keys with HMAC(master secret, label) and hands them out only when the
 * chain says the caller is entitled to them:
 *
 *   article  → author · admin · Payments.hasAccess(id, caller)  (paid the article, or subscribed)
 *   video    → author · admin · active subscriber of the creator → every segment
 *              anyone → segments inside the free-preview window
 *              viewers with an open StreamPay session → segments up to `paidSeconds + LOOKAHEAD`,
 *                where paidSeconds = voucher.amountOwed / ratePerSecond (signature + session verified on-chain)
 *
 * Body: { id, version, segments?: number[], session?: { id, amountOwed, signature } }
 *   (slot 0 of a video is the init segment, slot i+1 is media segment i)
 */
import { ethers } from "ethers";
import type { Env } from "../../_lib/env";
import { err, json } from "../../_lib/env";
import { authenticate } from "../../_lib/auth";
import { chainFor, isAdmin, type Chain } from "../../_lib/chain";
import { deriveKey } from "../../_lib/store";
import { gunzip, fromUtf8 } from "../../../src/lib/onchain/codec";

const LOOKAHEAD_SECS = 20;
const DOMAIN_TAG = "READLEARC_STREAM";

interface Manifest { dur: number; segs: { d: number }[] }
const manifestCache = new Map<string, Manifest>();

async function loadManifest(chain: Chain, id: number, version: number, first: number, last: number, chunkCount: number): Promise<Manifest> {
  const k = `${id}:${version}`;
  const hit = manifestCache.get(k);
  if (hit) return hit;
  const topic = chain.store!.interface.getEvent("Chunk")!.topicHash;
  const pad = (n: number) => ethers.zeroPadValue(ethers.toBeHex(n), 32);
  const logs = await chain.provider.getLogs({
    address: chain.cfg.contentStore, fromBlock: first, toBlock: last,
    topics: [topic, pad(id), pad(version), pad(chunkCount - 1)],
  });
  if (!logs.length) throw new Error("Video manifest not found on-chain");
  const data = chain.store!.interface.parseLog(logs[logs.length - 1])!.args.data as string;
  const m = JSON.parse(fromUtf8(await gunzip(ethers.getBytes(data)))) as Manifest;
  manifestCache.set(k, m);
  return m;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const text = await request.text();
  const chain = await chainFor(env);
  if (!chain.store || !chain.pay) return err("Contracts are not configured yet.", 503);
  const who = await authenticate(request, env, text, chain);
  if (!who) return err("Sign in with your wallet to request keys.", 401);

  let body: { id?: number; version?: number; segments?: number[]; session?: { id: string; amountOwed: string; signature: string } };
  try { body = JSON.parse(text); } catch { return err("Invalid JSON"); }
  const id = Number(body.id), version = Number(body.version);
  if (!id || !version) return err("id and version required");

  let c: ethers.Result;
  try { c = await chain.store.get(id); } catch { return err("Content not found", 404); }
  const author: string = c.author;
  const kind = Number(c.kind);
  const isOwner = author.toLowerCase() === who.address.toLowerCase();
  const privileged = isOwner || who.admin || (await isAdmin(env, chain, who.address));
  if (!c.encrypted && !privileged) return json({ keys: {}, paidThrough: 0, denied: [] });
  if (version > Number(c.version)) return err("Unknown version", 404);

  // ── article ──────────────────────────────────────────────────
  if (kind === 0) {
    if (!privileged && !(await chain.pay.hasAccess(id, who.address))) return err("Payment required to unlock this article.", 402);
    return json({ key: await deriveKey(env, `a/${id}/${version}`) });
  }

  // ── video ────────────────────────────────────────────────────
  const slots = [...new Set((body.segments ?? []).map(Number).filter((n) => Number.isInteger(n) && n >= 0))].slice(0, 400);
  if (!slots.length) return err("segments required");
  const label = (s: number) => `v/${id}/${version}/${s}`;
  const release = async (allowed: number[]) => {
    const keys: Record<string, string> = {};
    for (const s of allowed) keys[s] = await deriveKey(env, label(s));
    return keys;
  };

  if (privileged) return json({ keys: await release(slots), paidThrough: Infinity, denied: [] });
  if (!c.finalized || Number(c.status) !== 1) return err("Video is not available.", 403);

  let subscribed = false;
  try { subscribed = Boolean(await chain.pay.isSubscribed(author, who.address)); } catch { /* ignore */ }
  if (subscribed) return json({ keys: await release(slots), paidThrough: Infinity, denied: [] });

  const manifest = await loadManifest(chain, id, version, Number(c.firstBlock), Number(c.lastBlock), Number(c.chunkCount));
  const starts: number[] = [0]; // slot → start second (slot 0 = init, slot i+1 = segment i)
  let acc = 0;
  for (const s of manifest.segs) { starts.push(acc); acc += s.d; }

  const preview = Number(c.freePreviewSecs);
  let paidSecs = 0;
  const sess = body.session;
  if (sess && chain.stream) {
    try {
      const s = await chain.stream.getSession(sess.id);
      const rate = BigInt(s.ratePerSecond);
      const minRate = BigInt(c.price) * 10n ** 12n; // content price is USDC(6); sessions are native(18)
      const owed = BigInt(sess.amountOwed);
      const digest = ethers.getBytes(ethers.solidityPackedKeccak256(
        ["string", "uint256", "address", "bytes32", "uint256"],
        [DOMAIN_TAG, chain.cfg.chainId || 5042, chain.cfg.streamPay, sess.id, owed]));
      const signer = ethers.verifyMessage(digest, sess.signature);
      const ok =
        Number(s.status) === 0 &&
        String(s.viewer).toLowerCase() === who.address.toLowerCase() &&
        String(s.creator).toLowerCase() === author.toLowerCase() &&
        rate >= minRate && rate > 0n &&
        owed <= BigInt(s.deposit) &&
        signer.toLowerCase() === String(s.sessionKey).toLowerCase();
      if (ok) {
        paidSecs = Number(owed / rate);
        // Keep the best voucher so the creator can settle even if the viewer never closes the session.
        const prev = (await env.RL_KV.get(`voucher:${sess.id}`, "json")) as { amountOwed: string } | null;
        if (!prev || BigInt(prev.amountOwed) < owed) {
          await env.RL_KV.put(`voucher:${sess.id}`, JSON.stringify({ id: sess.id, amountOwed: owed.toString(), signature: sess.signature, creator: author, viewer: who.address, contentId: id, at: Date.now() }), { expirationTtl: 60 * 60 * 24 * 30 });
          await env.RL_KV.put(`vq:${author.toLowerCase()}:${sess.id}`, "1", { expirationTtl: 60 * 60 * 24 * 30 });
        }
      }
    } catch { /* invalid session → preview only */ }
  }

  const allowed: number[] = [];
  const denied: number[] = [];
  for (const slot of slots) {
    const start = slot === 0 ? 0 : starts[slot];
    const inPreview = start < preview;
    const paid = start < paidSecs + LOOKAHEAD_SECS && paidSecs > 0;
    (inPreview || paid ? allowed : denied).push(slot);
  }
  return json({ keys: await release(allowed), paidThrough: paidSecs, denied });
};
