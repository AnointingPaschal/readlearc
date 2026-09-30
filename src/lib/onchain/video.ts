/**
 * Video on-chain.
 *
 *  Upload:  file → (ffmpeg.wasm, in the browser) → fMP4 HLS segments → each segment AES-GCM
 *           encrypted (paid video) → written as Chunk logs → manifest as the final chunk.
 *  Play:    manifest → synthetic HLS playlist → hls.js with a loader that pulls segments straight
 *           out of chain logs, decrypting with keys the server releases only for paid seconds.
 *
 *  Stream layout (chunk indices):  [ init ][ seg0 ][ seg1 ] … [ manifest ]
 */
import { ethers } from "ethers";
import { C, send } from "@/lib/chain";
import { cfg } from "@/lib/config";
import { aesDecrypt, aesEncrypt, concat, fromUtf8, gunzip, gzip, hashBytes, splitChunks, utf8 } from "@/lib/onchain/codec";
import { fetchChunks, orderedConcat } from "@/lib/onchain/logs";
import { getSegmentKeys, type SessionProof } from "@/lib/onchain/keys";
import { assertMonetized, getContent, invalidateContent, type Content } from "@/lib/onchain/content";

export const VIDEO_MIME = "application/x-rl-hls+fmp4";

export interface Segmented {
  init: Uint8Array;
  segments: { data: Uint8Array; dur: number }[];
  duration: number;
  thumb?: Uint8Array; // jpeg
}

export interface VideoManifest {
  v: 1;
  dur: number;
  /** [startChunk, endChunk) of the init segment */
  init: [number, number];
  segs: { d: number; c: [number, number] }[];
}

type Progress = (detail?: string, pct?: number) => void;

// ── Segmenting with ffmpeg.wasm (runs in the creator's browser) ──────────────
const CORE = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";

export interface SegmentOptions { transcode: boolean; height: number; segSeconds: number }

export async function segmentWithFfmpeg(file: File, opt: SegmentOptions, update?: Progress): Promise<Segmented> {
  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const { fetchFile, toBlobURL } = await import("@ffmpeg/util");
  const ff = new FFmpeg();
  update?.("Loading video engine (first time ~30 MB)…", 2);
  await ff.load({
    coreURL: await toBlobURL(`${CORE}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${CORE}/ffmpeg-core.wasm`, "application/wasm"),
  });
  ff.on("progress", ({ progress }) => update?.(opt.transcode ? "Compressing & segmenting…" : "Segmenting…", 5 + Math.min(1, Math.max(0, progress)) * 40));
  await ff.writeFile("in", await fetchFile(file));

  const hls = [
    "-f", "hls", "-hls_time", String(opt.segSeconds), "-hls_playlist_type", "vod",
    "-hls_segment_type", "fmp4", "-hls_fmp4_init_filename", "init.mp4", "-hls_segment_filename", "seg%d.m4s", "out.m3u8",
  ];
  const copy = ["-i", "in", "-c", "copy", ...hls];
  const enc = [
    "-i", "in", "-vf", `scale=-2:${opt.height}`, "-c:v", "libx264", "-preset", "veryfast", "-crf", "30",
    "-force_key_frames", `expr:gte(t,n_forced*${opt.segSeconds})`, "-c:a", "aac", "-b:a", "64k", "-ac", "2", ...hls,
  ];
  let code = await ff.exec(opt.transcode ? enc : copy);
  if (code !== 0 && !opt.transcode) {
    update?.("Source isn’t stream-copyable — re-encoding…", 6);
    code = await ff.exec(enc);
  }
  if (code !== 0) throw new Error("Could not process this video. Try an MP4 (H.264/AAC).");

  const playlist = fromUtf8((await ff.readFile("out.m3u8")) as Uint8Array);
  const names: string[] = [];
  const durs: number[] = [];
  const lines = playlist.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^#EXTINF:([\d.]+)/);
    if (m) { durs.push(parseFloat(m[1])); names.push(lines[i + 1].trim()); }
  }
  if (!names.length) throw new Error("No segments were produced.");
  const init = (await ff.readFile("init.mp4")) as Uint8Array;
  const segments: Segmented["segments"] = [];
  for (let i = 0; i < names.length; i++) segments.push({ data: (await ff.readFile(names[i])) as Uint8Array, dur: durs[i] });

  let thumb: Uint8Array | undefined;
  try { thumb = await captureThumb(file); } catch { /* optional */ }
  ff.terminate();
  return { init, segments, duration: durs.reduce((a, b) => a + b, 0), thumb };
}

