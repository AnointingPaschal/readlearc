/**
 * Articles & videos on-chain: listing, reading, publishing, editing, moderation.
 * Metadata is read with a couple of eth_call range reads; bodies are read from Chunk logs.
 */
import { ethers } from "ethers";
import { C, lc, shortAddr, fmtUsdc, send } from "@/lib/chain";
import { cfg } from "@/lib/config";
import { onWrite } from "@/lib/freshness";
import { decodeText, encodeText, splitChunks, hashBytes, concat } from "@/lib/onchain/codec";
import { fetchChunks, orderedConcat, fetchThumb } from "@/lib/onchain/logs";
import { getContentKey } from "@/lib/onchain/keys";

export const STATUS = ["pending", "approved", "rejected", "removed"] as const;
export type StatusName = (typeof STATUS)[number] | "featured";

export interface Card {
  id: number;
  author: string;
  kind: 0 | 1;
  status: number;
  featured: boolean;
  finalized: boolean;
  isResearch: boolean;
  encrypted: boolean;
  hasThumb: boolean;
  version: number;
  readTime: number;
  durationSecs: number;
  freePreviewSecs: number;
  createdAt: number;
  thumbBlock: number;
  price: bigint;
  title: string;
  blurb: string;
  category: string;
  slug: string;
  reads: number;
}

export interface Content extends Card {
  preview: string;
  mime: string;
  chunkCount: number;
  firstBlock: number;
  lastBlock: number;
  updatedAt: number;
  bodyHash: string;
}

type RawCard = ethers.Result;
const toCard = (id: number, r: RawCard, reads = 0): Card => ({
  id,
  author: r.author,
  kind: Number(r.kind) as 0 | 1,
  status: Number(r.status),
  featured: r.featured,
  finalized: r.finalized,
  isResearch: r.isResearch,
  encrypted: r.encrypted,
  hasThumb: r.hasThumb,
  version: Number(r.version),
  readTime: Number(r.readTime),
  durationSecs: Number(r.durationSecs),
  freePreviewSecs: Number(r.freePreviewSecs),
  createdAt: Number(r.createdAt),
  thumbBlock: Number(r.thumbBlock),
  price: BigInt(r.price),
  title: r.title,
  blurb: r.blurb,
  category: r.category,
  slug: r.slug,
  reads,
});

// ── Listing (cached) ─────────────────────────────────────────────
// Three layers: in-memory (15s) → device cache (instant on return visits, refreshed in the background)
// → the edge-cached /api/cards list → finally the chain itself.
let cache: { at: number; cards: Card[] } | null = null;
let inflight: Promise<Card[]> | null = null;
const TTL = 15_000;
const LS_KEY = "rl-cards-v1";
const STALE_OK = 30 * 60_000;
let needFresh = false;

const ser = (cards: Card[]) => JSON.stringify(cards.map((c) => ({ ...c, price: c.price.toString() })));
const de = (rows: any[]): Card[] => rows.map((c) => ({ ...c, price: BigInt(c.price) }));

function readDevice(): { at: number; cards: Card[] } | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as { at: number; chain: string; cards: any[] };
    if (j.chain !== `${cfg.chainId}:${cfg.contentStore}`) return null;
    return { at: j.at, cards: de(j.cards) };
  } catch { return null; }
}
function writeDevice(cards: Card[]) {
  try { localStorage.setItem(LS_KEY, `{"at":${Date.now()},"chain":"${cfg.chainId}:${cfg.contentStore}","cards":${ser(cards)}}`); } catch { /* quota */ }
}

onWrite(() => invalidateContent());

export function invalidateContent() {
  cache = null; needFresh = true;
  try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
}

async function fetchFromEdge(fresh: boolean): Promise<Card[] | null> {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 12000);
    const r = await fetch(`/api/cards${fresh ? "?fresh=1" : ""}`, { signal: ctl.signal });
    clearTimeout(t);
    if (!r.ok) return null;
    const rows = await r.json();
    return Array.isArray(rows) ? de(rows) : null;
  } catch { return null; }
}

