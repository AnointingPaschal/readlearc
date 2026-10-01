/** Parse pasted text / uploaded files into a list of articles for admin bulk publishing. */
import { toHtml } from "@/lib/markdown";

export interface BulkItem { title: string; blurb: string; category: string; price: string; body: string }

const META = /^\s*(category|blurb|summary|price)\s*:\s*(.+?)\s*$/i;

function fromJson(text: string): BulkItem[] | null {
  const t = text.trim();
  if (!t.startsWith("[")) return null;
  try {
    const arr = JSON.parse(t) as any[];
    return arr.filter((a) => a && (a.title || a.name) && (a.body || a.content)).map((a) => ({
      title: String(a.title || a.name).trim(), blurb: String(a.blurb || a.summary || "").trim(), category: String(a.category || "").trim(),
      price: String(a.price ?? "").trim(), body: String(a.body ?? a.content),
    }));
  } catch { return null; }
}

/** Markdown/plain text: every top-level "# Title" line starts a new article. Optional "Category:", "Blurb:", "Price:" lines may follow it. */
export function parseBulk(text: string, fallbackTitle?: string): BulkItem[] {
  const j = fromJson(text);
  if (j) return j;
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const out: BulkItem[] = [];
  let cur: { title: string; lines: string[] } | null = null;
  let fence = false;
  const flush = () => {
    if (!cur) return;
    const item: BulkItem = { title: cur.title, blurb: "", category: "", price: "", body: "" };
    let i = 0;
    while (i < cur.lines.length && (cur.lines[i].trim() === "" || META.test(cur.lines[i]))) {
      const m = cur.lines[i].match(META);
      if (m) { const k = m[1].toLowerCase(); if (k === "category") item.category = m[2]; else if (k === "price") item.price = m[2].replace(/[^0-9.]/g, ""); else item.blurb = m[2]; }
      i++;
    }
    item.body = cur.lines.slice(i).join("\n").trim();
    if (item.body) out.push(item);
    cur = null;
  };
  for (const ln of lines) {
    if (/^\s*```/.test(ln)) fence = !fence;
    const h1 = !fence && ln.match(/^#\s+(.+?)\s*#*\s*$/);
    if (h1) { flush(); cur = { title: h1[1].trim(), lines: [] }; }
    else if (cur) cur.lines.push(ln);
    else if (ln.trim() && !cur) cur = { title: fallbackTitle || ln.replace(/^#+\s*/, "").trim().slice(0, 140), lines: fallbackTitle ? [ln] : [] };
  }
  flush();
  return out;
}

export const bodyToHtml = (b: string) => toHtml(b);
export const wordCount = (b: string) => b.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