/** ~1s-in frame as a small JPEG, via <video>+<canvas>. */
export async function captureThumb(file: Blob, width = 480): Promise<Uint8Array> {
  const url = URL.createObjectURL(file);
  try {
    const v = document.createElement("video");
    v.muted = true; v.preload = "auto"; v.src = url; v.playsInline = true;
    await new Promise<void>((res, rej) => { v.onloadeddata = () => res(); v.onerror = () => rej(new Error("thumb")); });
    v.currentTime = Math.min(1, (v.duration || 2) / 2);
    await new Promise<void>((res) => { v.onseeked = () => res(); });
    const c = document.createElement("canvas");
    c.width = width; c.height = Math.round((width * v.videoHeight) / v.videoWidth) || Math.round((width * 9) / 16);
    c.getContext("2d")!.drawImage(v, 0, 0, c.width, c.height);
    const blob: Blob = await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("thumb"))), "image/jpeg", 0.72));
    return new Uint8Array(await blob.arrayBuffer());
  } finally { URL.revokeObjectURL(url); }
}

// ── Publishing ─────────────────────────────────────────────────────
export interface VideoInput {
  title: string; blurb?: string; slug: string; category?: string;
  pricePerSec: string | number; freePreviewSecs: number;
}

/** Rough cost helper for the upload UI: bytes → on-chain gas. */
export function estimateUploadBytes(seg: Segmented) {
  return seg.init.length + seg.segments.reduce((a, s) => a + s.data.length, 0);
}

export async function publishVideo(signer: ethers.Signer, input: VideoInput, seg: Segmented, update?: Progress): Promise<{ id: number; slug: string }> {
  const author = await signer.getAddress();
  const rate = ethers.parseUnits(String(Number(input.pricePerSec) || 0), 6);
  const paid = rate > 0n;
  if (paid) await assertMonetized(author);
  const store = C.store(signer);
  const slug = input.slug.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  if (!slug) throw new Error("Give the video a URL name.");
  if (Number(await store.idBySlug(slug))) throw new Error("That video URL name is already taken.");

  update?.("Creating video entry on-chain…", 46);
  const meta = {
    kind: 1, title: input.title.trim(), blurb: (input.blurb || "").slice(0, 900), category: input.category || "General", slug,
    preview: "", mime: VIDEO_MIME, price: rate, readTime: 0, durationSecs: Math.round(seg.duration),
    freePreviewSecs: Math.max(0, Math.round(input.freePreviewSecs)), isResearch: false, encrypted: paid,
  };
  const rc = await send(store.create(meta));
  const ev = rc.logs.map((l) => { try { return store.interface.parseLog(l); } catch { return null; } }).find((p) => p?.name === "ContentCreated");
  const id = Number(ev?.args.id);
  if (!id) throw new Error("Could not read the new video id");

  // keys: slot 0 = init, slot i+1 = segment i
  const slots = seg.segments.length + 1;
  let keys: Map<number, Uint8Array> | null = null;
  if (paid) {
    update?.("Requesting encryption keys…", 48);
    const r = await getSegmentKeys(signer, id, 1, Array.from({ length: slots }, (_, i) => i));
    keys = r.keys;
    if (keys.size < slots) throw new Error("Key server did not return all keys.");
  }

  const pieces: Uint8Array[] = [];
  const layout: [number, number][] = [];
  const addBlob = async (data: Uint8Array, slot: number) => {
    const stored = keys ? await aesEncrypt(keys.get(slot)!, data) : data;
    const cs = splitChunks(stored, cfg.chunkBytes);
    const start = pieces.length;
    pieces.push(...cs);
    layout.push([start, pieces.length]);
  };
  update?.("Encrypting…", 50);
  await addBlob(seg.init, 0);
  for (let i = 0; i < seg.segments.length; i++) await addBlob(seg.segments[i].data, i + 1);

  const manifest: VideoManifest = {
    v: 1, dur: seg.duration, init: layout[0],
    segs: seg.segments.map((s, i) => ({ d: Math.round(s.dur * 1000) / 1000, c: layout[i + 1] })),
  };
  const mBytes = await gzip(utf8(JSON.stringify(manifest)));

  // writeBody splits by chunkBytes; we already chunked, so feed pre-split pieces through a joiner
  await writeChunkList(signer, id, pieces, mBytes, update);

  if (seg.thumb && seg.thumb.length <= 59_000) {
    update?.("Saving thumbnail…", 97);
    await send(store.setThumb(id, ethers.hexlify(seg.thumb))).catch(() => {});
  }
  invalidateContent();
  return { id, slug };
}

/** Like writeBody but for a pre-chunked list (video segments keep their chunk boundaries). */
async function writeChunkList(signer: ethers.Signer, id: number, pieces: Uint8Array[], manifest: Uint8Array, update?: Progress) {
  const store = C.store(signer);
  const all = [...pieces, manifest];
  const batches: Uint8Array[][] = [];
  let cur: Uint8Array[] = [];
  let bytes = 0;
  for (const c of all) {
    if (cur.length && bytes + c.length > cfg.txBytes) { batches.push(cur); cur = []; bytes = 0; }
    cur.push(c); bytes += c.length;
  }
  if (cur.length) batches.push(cur);
  let idx = 0;
  for (let b = 0; b < batches.length; b++) {
    update?.(`Writing to chain · transaction ${b + 1}/${batches.length}`, 55 + (40 * b) / batches.length);
    const args = [id, idx, batches[b].map((x) => ethers.hexlify(x))];
    let gas: ethers.Overrides = {};
    try { gas = { gasLimit: ((await store.writeChunks.estimateGas(...args)) * 125n) / 100n }; } catch { /* let node estimate */ }
    await send(store.writeChunks(...args, gas));
    idx += batches[b].length;
  }
  update?.("Finalizing…", 96);
  await send(store.finalize(id, all.length, hashBytes(concat(all))));
}