async function fetchFromChain(): Promise<Card[]> {
  const store = C.store();
  const total = Number(await store.count());
  if (!total) return [];
  const PAGE = 100;
  const ranges: [number, number][] = [];
  for (let s = 1; s <= total; s += PAGE) ranges.push([s, Math.min(s + PAGE - 1, total)]);
  const pay = C.pay();
  const out: Card[] = [];
  for (let i = 0; i < ranges.length; i += 4) {
    const parts = await Promise.all(
      ranges.slice(i, i + 4).map(async ([a, b]) => {
        const [rows, reads] = await Promise.all([
          store.getCards(a, b),
          pay.readsBatch(Array.from({ length: b - a + 1 }, (_, k) => a + k)),
        ]);
        return (rows as RawCard[]).map((r, k) => toCard(a + k, r, Number(reads[k])));
      }),
    );
    out.push(...parts.flat());
  }
  return out;
}

function refresh(fresh = false): Promise<Card[]> {
  if (inflight) return inflight;
  inflight = (async () => {
    const cards = (await fetchFromEdge(fresh || needFresh)) ?? (await fetchFromChain());
    needFresh = false;
    cache = { at: Date.now(), cards };
    writeDevice(cards);
    return cards;
  })().finally(() => { inflight = null; });
  return inflight;
}

export async function loadCards(force = false): Promise<Card[]> {
  if (!force && cache && Date.now() - cache.at < TTL) return cache.cards;
  if (!force) {
    const dev = readDevice();
    if (dev && Date.now() - dev.at < STALE_OK) {
      // show what we have right away, update behind the scenes
      cache = { at: Date.now() - TTL + 2000, cards: dev.cards };
      if (Date.now() - dev.at > 8000) refresh().catch(() => {});
      return dev.cards;
    }
  }
  return refresh(force);
}

export interface ListOpts {
  kind?: 0 | 1;
  author?: string;
  category?: string;
  q?: string;
  /** "public" = approved only; "all" = everything except nothing filtered; or a specific status name */
  status?: "public" | "all" | StatusName;
  featured?: boolean;
  isResearch?: boolean;
  limit?: number;
  offset?: number;
}

export async function listCards(o: ListOpts = {}): Promise<Card[]> {
  const all = await loadCards();
  const q = o.q?.toLowerCase();
  const res = all
    .filter((c) => (o.kind === undefined ? true : c.kind === o.kind))
    .filter((c) => (o.author ? lc(c.author) === lc(o.author) : true))
    .filter((c) => (o.category && o.category !== "All" ? c.category === o.category : true))
    .filter((c) => (o.featured ? c.featured && c.status === 1 : true))
    .filter((c) => (o.isResearch === undefined ? true : c.isResearch === o.isResearch))
    .filter((c) => (q ? c.title.toLowerCase().includes(q) || c.blurb.toLowerCase().includes(q) : true))
    .filter((c) => {
      const s = o.status ?? "public";
      if (s === "all") return true;
      if (s === "public" || s === "approved") return c.status === 1 && c.finalized;
      if (s === "featured") return c.status === 1 && c.featured;
      return STATUS[c.status] === s;
    })
    .sort((a, b) => b.id - a.id);
  const off = o.offset ?? 0;
  return res.slice(off, o.limit ? off + o.limit : undefined);
}

export async function getContent(id: number): Promise<Content | null> {
  try {
    const r = await C.store().get(id);
    const reads = Number(await C.pay().reads(id));
    return {
      ...toCard(id, r, reads),
      preview: r.preview,
      mime: r.mime,
      chunkCount: Number(r.chunkCount),
      firstBlock: Number(r.firstBlock),
      lastBlock: Number(r.lastBlock),
      updatedAt: Number(r.updatedAt),
      bodyHash: r.bodyHash,
    };
  } catch {
    return null;
  }
}

