/**
 * Typesetting engine for the paper reader: splits article HTML into fixed-size pages.
 * Block elements are measured in a hidden element that has the same width / font as a page body, then packed page by page.
 * Paragraphs, lists and tables split across pages; headings are never left alone at the bottom of a page.
 */
export interface Heading { id: number; level: number; text: string; page: number }
export interface Paginated { pages: string[]; scales: number[]; headings: Heading[]; texts: string[] }

const isHeading = (el: Element) => /^H[1-4]$/.test(el.tagName);

/** Keep only the first `k` characters of an element's text (clone) — everything after is dropped. */
function cutFront(el: HTMLElement, k: number): HTMLElement {
  const c = el.cloneNode(true) as HTMLElement;
  let seen = 0, done = false;
  const walk = (n: Node): void => {
    if (done) { n.parentNode?.removeChild(n); return; }
    if (n.nodeType === 3) {
      const len = (n.textContent || "").length;
      if (seen + len >= k) { n.textContent = (n.textContent || "").slice(0, k - seen); done = true; }
      seen += len; return;
    }
    Array.from(n.childNodes).forEach(walk);
  };
  Array.from(c.childNodes).forEach(walk);
  return c;
}
/** Keep everything after the first `k` characters. */
function cutBack(el: HTMLElement, k: number): HTMLElement {
  const c = el.cloneNode(true) as HTMLElement;
  let seen = 0;
  const walk = (n: Node): void => {
    if (n.nodeType === 3) {
      const t = n.textContent || "", len = t.length;
      if (seen + len <= k) n.parentNode?.removeChild(n);
      else if (seen < k) n.textContent = t.slice(k - seen);
      seen += len; return;
    }
    Array.from(n.childNodes).forEach(walk);
    if (n.nodeType === 1 && n.parentNode && !(n as Element).childNodes.length && /^(STRONG|EM|B|I|U|SPAN|A|SUP|SUB|CODE|MARK)$/.test((n as Element).tagName)) n.parentNode.removeChild(n);
  };
  Array.from(c.childNodes).forEach(walk);
  return c;
}

async function imagesReady(root: HTMLElement) {
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(imgs.map((im) => (im.complete ? Promise.resolve() : new Promise<void>((r) => { im.onload = im.onerror = () => r(); setTimeout(r, 4000); }))));
}

