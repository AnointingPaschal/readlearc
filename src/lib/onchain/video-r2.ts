/**
 * R2-backed video publishing.
 * The video file is uploaded to Cloudflare R2 via /api/video/upload.
 * Only the metadata (title, slug, price, duration, mime) is written on-chain — one cheap transaction.
 * The on-chain record has mime = "video/r2" so the player knows to use the R2 stream URL.
 */
import { ethers } from "ethers";
import { C, send } from "@/lib/chain";
import { apiFetch } from "@/lib/api";
import { invalidateContent } from "@/lib/onchain/content";
import { assertMonetized } from "@/lib/onchain/content";

export const VIDEO_R2_MIME = "video/r2";

export interface VideoR2Input {
  title: string;
  blurb?: string;
  slug: string;
  category?: string;
  pricePerSec: string | number;
  freePreviewSecs: number;
  durationSecs?: number;
}

type Progress = (detail?: string, pct?: number) => void;

/** Upload video to R2 and register metadata on-chain. One on-chain tx — no chunk writes. */
export async function publishVideoR2(
  signer: ethers.Signer,
  input: VideoR2Input,
  file: File,
  thumb: Uint8Array | null,
  update?: Progress,
): Promise<{ id: number; slug: string; videoUrl: string }> {
  const author = await signer.getAddress();
  const rate = ethers.parseUnits(String(Number(input.pricePerSec) || 0), 6);
  const paid = rate > 0n;
  if (paid) await assertMonetized(author);

  const store = C.store(signer);
  const slug = input.slug.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  if (!slug) throw new Error("Give the video a URL name.");
  if (Number(await store.idBySlug(slug))) throw new Error("That video URL name is already taken.");

  update?.("Registering video on-chain…", 10);
  const meta = {
    kind: 1,
    title: input.title.trim(),
    blurb: (input.blurb || "").slice(0, 900),
    category: input.category || "General",
    slug,
    preview: "",
    mime: VIDEO_R2_MIME,
    price: rate,
    readTime: 0,
    durationSecs: Math.round(input.durationSecs || 0),
    freePreviewSecs: Math.max(0, Math.round(input.freePreviewSecs)),
    isResearch: false,
    encrypted: false, // R2 videos are not chunk-encrypted (access controlled by StreamPay on player)
  };

  const rc = await send(store.create(meta));
  const ev = rc.logs
    .map((l) => { try { return store.interface.parseLog(l); } catch { return null; } })
    .find((p) => p?.name === "ContentCreated");
  const id = Number(ev?.args.id);
  if (!id) throw new Error("Could not read the new video id from the receipt");

  update?.("Uploading video file…", 30);

  // Build multipart form — use fetch directly so we can stream the File
  const form = new FormData();
  form.append("file", file, file.name);

  let thumbDataUrl: string | undefined;
  if (thumb) {
    let bin = "";
    thumb.forEach((b) => (bin += String.fromCharCode(b)));
    thumbDataUrl = `data:image/jpeg;base64,${btoa(bin)}`;
  }
  form.append("meta", JSON.stringify({ id, slug, title: input.title, ...(thumbDataUrl ? { thumb: thumbDataUrl } : {}) }));

  const res = await apiFetch("/api/video/upload", { method: "POST", body: form });
  if (!res.ok) {
    const e = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error((e as { error?: string }).error || "Upload failed");
  }
  const { videoUrl } = (await res.json()) as { videoUrl: string; thumbUrl?: string };

  update?.("Finalizing…", 95);
  invalidateContent();
  return { id, slug, videoUrl };
}