export async function getContentBySlug(slug: string): Promise<Content | null> {
  const id = Number(await C.store().idBySlug(slug));
  return id ? getContent(id) : null;
}

// ── Legacy JSON shapes used throughout the UI ────────────────────
export function articleJson(c: Card | Content, extra: Record<string, unknown> = {}) {
  const featured = c.featured && c.status === 1;
  return {
    id: String(c.id),
    title: c.title,
    blurb: c.blurb,
    content: null as string | null,
    price: fmtUsdc(c.price, 6).replace(/0+$/, "").replace(/\.$/, "") || "0",
    priceRaw: c.price.toString(),
    category: c.category,
    readTime: c.readTime,
    isResearch: c.isResearch,
    authorAddress: c.author,
    authorShort: shortAddr(c.author),
    status: featured ? "featured" : STATUS[c.status],
    featured: c.featured,
    reads: c.reads,
    timestamp: c.createdAt,
    encrypted: c.encrypted,
    finalized: c.finalized,
    ...extra,
  };
}

export function videoJson(c: Card | Content, thumb: string | null = null) {
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    blurb: c.blurb,
    creator_address: c.author,
    price_per_sec_usdc: (Number(c.price) / 1e6).toString(),
    free_preview_secs: c.freePreviewSecs,
    duration_seconds: c.durationSecs,
    hls_master_url: "",
    thumbnail_url: thumb,
    category: c.category,
    status: c.featured && c.status === 1 ? "approved" : STATUS[c.status],
    featured: c.featured,
    views: c.reads,
    total_seconds_sold: 0,
    created_at: new Date(c.createdAt * 1000).toISOString(),
    encrypted: c.encrypted,
    version: c.version,
  };
}

// ── Thumbnails ────────────────────────────────────────────────────
const thumbMem = new Map<number, string | null>();
export async function thumbDataUrl(c: Pick<Card, "id" | "hasThumb" | "thumbBlock">): Promise<string | null> {
  if (!c.hasThumb) return null;
  if (thumbMem.has(c.id)) return thumbMem.get(c.id)!;
  try {
    const cached = sessionStorage.getItem(`rl-thumb:${c.id}:${c.thumbBlock}`);
    if (cached) { thumbMem.set(c.id, cached); return cached; }
  } catch { /* storage unavailable */ }
  const bytes = await fetchThumb(c.id, c.thumbBlock).catch(() => null);
  if (!bytes) { thumbMem.set(c.id, null); return null; }
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  const url = `data:image/jpeg;base64,${btoa(bin)}`;
  thumbMem.set(c.id, url);
  try { sessionStorage.setItem(`rl-thumb:${c.id}:${c.thumbBlock}`, url); } catch { /* quota */ }
  return url;
}

// ── Access & body ─────────────────────────────────────────────────
export async function hasAccess(id: number, reader?: string): Promise<boolean> {
  if (!reader) return false;
  try { return await C.pay().hasAccess(id, reader); } catch { return false; }
}

/** Read and decode an article body. Paid content needs a wallet that has access (key is server-released). */
export async function readArticleBody(c: Content, signer?: ethers.Signer | null): Promise<string> {
  if (!c.finalized) throw new Error("This article is still being written to the chain.");
  const map = await fetchChunks(c.id, c.version, c.firstBlock, c.lastBlock);
  const stored = orderedConcat(map, c.chunkCount);
  if (ethers.keccak256(stored) !== c.bodyHash && c.bodyHash !== ethers.ZeroHash) {
    throw new Error("On-chain body failed its integrity check.");
  }
  let key: Uint8Array | undefined;
  if (c.encrypted) {
    if (!signer) throw new Error("Sign in to read this article.");
    key = await getContentKey(signer, c.id, c.version);
  }
  return decodeText(stored, key);
}

// ── Publishing ────────────────────────────────────────────────────
export interface ArticleInput {
  title: string;
  blurb?: string;
  content: string;
  price?: string | number;
  category?: string;
  readTime?: number;
  isResearch?: boolean;
}
type Progress = (detail?: string, pct?: number) => void;

