import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen, ChevronLeft, ChevronRight, Download, FileText, List, Maximize2, Minimize2, Minus, Moon, Plus, Quote, Search, Sun, Type, X,
  Columns2, Square, Rows3, Copy, Check, LayoutGrid, MoreHorizontal,
} from "lucide-react";
import { toHtml } from "@/lib/markdown";
import { paginate, markHtml, type Paginated } from "@/lib/paginate";

/**
 * Document-style reader for research papers (Scribd / ResearchGate style):
 * real fixed-size pages, page counter, outline, page thumbnails, find-in-paper, zoom, single / scroll / two-page layouts,
 * paper / sepia / night themes, full screen, citation export, PDF download, reading position memory and deep links (#p12).
 */
export interface PaperMeta { articleId: string; author: string; date?: number; url?: string }
interface Props extends PaperMeta { content: string; title: string }

type Layout = "scroll" | "single" | "spread";
type Theme = "paper" | "sepia" | "night";
interface Prefs { layout: Layout; zoom: number; theme: Theme; text: boolean; page: number }
const THEMES: Record<Theme, { desk: string; bg: string; fg: string; ui: string; uiFg: string; line: string }> = {
  paper: { desk: "#d6d8dc", bg: "#ffffff", fg: "#000000", ui: "#f1f3f4", uiFg: "#3c4043", line: "#dadce0" },
  sepia: { desk: "#cbbf9f", bg: "#f6ecd6", fg: "#3b2f1c", ui: "#efe4c9", uiFg: "#4a3b22", line: "#d9c9a3" },
  night: { desk: "#0f1012", bg: "#1c1d20", fg: "#d9dade", ui: "#1a1b1e", uiFg: "#c8c9ce", line: "#2c2e33" },
};
const GAP = 18, RATIO = 1.4142;
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const key = (id: string) => `rl-paper-${id}`;
function loadPrefs(id: string): Prefs {
  const d: Prefs = { layout: "scroll", zoom: 1, theme: "paper", text: false, page: 1 };
  try { return { ...d, ...JSON.parse(localStorage.getItem(key(id)) || "{}") }; } catch { return d; }
}