export async function paginate(html: string, m: HTMLElement, contentH: number): Promise<Paginated> {
  const doc = new DOMParser().parseFromString(`<div id="r">${html}</div>`, "text/html");
  const root = doc.getElementById("r")!;
  const blocks: HTMLElement[] = [];
  root.childNodes.forEach((n) => {
    if (n.nodeType === 1) blocks.push(n as HTMLElement);
    else if ((n.textContent || "").trim()) { const p = doc.createElement("p"); p.textContent = n.textContent; blocks.push(p); }
  });
  let hid = 0; const headings: Heading[] = [];
  blocks.forEach((b) => { if (isHeading(b)) { b.setAttribute("data-h", String(hid)); headings.push({ id: hid, level: +b.tagName[1], text: (b.textContent || "").trim(), page: 0 }); hid++; } });

  // load images once (so their heights are known), keep them cached in the measurer
  m.innerHTML = ""; m.style.display = "flow-root";
  const probe = document.createElement("div"); probe.innerHTML = html; probe.style.cssText = "position:absolute;left:-99999px;width:" + m.clientWidth + "px"; document.body.appendChild(probe);
  await imagesReady(probe); probe.remove();
  try { await (document as any).fonts?.ready; } catch { /* ignore */ }

  const pages: HTMLElement[][] = [], scales: number[] = [];
  let cur: HTMLElement[] = [], curScale = 1;
  const used = () => m.scrollHeight;
  const fits = () => m.scrollHeight <= contentH + 0.5;
  const flush = () => {
    if (!cur.length) return;
    for (const el of cur) { const h = el.getAttribute?.("data-h"); if (h != null) headings[+h].page = pages.length; }
    pages.push(cur); scales.push(curScale); cur = []; curScale = 1; m.innerHTML = "";
  };
  const put = (el: HTMLElement) => { m.appendChild(el); cur.push(el); };

  /** Paragraph: find the longest front part that fits the space left; returns [front, back] or null. */
  const splitPara = (b: HTMLElement): [HTMLElement, HTMLElement] | null => {
    const text = b.textContent || ""; if (text.length < 120) return null;
    let lo = 0, hi = text.length, best = 0;
    const snap = (k: number) => { const i = text.lastIndexOf(" ", k); return i > 0 ? i : k; };
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1, k = snap(mid);
      let ok = false;
      if (k > 0) { const f = cutFront(b, k); m.appendChild(f); ok = fits(); m.removeChild(f); }
      if (ok) { lo = mid; best = k; } else hi = mid - 1;
    }
    // need at least ~2 lines on this page and ~1 line on the next, unless the page is empty
    if (best < 70 && cur.length) return null;
    if (best < 1 || best >= text.length - 20) return null;
    return [cutFront(b, best), cutBack(b, best)];
  };
  /** List: how many <li> fit. */
  const splitList = (b: HTMLElement): [HTMLElement, HTMLElement] | null => {
    const lis = Array.from(b.children).filter((x) => x.tagName === "LI"); if (lis.length < 2) return null;
    let n = 0;
    for (let i = 1; i < lis.length; i++) {
      const f = b.cloneNode(false) as HTMLElement; lis.slice(0, i).forEach((l) => f.appendChild(l.cloneNode(true)));
      m.appendChild(f); const ok = fits(); m.removeChild(f); if (ok) n = i; else break;
    }
    if (!n) return null;
    const front = b.cloneNode(false) as HTMLElement, back = b.cloneNode(false) as HTMLElement;
    lis.forEach((l, i) => (i < n ? front : back).appendChild(l.cloneNode(true)));
    if (b.tagName === "OL") back.setAttribute("start", String(((b as HTMLOListElement).start || 1) + n));
    return [front, back];
  };
  /** Table: split body rows, repeating the header row. */
  const splitTable = (b: HTMLElement): [HTMLElement, HTMLElement] | null => {
    const rows = Array.from(b.querySelectorAll("tbody > tr, :scope > tr")); if (rows.length < 3) return null;
    const head = b.querySelector("thead");
    const make = (rs: Element[]) => { const t = b.cloneNode(false) as HTMLElement; if (head) t.appendChild(head.cloneNode(true)); const tb = doc.createElement("tbody"); rs.forEach((r) => tb.appendChild(r.cloneNode(true))); t.appendChild(tb); return t; };
    let n = 0;
    for (let i = 1; i < rows.length; i++) { const f = make(rows.slice(0, i)); m.appendChild(f); const ok = fits(); m.removeChild(f); if (ok) n = i; else break; }
    if (!n) return null;
    return [make(rows.slice(0, n)), make(rows.slice(n))];
  };

  const queue = blocks.slice();
  let guard = 0;
  while (queue.length && guard++ < 20000) {
    const b = queue.shift()!;
    const c = b.cloneNode(true) as HTMLElement;
    m.appendChild(c);
    if (fits()) { cur.push(c); continue; }
    m.removeChild(c);
    const split = b.tagName === "P" ? splitPara(b) : b.tagName === "UL" || b.tagName === "OL" ? splitList(b) : b.tagName === "TABLE" ? splitTable(b) : null;
    if (split) { put(split[0]); queue.unshift(split[1]); flush(); continue; }
    if (cur.length) {
      // never leave a heading stranded at the bottom: carry it to the next page together with this block
      const last = cur[cur.length - 1];
      if (isHeading(last) && cur.length > 1) { cur.pop(); m.removeChild(last); queue.unshift(last, b); } else queue.unshift(b);
      flush(); continue;
    }
    // taller than a whole page (big image / table / code): keep on its own page, shrunk to fit
    m.appendChild(c); cur.push(c);
    const h = used(); if (h > contentH) curScale = Math.max(0.35, contentH / h);
    flush();
  }
  flush();

  const out = pages.map((els) => els.map((e) => e.outerHTML).join(""));
  const texts = pages.map((els) => els.map((e) => e.textContent || "").join(" "));
  m.innerHTML = "";
  return { pages: out.length ? out : [""], scales: scales.length ? scales : [1], headings, texts: texts.length ? texts : [""] };
}

/** Highlight `q` in page HTML (text only, never inside tags). `active` = index of the match to emphasise (-1 none). */
export function markHtml(html: string, q: string, active = -1): { html: string; count: number } {
  if (!q) return { html, count: 0 };
  const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  let n = 0;
  const out = html.split(/(<[^>]+>)/).map((seg) => (seg.startsWith("<") ? seg : seg.replace(re, (m) => `<mark class="hit${n++ === active ? " on" : ""}">${m}</mark>`))).join("");
  return { html: out, count: n };
}