function stripTags(h: string) { return h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); }

/** First ~55% of the article by whole blocks, capped for on-chain storage. Free for everyone. */
export function makePreview(html: string, cap = 3800): string {
  const blocks = html.split(/(?<=<\/(?:p|h[1-6]|ul|ol|blockquote|pre|table|div)>)|\n{2,}/).filter((b) => b.trim());
  if (blocks.length <= 1) return html.slice(0, Math.min(cap, Math.ceil(html.length * 0.55)));
  const limit = Math.min(cap, Math.ceil(html.length * 0.55));
  let out = "";
  for (const b of blocks) {
    if (out && out.length + b.length > limit) break;
    out += b + "\n";
    if (out.length > limit) break;
  }
  return out.slice(0, cap);
}

function metaTuple(i: ArticleInput, encrypted: boolean) {
  const words = stripTags(i.content).split(/\s+/).filter(Boolean).length;
  const price = ethers.parseUnits(String(Number(i.price ?? 0) || 0), 6);
  return {
    kind: 0, title: i.title.trim(), blurb: (i.blurb || "").slice(0, 900), category: i.category || "General", slug: "",
    preview: encrypted ? makePreview(i.content) : "", mime: "", price,
    readTime: i.readTime || Math.max(1, Math.ceil(words / 200)), durationSecs: 0, freePreviewSecs: 0,
    isResearch: !!i.isResearch, encrypted,
  };
}

async function gasFor(contract: ethers.Contract, fn: string, args: unknown[]): Promise<ethers.Overrides> {
  try {
    const est: bigint = await contract[fn].estimateGas(...args);
    return { gasLimit: (est * 125n) / 100n };
  } catch {
    return {};
  }
}

/** Write a stored body as chunk logs in byte-bounded batches, then finalize. */
export async function writeBody(signer: ethers.Signer, id: number, stored: Uint8Array, update?: Progress, extraLast?: Uint8Array) {
  const store = C.store(signer);
  const chunks = splitChunks(stored, cfg.chunkBytes);
  if (extraLast) chunks.push(extraLast);
  const batches: Uint8Array[][] = [];
  let cur: Uint8Array[] = [];
  let bytes = 0;
  for (const c of chunks) {
    if (cur.length && bytes + c.length > cfg.txBytes) { batches.push(cur); cur = []; bytes = 0; }
    cur.push(c); bytes += c.length;
  }
  if (cur.length) batches.push(cur);
  let idx = 0;
  for (let b = 0; b < batches.length; b++) {
    update?.(`Writing to chain · transaction ${b + 1}/${batches.length}`, 10 + (80 * b) / batches.length);
    const args = [id, idx, batches[b].map((x) => ethers.hexlify(x))];
    await send(store.writeChunks(...args, await gasFor(store, "writeChunks", args)));
    idx += batches[b].length;
  }
  update?.("Finalizing…", 95);
  const hash = hashBytes(concat(chunks));
  await send(store.finalize(id, chunks.length, hash));
}

export async function assertMonetized(addr: string) {
  if (!(await C.mon().isMonetized(addr))) {
    throw new Error("Paid content needs monetization, which isn’t enabled for your account yet. Publish for free, or apply in Dashboard → Monetization.");
  }
}

export async function publishArticle(signer: ethers.Signer, input: ArticleInput, update?: Progress): Promise<{ id: number; txHash: string }> {
  const author = await signer.getAddress();
  const paid = Number(input.price ?? 0) > 0;
  if (paid) await assertMonetized(author);
  const store = C.store(signer);
  update?.("Creating entry on-chain…", 4);
  const meta = metaTuple(input, paid);
  const rc = await send(store.create(meta, await gasFor(store, "create", [meta])));
  const ev = rc.logs.map((l) => { try { return store.interface.parseLog(l); } catch { return null; } }).find((p) => p?.name === "ContentCreated");
  if (!ev) throw new Error("Could not read the new content id from the receipt");
  const id = Number(ev.args.id);
  update?.(paid ? "Encrypting paid content…" : "Compressing…", 8);
  const key = paid ? await getContentKey(signer, id, 1) : undefined;
  const stored = await encodeText(input.content, key);
  await writeBody(signer, id, stored, update);
  invalidateContent();
  return { id, txHash: rc.hash };
}

