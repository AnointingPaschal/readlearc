/** Helpers for the admin AI Writer: markdown → clean HTML with generated images, and plain-text clean-up for posts. */
import { toHtml } from "@/lib/markdown";

const MARK = /^\s*\[\[\s*IMAGE\s*:\s*([\s\S]*?)\]\]\s*$/gim;

/** The image prompts the model asked for, in order. */
export function imageMarkers(md: string): string[] {
  return Array.from(md.matchAll(MARK)).map((m) => m[1].trim()).filter(Boolean);
}

/** Re-encode a (possibly huge) generated image as a compact JPEG so it is cheap to store on-chain. */
export function shrinkImage(src: string, maxW = 960, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const sc = Math.min(1, maxW / img.width);
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
      const x = c.getContext("2d");
      if (!x) return reject(new Error("canvas unavailable"));
      x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
      x.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("bad image"));
    img.src = src;
  });
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** Markdown (with [[IMAGE: …]] markers) → HTML. `images[i]` replaces the i-th marker; markers without an image are dropped. */
export function markdownToArticleHtml(md: string, images: (string | null)[]): string {
  const prompts = imageMarkers(md);
  let i = 0;
  const withTokens = md.replace(MARK, () => `\n\n@@IMG${i++}@@\n\n`);
  let html = toHtml(withTokens);
  html = html.replace(/<p>\s*@@IMG(\d+)@@\s*<\/p>|@@IMG(\d+)@@/g, (_m, a, b) => {
    const n = Number(a ?? b), src = images[n];
    if (!src) return "";
    return `<figure style="margin:20px 0;text-align:center"><img src="${src}" alt="${esc(prompts[n] || "Illustration")}" style="max-width:100%;border-radius:10px"/></figure>`;
  });
  return html;
}

/** Community posts are plain text: drop any stray markdown symbols. */
export function plainPost(t: string): string {
  return t.replace(/```[\s\S]*?```/g, "").replace(/^\s{0,3}#{1,6}\s+/gm, "").replace(/\*\*(.*?)\*\*/g, "$1").replace(/(^|\s)[*_]([^*_\n]+)[*_](?=\s|[.,!?]|$)/g, "$1$2")
    .replace(/^\s*[-*]\s+/gm, "• ").replace(/`/g, "").trim();
}