// ── Playback ───────────────────────────────────────────────────────
export async function loadManifest(c: Content): Promise<VideoManifest> {
  const last = c.chunkCount - 1;
  const m = await fetchChunks(c.id, c.version, c.firstBlock, c.lastBlock, [last]);
  const raw = m.get(last);
  if (!raw) throw new Error("Video manifest not found on-chain");
  return JSON.parse(fromUtf8(await gunzip(raw))) as VideoManifest;
}

export function buildPlaylist(m: VideoManifest): string {
  const target = Math.ceil(Math.max(...m.segs.map((s) => s.d)));
  const out = ["#EXTM3U", "#EXT-X-VERSION:7", `#EXT-X-TARGETDURATION:${target}`, "#EXT-X-MEDIA-SEQUENCE:0", "#EXT-X-PLAYLIST-TYPE:VOD", '#EXT-X-MAP:URI="rl://init"'];
  m.segs.forEach((s, i) => { out.push(`#EXTINF:${s.d.toFixed(3)},`, `rl://seg/${i}`); });
  out.push("#EXT-X-ENDLIST");
  return out.join("\n");
}

export const segStart = (m: VideoManifest, i: number) => m.segs.slice(0, i).reduce((a, s) => a + s.d, 0);

export interface PlayerCtx {
  content: Content;
  manifest: VideoManifest;
  signer: ethers.Signer | null;
  /** latest voucher from the billing loop (or undefined while only previewing / subscribed) */
  getSession: () => SessionProof | undefined;
  onDenied?: (seg: number, paidThrough: number) => void;
}

/** hls.js loader factory: resolves rl:// URLs from chain logs and decrypts them. */
export function makeChainLoader(ctx: PlayerCtx, DefaultLoader: new (cfg: unknown) => unknown) {
  const { content: c, manifest: m } = ctx;
  return class ChainLoader {
    private def: { load: (...a: unknown[]) => void; abort: () => void; destroy: () => void; stats?: unknown; context?: unknown };
    context: unknown; stats: unknown = { aborted: false, loaded: 0, retry: 0, total: 0, chunkCount: 0, bwEstimate: 0, loading: { start: 0, first: 0, end: 0 }, parsing: { start: 0, end: 0 }, buffering: { start: 0, first: 0, end: 0 } };
    private aborted = false;
    constructor(config: unknown) { this.def = new DefaultLoader(config) as typeof this.def; }
    destroy() { this.aborted = true; this.def.destroy(); }
    abort() { this.aborted = true; this.def.abort(); }
    load(context: { url: string; responseType?: string }, config: unknown, callbacks: { onSuccess: (r: unknown, s: unknown, c: unknown, n?: unknown) => void; onError: (e: unknown, c: unknown, n: unknown, s: unknown) => void }) {
      this.context = context;
      if (!context.url.startsWith("rl://")) return this.def.load(context, config, callbacks);
      const t0 = performance.now();
      const st = this.stats as { loading: { start: number; first: number; end: number }; loaded: number; total: number };
      st.loading.start = t0;
      this.fetchSeg(context.url).then(
        (data) => {
          if (this.aborted) return;
          st.loading.first = st.loading.end = performance.now();
          st.loaded = st.total = data.byteLength;
          callbacks.onSuccess({ url: context.url, data }, this.stats, context, undefined);
        },
        (err) => callbacks.onError({ code: 403, text: (err as Error).message }, context, null, this.stats),
      );
    }
    private async fetchSeg(url: string): Promise<ArrayBuffer> {
      const isInit = url === "rl://init";
      const i = isInit ? -1 : Number(url.split("/").pop());
      const slot = i + 1;
      const [a, b] = isInit ? m.init : m.segs[i].c;
      const map = await fetchChunks(c.id, c.version, c.firstBlock, c.lastBlock, Array.from({ length: b - a }, (_, k) => a + k));
      let stored = orderedConcat(new Map([...map].map(([k, v]) => [k - a, v])), b - a);
      if (c.encrypted) {
        const { keys, paidThrough, denied } = await getSegmentKeys(ctx.signer, c.id, c.version, [slot], ctx.getSession());
        const key = keys.get(slot);
        if (!key) { ctx.onDenied?.(i, paidThrough); throw new Error(denied.length ? "Payment required for this part of the video" : "No key"); }
        stored = await aesDecrypt(key, stored);
      }
      return stored.buffer.slice(stored.byteOffset, stored.byteOffset + stored.byteLength) as ArrayBuffer;
    }
  };
}

export async function getVideo(slug: string): Promise<Content | null> {
  const id = Number(await C.store().idBySlug(slug.toLowerCase()));
  return id ? getContent(id) : null;
}