export async function updateArticle(signer: ethers.Signer, id: number, patch: Partial<ArticleInput>, update?: Progress): Promise<void> {
  const author = await signer.getAddress();
  const cur = await getContent(id);
  if (!cur) throw new Error("Article not found");
  if (lc(cur.author) !== lc(author)) throw new Error("Only the author can edit this article.");
  const price = patch.price !== undefined ? Number(patch.price) : Number(cur.price) / 1e6;
  const paid = price > 0;
  if (paid) await assertMonetized(author);
  const store = C.store(signer);

  const contentChanged = patch.content !== undefined;
  const encryptionChanged = paid !== cur.encrypted;
  let html = patch.content;
  if (!contentChanged && encryptionChanged) {
    update?.("Reading current body…", 5);
    html = await readArticleBody(cur, signer);
  }
  const full: ArticleInput = {
    title: patch.title ?? cur.title,
    blurb: patch.blurb ?? cur.blurb,
    content: html ?? "",
    price,
    category: patch.category ?? cur.category,
    isResearch: patch.isResearch ?? cur.isResearch,
    readTime: patch.readTime ?? cur.readTime,
  };
  const meta = metaTuple(full, paid);
  if (!html) {
    // metadata-only edit; keep the stored preview
    meta.preview = cur.preview;
  } else if (!paid) {
    meta.preview = "";
  }
  update?.("Updating details on-chain…", 10);
  await send(store.update(id, meta, await gasFor(store, "update", [id, meta])));

  if (html) {
    update?.("Starting a new version…", 20);
    await send(store.beginRewrite(id));
    const version = cur.version + 1;
    const key = paid ? await getContentKey(signer, id, version) : undefined;
    await writeBody(signer, id, await encodeText(html, key), update);
  }
  invalidateContent();
}

// ── Moderation ────────────────────────────────────────────────────
export const STATUS_CODE: Record<string, number> = { pending: 0, approved: 1, rejected: 2, removed: 3 };

export async function setStatus(signer: ethers.Signer, id: number, status: string, featured?: boolean) {
  const store = C.store(signer);
  if (status === "featured") { await send(store.setStatus(id, 1)); await send(store.setFeatured(id, true)); }
  else {
    if (STATUS_CODE[status] !== undefined) await send(store.setStatus(id, STATUS_CODE[status]));
    if (featured !== undefined) await send(store.setFeatured(id, featured));
  }
  invalidateContent();
}

export async function removeContent(signer: ethers.Signer, id: number) {
  await send(C.store(signer).remove(id));
  invalidateContent();
}

// ── shapes used by pages ──
export type ArticleJson = ReturnType<typeof articleJson>;
export type DBArticle = ArticleJson;
export type HistoryItem = ArticleJson & { pricePaid: string; txHash: string; blockNumber: number; at?: number };

/** Articles a wallet has unlocked (from on-chain ArticlePaid receipts). */
export async function fetchReadingHistory(address: string): Promise<HistoryItem[]> {
  const { readerSpending } = await import("@/lib/onchain/money");
  const rows = (await readerSpending(address)).filter((r) => r.type === "read" && r.contentId);
  const cards = new Map((await loadCards()).map((c) => [c.id, c]));
  const out: HistoryItem[] = [];
  for (const r of rows) {
    const c = cards.get(r.contentId!);
    if (!c) continue;
    out.push({ ...articleJson(c), pricePaid: String(r.amount), txHash: r.hash, blockNumber: r.block, at: r.at });
  }
  return out;
}