export default function PaperReader({ content, title, articleId, author, date, url }: Props) {
  const html = useMemo(() => toHtml(content), [content]);
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs(articleId));
  const set = (p: Partial<Prefs>) => setPrefs((c) => ({ ...c, ...p }));
  const th = THEMES[prefs.theme];

  const rootRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const measRef = useRef<HTMLDivElement>(null);
  const [availW, setAvailW] = useState(0);
  const [fs, setFs] = useState(false);
  const [doc, setDoc] = useState<Paginated | null>(null);
  const [cur, setCur] = useState(1);
  const [panel, setPanel] = useState<"" | "outline" | "pages">("");
  const [findOpen, setFindOpen] = useState(false);
  const [q, setQ] = useState(""); const [qd, setQd] = useState("");
  const [hit, setHit] = useState(0);
  const [cite, setCite] = useState(false);
  const [more, setMore] = useState(false);
  const [toast, setToast] = useState("");
  const [jump, setJump] = useState("");
  const restored = useRef(false);

  // ── size of the available area (debounced) ──
  useEffect(() => {
    const el = rootRef.current; if (!el) return;
    let t: ReturnType<typeof setTimeout>;
    const read = () => setAvailW(Math.floor(el.clientWidth));
    read();
    const ro = new ResizeObserver(() => { clearTimeout(t); t = setTimeout(read, 180); });
    ro.observe(el);
    return () => { ro.disconnect(); clearTimeout(t); };
  }, []);
  useEffect(() => { const f = () => setFs(Boolean(document.fullscreenElement)); document.addEventListener("fullscreenchange", f); return () => document.removeEventListener("fullscreenchange", f); }, []);

  const narrow = availW < 760;
  const spreadOk = availW >= 980;
  const layout: Layout = prefs.layout === "spread" && !spreadOk ? "scroll" : prefs.layout;
  const cols = layout === "spread" ? 2 : 1;
  // logical page size: phones/tablets get a page as wide as the screen (readable text); desktops a true A4-width page
  const pageW = layout === "spread" ? 794 : clamp(availW - (availW < 600 ? 0 : 32), 300, 794);
  const pageH = Math.round(pageW * RATIO);
  const mgX = pageW >= 700 ? 96 : Math.max(20, Math.round(pageW * 0.09));
  const mgTop = Math.round(mgX * 0.85), mgBot = Math.round(mgX * 0.85) + 18;
  const contentW = pageW - mgX * 2, contentH = pageH - mgTop - mgBot;
  const fontPx = pageW >= 700 ? 16 : pageW >= 480 ? 15 : 14;
  const baseFit = layout === "spread" ? Math.min(1.5, (availW - 40 - GAP) / (2 * pageW)) : 1;
  const scale = baseFit * prefs.zoom;
  const dispW = pageW * scale, dispH = pageH * scale, rowH = dispH + GAP;

  // ── typeset ──
  const [busy, setBusy] = useState(true);
  useEffect(() => {
    if (prefs.text || !availW || !measRef.current) return;
    let off = false; setBusy(true);
    const m = measRef.current;
    m.style.width = contentW + "px"; m.style.fontSize = fontPx + "px";
    requestAnimationFrame(() => { paginate(html, m, contentH).then((d) => { if (!off) { setDoc(d); setBusy(false); } }).catch(() => { if (!off) setBusy(false); }); });
    return () => { off = true; };
  }, [html, contentW, contentH, fontPx, availW, prefs.text]);
  const N = doc?.pages.length || 1;

  // ── persistence + deep link ──
  useEffect(() => { const t = setTimeout(() => { try { localStorage.setItem(key(articleId), JSON.stringify({ ...prefs, page: cur })); } catch { /* ignore */ } }, 400); return () => clearTimeout(t); }, [prefs, cur, articleId]);
  useEffect(() => { if (!doc || !restored.current) return; const h = `#p${cur}`; if (location.hash !== h && cur > 0) { try { history.replaceState(null, "", location.pathname + location.search + h); } catch { /* ignore */ } } }, [cur, doc]);

  // ── scrolling helpers (window normally, the viewer itself in full screen) ──
  const scroller = useCallback(() => (fs ? rootRef.current : null), [fs]);
  const topOffset = () => (fs ? 56 : 112);
  const rowOf = (p: number) => Math.floor((p - 1) / cols);
  const goTo = useCallback((p: number, smooth = true) => {
    const page = clamp(Math.round(p), 1, N); setCur(page);
    if (layout === "single") { (scroller() || window).scrollTo?.({ top: fs ? 0 : Math.max(0, (rootRef.current?.getBoundingClientRect().top || 0) + window.scrollY - 70), behavior: smooth ? "smooth" : "auto" }); return; }
    const box = pagesRef.current; if (!box) return;
    const sc = scroller();
    const y = (sc ? sc.scrollTop + box.getBoundingClientRect().top - sc.getBoundingClientRect().top : box.getBoundingClientRect().top + window.scrollY) + rowOf(page) * rowH - topOffset();
    (sc || window).scrollTo({ top: Math.max(0, y), behavior: smooth ? "smooth" : "auto" });
  }, [N, layout, rowH, cols, fs, scroller]); // eslint-disable-line react-hooks/exhaustive-deps

  // restore the last position once typeset
  useEffect(() => {
    if (!doc || restored.current) return; restored.current = true;
    const hp = /^#p(\d+)$/.exec(location.hash); const want = hp ? +hp[1] : prefs.page;
    if (want > 1 && want <= doc.pages.length) { setTimeout(() => goTo(want, false), 60); if (!hp) { setToast(`Resumed at page ${want}`); setTimeout(() => setToast(""), 4000); } }
  }, [doc]); // eslint-disable-line react-hooks/exhaustive-deps

  // current page from scroll position
  useEffect(() => {
    if (!doc || prefs.text || layout === "single") return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const box = pagesRef.current; if (!box) return;
        const sc = scroller(); const top = box.getBoundingClientRect().top - (sc ? sc.getBoundingClientRect().top : 0);
        const row = Math.floor((topOffset() + 8 - top) / rowH);
        setCur(clamp(row * cols + 1, 1, N));
      });
    };
    const t = scroller() || window;
    t.addEventListener("scroll", onScroll, { passive: true }); onScroll();
    return () => { t.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, [doc, rowH, cols, N, layout, prefs.text, fs, scroller]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── find ──
  useEffect(() => { const t = setTimeout(() => setQd(q.trim().length >= 2 ? q.trim() : ""), 150); return () => clearTimeout(t); }, [q]);
  const matches = useMemo(() => {
    if (!doc || !qd) return [] as { page: number; nth: number }[];
    const out: { page: number; nth: number }[] = [];
    doc.pages.forEach((h, i) => { const c = markHtml(h, qd).count; for (let k = 0; k < c; k++) out.push({ page: i + 1, nth: k }); });
    return out;
  }, [doc, qd]);
  useEffect(() => { setHit(0); }, [qd]);
  useEffect(() => { const m = matches[hit]; if (m) { goTo(m.page); setTimeout(() => rootRef.current?.querySelector("mark.on")?.scrollIntoView({ block: "center", behavior: "smooth" }), 350); } }, [hit, matches]); // eslint-disable-line react-hooks/exhaustive-deps
  const step = (d: number) => matches.length && setHit((h) => (h + d + matches.length) % matches.length);

  // ── keyboard (when the viewer has focus) ──
  const onKey = (e: React.KeyboardEvent) => {
    const t = e.target as HTMLElement; if (t.tagName === "INPUT") { if (e.key === "Escape") { setFindOpen(false); setQ(""); } return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f" || e.key === "/") { e.preventDefault(); setFindOpen(true); return; }
    if (e.key === "ArrowRight" || (layout === "single" && e.key === "ArrowDown") || e.key === "PageDown") { if (layout === "single" || e.key !== "PageDown") { e.preventDefault(); goTo(cur + cols); } }
    else if (e.key === "ArrowLeft" || (layout === "single" && e.key === "ArrowUp") || e.key === "PageUp") { if (layout === "single" || e.key !== "PageUp") { e.preventDefault(); goTo(cur - cols); } }
    else if (e.key === "Home") { e.preventDefault(); goTo(1); } else if (e.key === "End") { e.preventDefault(); goTo(N); }
    else if (e.key === "+" || e.key === "=") set({ zoom: clamp(+(prefs.zoom + 0.1).toFixed(2), 0.5, 2.5) }); else if (e.key === "-") set({ zoom: clamp(+(prefs.zoom - 0.1).toFixed(2), 0.5, 2.5) });
  };
  // swipe in single-page layout
  const sx = useRef<number | null>(null);
  const onTS = (e: React.TouchEvent) => { sx.current = e.touches[0].clientX; };
  const onTE = (e: React.TouchEvent) => { if (sx.current == null || layout !== "single" || prefs.zoom > 1.05) return; const dx = e.changedTouches[0].clientX - sx.current; sx.current = null; if (Math.abs(dx) > 60) goTo(cur + (dx < 0 ? 1 : -1)); };

  function fullscreen() { const el = rootRef.current; if (!el) return; if (document.fullscreenElement) void document.exitFullscreen(); else void el.requestFullscreen?.().catch(() => setToast("Full screen isn't available here")); }

  // ── export ──
  const year = new Date((date || Date.now() / 1000) * 1000).getFullYear();
  const pageUrl = url || (typeof location !== "undefined" ? location.href.split("#")[0] : "");
  const cites = {
    APA: `${author}. (${year}). ${title}. Readlearc. ${pageUrl}`,
    MLA: `${author}. "${title}." Readlearc, ${year}, ${pageUrl}.`,
    BibTeX: `@article{readlearc${articleId},\n  title   = {${title}},\n  author  = {${author}},\n  year    = {${year}},\n  journal = {Readlearc},\n  url     = {${pageUrl}}\n}`,
  };
  const [citeKind, setCiteKind] = useState<keyof typeof cites>("APA"); const [copied, setCopied] = useState("");
  const copy = (txt: string, tag: string) => { void navigator.clipboard?.writeText(txt); setCopied(tag); setTimeout(() => setCopied(""), 1500); };
  function downloadPdf() {
    const f = document.createElement("iframe"); f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
    document.body.appendChild(f);
    const d = f.contentDocument!; d.open();
    d.write(`<!DOCTYPE html><html><head><title>${title.replace(/</g, "&lt;")}</title><style>
@page{size:A4 portrait;margin:2.2cm 2.4cm}
body{font-family:"Times New Roman",Times,serif;font-size:12pt;line-height:1.6;color:#000;margin:0}
h1.t{font-size:18pt;text-align:center;margin:0 0 4pt}.by{text-align:center;color:#555;font-size:10pt;margin-bottom:10pt}
h1{font-size:16pt}h2{font-size:14pt;border-bottom:1px solid #555;padding-bottom:2pt;margin:14pt 0 4pt;page-break-after:avoid}
h3{font-size:12pt;font-style:italic;margin:10pt 0 3pt;page-break-after:avoid}h4{font-size:11pt;page-break-after:avoid}
p{margin:0 0 7pt;text-align:justify;orphans:3;widows:3}table{border-collapse:collapse;width:100%;margin:8pt 0;font-size:10pt;page-break-inside:auto}tr{page-break-inside:avoid}
td,th{border:1pt solid #999;padding:3pt 7pt}th{background:#f0f0f0}blockquote{border-left:3pt solid #666;padding-left:10pt;margin:7pt 0;font-style:italic;color:#444}
img{max-width:100%;display:block;margin:8pt auto;page-break-inside:avoid}pre{font-size:9.5pt;white-space:pre-wrap;border:1px solid #ccc;padding:6pt}a{color:#1a0dab}hr{border:0;border-top:1pt solid #ccc}
.f{margin-top:18pt;font-size:9pt;color:#777;border-top:1px solid #ccc;padding-top:6pt}
</style></head><body><h1 class="t">${title.replace(/</g, "&lt;")}</h1><div class="by">${author} · ${year}</div><hr/>${html}<div class="f">Source: ${pageUrl}</div></body></html>`);
    d.close();
    setTimeout(() => { try { f.contentWindow?.focus(); f.contentWindow?.print(); } catch { setToast("Printing isn't available in this browser"); } setTimeout(() => f.remove(), 60000); }, 500);
  }

  // ── pieces ──
  const btn = (on?: boolean): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4, height: 32, minWidth: 32, padding: "0 8px", borderRadius: 8, border: `1px solid ${on ? "var(--brand)" : th.line}`, background: on ? "var(--brand-muted, rgba(109,40,217,.12))" : "transparent", color: on ? "var(--brand)" : th.uiFg, cursor: "pointer", fontSize: 12, fontWeight: 600, flexShrink: 0 });
  const tip = (t: string) => ({ title: t, "aria-label": t });
  const progress = N > 1 ? ((cur - 1) / (N - 1)) * 100 : 0;
  const pageNodes = (p: number): { __html: string } => {
    const raw = doc?.pages[p - 1] || ""; if (!qd) return { __html: raw };
    const act = matches[hit]?.page === p ? matches[hit].nth : -1;
    return { __html: markHtml(raw, qd, act).html };
  };
  const nearRows = 3;
  const curRow = rowOf(cur);
  const visiblePages = layout === "single" ? [cur] : Array.from({ length: N }, (_, i) => i + 1);

  const renderPage = (p: number) => {
    const live = layout === "single" || Math.abs(rowOf(p) - curRow) <= nearRows;
    const sc = doc?.scales[p - 1] || 1;
    return (
      <div key={p} id={`pg-${p}`} style={{ width: dispW, height: dispH, flexShrink: 0, position: "relative" }}>
        <div className="pg" style={{ width: pageW, height: pageH, transform: `scale(${scale})`, transformOrigin: "top left", background: th.bg, boxShadow: prefs.theme === "night" ? "0 0 0 1px #2c2e33" : "0 3px 14px rgba(0,0,0,.28), 0 0 0 1px rgba(0,0,0,.06)", position: "absolute", left: 0, top: 0, ["--paper-fg" as any]: th.fg, ["--paper-bg" as any]: th.bg, ["--paper-line" as any]: th.line }}>
          {live && (<>
            <div style={{ position: "absolute", top: Math.round(mgTop * 0.4), left: mgX, right: mgX, fontFamily: '"Times New Roman",serif', fontSize: 9.5, fontStyle: "italic", color: th.fg, opacity: .45, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "center" }}>{title}</div>
            <div className="rbd" lang="en" style={{ position: "absolute", top: mgTop, left: mgX, width: contentW, height: contentH, overflow: "hidden", fontSize: fontPx }}>
              <div style={sc < 1 ? { transform: `scale(${sc})`, transformOrigin: "top left", width: contentW / sc } : undefined} dangerouslySetInnerHTML={pageNodes(p)} />
            </div>
            <div style={{ position: "absolute", bottom: Math.round(mgBot * 0.38), left: mgX, right: mgX, display: "flex", justifyContent: "space-between", fontFamily: '"Times New Roman",serif', fontSize: 9.5, color: th.fg, opacity: .45 }}>
              <span>Readlearc · {author}</span><span>Page {p} of {N}</span>
            </div>
          </>)}
        </div>
      </div>
    );
  };

  const tools = (<>
          {!prefs.text && <>
            <button {...tip("Zoom out")} style={btn()} onClick={() => set({ zoom: clamp(+(prefs.zoom - 0.1).toFixed(2), 0.5, 2.5) })}><Minus size={14} /></button>
            <button {...tip("Fit to width")} style={{ ...btn(), minWidth: 46 }} onClick={() => set({ zoom: 1 })}>{Math.round(prefs.zoom * 100)}%</button>
            <button {...tip("Zoom in")} style={btn()} onClick={() => set({ zoom: clamp(+(prefs.zoom + 0.1).toFixed(2), 0.5, 2.5) })}><Plus size={14} /></button>
            <button {...tip("One page at a time")} style={btn(layout === "single")} onClick={() => set({ layout: "single" })}><Square size={14} /></button>
            <button {...tip("Continuous scroll")} style={btn(layout === "scroll")} onClick={() => set({ layout: "scroll" })}><Rows3 size={14} /></button>
            {spreadOk && <button {...tip("Two pages")} style={btn(layout === "spread")} onClick={() => set({ layout: "spread" })}><Columns2 size={14} /></button>}
          </>}
          <button {...tip(prefs.text ? "Page view" : "Reader view (reflowed text)")} style={btn(prefs.text)} onClick={() => set({ text: !prefs.text })}>{prefs.text ? <FileText size={14} /> : <Type size={14} />}{!narrow && (prefs.text ? "Page view" : "Text")}</button>
          <button {...tip("Theme")} style={btn()} onClick={() => set({ theme: prefs.theme === "paper" ? "sepia" : prefs.theme === "sepia" ? "night" : "paper" })}>{prefs.theme === "night" ? <Moon size={14} /> : prefs.theme === "sepia" ? <BookOpen size={14} /> : <Sun size={14} />}</button>
          <button {...tip("Cite")} style={btn()} onClick={() => setCite(true)}><Quote size={14} /></button>
          <button {...tip("Download as PDF")} style={btn()} onClick={downloadPdf}><Download size={14} />{!narrow && "PDF"}</button>
          <button {...tip("Full screen")} style={btn(fs)} onClick={fullscreen}>{fs ? <Minimize2 size={14} /> : <Maximize2 size={14} />}</button>
  </>);
  const wrapStyle: React.CSSProperties = { background: th.ui, border: `1px solid ${th.line}`, borderRadius: fs ? 0 : "var(--r-lg, 12px)", position: "relative", ...(fs ? { height: "100vh", overflowY: "auto" } : {}) };
  const barStyle: React.CSSProperties = { position: "sticky", top: fs ? 0 : "var(--header-h, 64px)", zIndex: 30, background: th.ui, color: th.uiFg, borderBottom: `1px solid ${th.line}`, borderTopLeftRadius: "inherit", borderTopRightRadius: "inherit" };

  return (
    <div ref={rootRef} tabIndex={0} onKeyDown={onKey} style={{ ...wrapStyle, outline: "none" }} className="paper-reader">
      {/* ── toolbar ── */}
      <div style={barStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", overflowX: "auto", scrollbarWidth: "none" }}>
          <button {...tip("Outline and pages")} style={btn(Boolean(panel))} onClick={() => setPanel(panel ? "" : "outline")}><List size={14} />{availW > 520 && "Outline"}</button>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
            <button {...tip("Previous page")} style={btn()} onClick={() => goTo(cur - cols)} disabled={cur <= 1}><ChevronLeft size={14} /></button>
            <input value={jump || String(cur)} inputMode="numeric" onFocus={(e) => { setJump(String(cur)); e.currentTarget.select(); }} onBlur={() => setJump("")}
              onChange={(e) => setJump(e.target.value.replace(/\D/g, ""))} onKeyDown={(e) => { if (e.key === "Enter") { goTo(+jump || cur); (e.target as HTMLInputElement).blur(); } }}
              style={{ width: 38, height: 32, textAlign: "center", border: `1px solid ${th.line}`, borderRadius: 8, background: "transparent", color: th.uiFg, fontWeight: 700, fontSize: 13 }} />
            <span style={{ color: th.uiFg, opacity: .7 }}>/ {doc ? N : "…"}</span>
            <button {...tip("Next page")} style={btn()} onClick={() => goTo(cur + cols)} disabled={cur >= N}><ChevronRight size={14} /></button>
          </div>
          <div style={{ flex: 1, minWidth: 4 }} />
          <button {...tip("Find in paper")} style={btn(findOpen)} onClick={() => { setFindOpen((v) => !v); }}><Search size={14} /></button>
          {narrow && <button {...tip("More tools")} style={btn(more)} onClick={() => setMore((v) => !v)}><MoreHorizontal size={14} /></button>}
          {!narrow && tools}
        </div>
        {narrow && more && <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, padding: "8px 10px", borderTop: `1px solid ${th.line}` }}>{tools}</div>}
        <div style={{ height: 3, background: th.line }}><div style={{ height: 3, width: `${progress}%`, background: "var(--brand)", transition: "width .15s" }} /></div>
        {findOpen && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", borderTop: `1px solid ${th.line}` }}>
            <Search size={14} style={{ opacity: .6 }} />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find in this paper…" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); step(e.shiftKey ? -1 : 1); } if (e.key === "Escape") { setFindOpen(false); setQ(""); } }}
              style={{ flex: 1, minWidth: 0, height: 32, border: `1px solid ${th.line}`, borderRadius: 8, padding: "0 10px", background: "transparent", color: th.uiFg, fontSize: 13 }} />
            <span style={{ fontSize: 12, color: th.uiFg, opacity: .7, minWidth: 54, textAlign: "center" }}>{qd ? (matches.length ? `${hit + 1} / ${matches.length}` : "No match") : ""}</span>
            <button {...tip("Previous match")} style={btn()} onClick={() => step(-1)}><ChevronLeft size={14} /></button>
            <button {...tip("Next match")} style={btn()} onClick={() => step(1)}><ChevronRight size={14} /></button>
            <button {...tip("Close")} style={btn()} onClick={() => { setFindOpen(false); setQ(""); }}><X size={14} /></button>
          </div>
        )}
      </div>

      {/* ── body ── */}
      <div style={{ position: "relative" }}>
        {panel && (
          <aside style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: availW < 700 ? "100%" : 280, zIndex: 25, pointerEvents: "none" }}>
           <div style={{ position: "sticky", top: topOffset(), maxHeight: "calc(100vh - 130px)", overflowY: "auto", background: th.ui, border: `1px solid ${th.line}`, borderRadius: 10, margin: availW < 700 ? 8 : "8px 0 0 8px", boxShadow: "0 8px 30px rgba(0,0,0,.25)", color: th.uiFg, pointerEvents: "auto" }}>
            <div style={{ display: "flex", gap: 6, padding: 10, position: "sticky", top: 0, background: th.ui, borderBottom: `1px solid ${th.line}` }}>
              <button style={{ ...btn(panel === "outline"), flex: 1 }} onClick={() => setPanel("outline")}><List size={13} />Outline</button>
              <button style={{ ...btn(panel === "pages"), flex: 1 }} onClick={() => setPanel("pages")}><LayoutGrid size={13} />Pages</button>
              <button {...tip("Close")} style={btn()} onClick={() => setPanel("")}><X size={14} /></button>
            </div>
            {panel === "outline" ? (
              <div style={{ padding: "8px 6px 16px" }}>
                {!doc?.headings.length && <div style={{ fontSize: 12, opacity: .6, padding: 10 }}>This paper has no section headings.</div>}
                {doc?.headings.map((h) => {
                  const nextPage = (doc.headings.find((x) => x.id > h.id)?.page ?? N);
                  const on = cur >= h.page + 1 && cur <= nextPage + 1;
                  return (
                    <button key={h.id} onClick={() => { goTo(h.page + 1); if (availW < 700) setPanel(""); }} style={{ display: "flex", justifyContent: "space-between", gap: 8, width: "100%", textAlign: "left", padding: "7px 10px", paddingLeft: 10 + (h.level - 1) * 12, background: on ? "var(--brand-muted, rgba(109,40,217,.12))" : "transparent", color: on ? "var(--brand)" : th.uiFg, border: "none", borderRadius: 6, cursor: "pointer", fontSize: h.level <= 2 ? 13 : 12, fontWeight: h.level <= 2 ? 700 : 500 }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{h.text}</span><span style={{ opacity: .6, flexShrink: 0 }}>{h.page + 1}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(96px,1fr))", gap: 10, padding: 10 }}>
                {doc?.texts.map((t, i) => (
                  <button key={i} onClick={() => { goTo(i + 1); if (availW < 700) setPanel(""); }} style={{ aspectRatio: "1 / 1.414", background: th.bg, color: th.fg, border: `2px solid ${cur === i + 1 ? "var(--brand)" : th.line}`, borderRadius: 4, padding: 6, fontSize: 5.5, lineHeight: 1.35, overflow: "hidden", position: "relative", cursor: "pointer", textAlign: "left", fontFamily: "Times New Roman,serif" }}>
                    {t.slice(0, 380)}
                    <span style={{ position: "absolute", bottom: 3, right: 5, fontSize: 9, fontWeight: 700, opacity: .6 }}>{i + 1}</span>
                  </button>
                ))}
              </div>
            )}
           </div>
          </aside>
        )}

        <div style={{ flex: 1, minWidth: 0, background: prefs.text ? "var(--bg-card, #fff)" : th.desk, padding: prefs.text ? "18px 16px" : `${GAP}px ${availW < 600 ? 0 : 16}px ${GAP + 40}px`, minHeight: 300, overflowX: "auto" }} onTouchStart={onTS} onTouchEnd={onTE}>
          {prefs.text ? (
            <div className="article-render" style={{ maxWidth: 720, margin: "0 auto" }} dangerouslySetInnerHTML={{ __html: qd ? markHtml(html, qd).html : html }} />
          ) : busy && !doc ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: th.fg, opacity: .7, fontSize: 13 }}>Typesetting pages…</div>
          ) : (
            <div ref={pagesRef} style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, ${dispW}px)`, justifyContent: dispW * cols + 32 > availW ? "start" : "center", gap: GAP, opacity: busy ? .5 : 1, transition: "opacity .15s", width: "max-content", minWidth: "100%" }}>
              {visiblePages.map(renderPage)}
            </div>
          )}
          {!prefs.text && doc && layout === "single" && (
            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 14 }}>
              <button style={{ ...btn(), padding: "0 16px", background: th.ui }} onClick={() => goTo(cur - 1)} disabled={cur <= 1}><ChevronLeft size={14} />Previous</button>
              <button style={{ ...btn(), padding: "0 16px", background: th.ui }} onClick={() => goTo(cur + 1)} disabled={cur >= N}>Next<ChevronRight size={14} /></button>
            </div>
          )}
        </div>
      </div>

      {/* hidden typesetting surface — same font/width as a page body */}
      <div aria-hidden="true" className="pg" style={{ position: "absolute", left: -99999, top: 0, visibility: "hidden", pointerEvents: "none" }}>
        <div ref={measRef} className="rbd" lang="en" />
      </div>

      {toast && <div style={{ position: "fixed", bottom: 76, left: "50%", transform: "translateX(-50%)", zIndex: 60, background: "#222", color: "#fff", fontSize: 12, padding: "8px 14px", borderRadius: 99, boxShadow: "0 4px 18px rgba(0,0,0,.3)" }}>{toast}{toast.startsWith("Resumed") && <button onClick={() => { goTo(1); setToast(""); }} style={{ marginLeft: 10, background: "none", border: "none", color: "#c4b5fd", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Start over</button>}</div>}

      {cite && (
        <div onClick={() => setCite(false)} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 520, background: "var(--bg-card, #fff)", color: "var(--text, #111)", borderRadius: 14, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}><b style={{ fontFamily: "Outfit,sans-serif", fontSize: 16 }}>Cite this paper</b><button style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }} onClick={() => setCite(false)}><X size={16} /></button></div>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>{(Object.keys(cites) as (keyof typeof cites)[]).map((k) => <button key={k} onClick={() => setCiteKind(k)} style={{ ...btn(citeKind === k), color: citeKind === k ? "var(--brand)" : "var(--text-3, #555)", border: `1px solid ${citeKind === k ? "var(--brand)" : "var(--border, #ddd)"}` }}>{k}</button>)}</div>
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", background: "var(--bg-alt, #f4f4f5)", borderRadius: 8, padding: 12, fontSize: 12.5, margin: 0, fontFamily: citeKind === "BibTeX" ? "JetBrains Mono,monospace" : "inherit" }}>{cites[citeKind]}</pre>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="btn btn-primary btn-sm" onClick={() => copy(cites[citeKind], citeKind)}>{copied === citeKind ? <Check size={13} /> : <Copy size={13} />}{copied === citeKind ? "Copied" : "Copy citation"}</button>
              <button className="btn btn-ghost btn-sm" onClick={() => copy(`${pageUrl}#p${cur}`, "link")}>{copied === "link" ? <Check size={13} /> : <Copy size={13} />}{copied === "link" ? "Copied" : `Link to page ${cur}`}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
