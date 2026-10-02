/**
 * Community posts live in the GroupPosted event's `content` string.
 *   text only  → the plain text
 *   with photos → JSON {"v":2,"t":"text","i":["/api/media/<id>", …]}   (photos are stored off-chain; only the link goes on-chain)
 *   older posts  → JSON {"v":1,…,"i":["data:image/jpeg;base64,…"]}      (photo embedded in the post — still displayed)
 * Photos are compressed in the browser before upload.
 */
export interface PostBody { text: string; images: string[] }

export const MAX_IMAGES = 4;
/** characters of image data per photo after compression (uploaded off-chain, so this is only an upload size cap) */
export const PHOTO_BUDGET = 360_000;
export const MAX_TEXT = 4000;

export function encodePost(b: PostBody): string {
  return b.images.length ? JSON.stringify({ v: 1, t: b.text, i: b.images }) : b.text;
}

export function parsePost(content: string): PostBody {
  if (content.startsWith('{"v":1') || content.startsWith('{"v":2')) {
    try {
      const j = JSON.parse(content) as { t?: string; i?: string[] };
      return { text: j.t || "", images: (j.i || []).filter((x) => typeof x === "string" && (x.startsWith("data:image/") || /^\/api\/media\/[a-f0-9]{32}$/.test(x))) };
    } catch { /* fall through: treat as text */ }
  }
  return { text: content, images: [] };
}

/** Plain-text preview for lists / moderation views. */
export function postPreview(content: string): string {
  const b = parsePost(content);
  return (b.text || "").trim() + (b.images.length ? `${b.text ? "  " : ""}📷 ${b.images.length} photo${b.images.length > 1 ? "s" : ""}` : "");
}

/** Resize + JPEG-compress an image file until its data URL fits `budget` characters. */
export async function compressImage(file: File, budget: number): Promise<string> {
  const bitmap = await new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("That file couldn't be read as an image.")); };
    img.src = url;
  });
  let maxW = Math.min(1600, bitmap.naturalWidth);
  for (let attempt = 0; attempt < 8; attempt++) {
    const w = Math.max(64, Math.round(maxW));
    const h = Math.max(1, Math.round((bitmap.naturalHeight * w) / bitmap.naturalWidth));
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); // flatten transparency
    ctx.drawImage(bitmap, 0, 0, w, h);
    for (const q of [0.78, 0.66, 0.55, 0.45, 0.35]) {
      const d = canvas.toDataURL("image/jpeg", q);
      if (d.length <= budget) return d;
    }
    maxW *= 0.78;
  }
  throw new Error("That image is too detailed. Try a smaller one.");
}

/** Community posts reuse the article comment/reaction contracts under an id range far above any real content id. */
export const POST_BASE = 1_000_000_000_000;
export const postContentId = (postId: number | string) => String(POST_BASE + Number(postId));

/** Upload a compressed photo (data URL) and get its short link; only that link goes on-chain. */
export async function uploadPhoto(signer: import("ethers").Signer, dataUrl: string): Promise<string> {
  const { signedJson } = await import("@/lib/onchain/auth");
  const r = await signedJson<{ url?: string; error?: string }>(signer, "POST", "/api/media", { data: dataUrl });
  if (!r.ok || !r.data?.url) throw new Error(r.data?.error || "Couldn't upload the photo — please try again");
  return r.data.url;
}
