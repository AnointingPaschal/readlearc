/**
 * Admin → Bulk write. Paste or upload many articles, review them, publish them all on-chain in one go.
 * Admin/moderator publications are approved automatically by the ContentStore contract.
 */
import { useRef, useState } from "react";
import { Link } from "@/lib/nav";
import { Upload, Trash2, Play, CheckCircle2, XCircle, Loader2, FileText, ExternalLink } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { explainError } from "@/lib/chain";
import { publishArticle } from "@/lib/onchain/content";
import { runBatch } from "@/lib/tx-approval";
import { parseBulk, bodyToHtml, wordCount, type BulkItem } from "@/lib/bulk-articles";
import { FACULTIES } from "@/lib/categories";

type Row = BulkItem & { key: number; state: "ready" | "running" | "done" | "error"; detail?: string; id?: number };
const CATS = Array.from(new Set(FACULTIES.map((f) => f.label)));
const inp: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", padding: "8px 11px", fontSize: 12.5, color: "var(--text)", outline: "none" };
const lab: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4, display: "block" };

const SAMPLE = `# First article title
Category: Technology
Blurb: One-line summary shown on the card.

Write the article body here. Markdown or HTML both work.

## A section heading
More text…

# Second article title
Another article body…`;

let k = 0;

export default function BulkWrite() {
  const { signer, isAuth, requireAuth } = useAuth();
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [defCat, setDefCat] = useState("General");
  const [defPrice, setDefPrice] = useState("0");
  const [running, setRunning] = useState(false);
  const [note, setNote] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const add = (items: BulkItem[]) => setRows((r) => [...r, ...items.map((i) => ({ ...i, key: ++k, state: "ready" as const }))]);
  function parseText() {
    const items = parseBulk(text);
    if (!items.length) { setNote("Nothing to add. Start each article with a “# Title” line (see the example)."); return; }
    add(items); setText(""); setNote(`Added ${items.length} article${items.length > 1 ? "s" : ""}.`);
  }
  async function onFiles(list: FileList | null) {
    const out: BulkItem[] = [];
    for (const f of Array.from(list || [])) {
      const t = await f.text();
      const base = f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
      const items = parseBulk(t, base);
      out.push(...items);
    }
    if (fileRef.current) fileRef.current.value = "";
    if (out.length) { add(out); setNote(`Added ${out.length} article${out.length > 1 ? "s" : ""} from ${list?.length} file${(list?.length || 0) > 1 ? "s" : ""}.`); } else setNote("No articles found in those files.");
  }

  const patch = (key: number, p: Partial<Row>) => setRows((r) => r.map((x) => (x.key === key ? { ...x, ...p } : x)));
  const todo = rows.filter((r) => r.state === "ready" || r.state === "error");

  async function publishAll() {
    if (!signer) { requireAuth(); return; }
    const queue = rows.filter((r) => r.state === "ready" || r.state === "error");
    if (!queue.length) return;
    setRunning(true); setNote("");
    try {
      await runBatch({
        title: `Publish ${queue.length} article${queue.length > 1 ? "s" : ""} on-chain`,
        detail: "Each article is written to the blockchain in a few transactions. They are approved automatically because you are an admin.",
        count: queue.length * 3, from: signer.address,
      }, async () => {
        for (const r of queue) {
          patch(r.key, { state: "running", detail: "Starting…" });
          try {
            const res = await publishArticle(signer, {
              title: r.title, blurb: r.blurb, category: r.category || defCat, price: r.price || defPrice, content: bodyToHtml(r.body),
            }, (d) => patch(r.key, { detail: d }));
            patch(r.key, { state: "done", id: res.id, detail: undefined });
          } catch (e) { patch(r.key, { state: "error", detail: explainError(e, "Failed") }); }
        }
      });
    } catch (e) { setNote(explainError(e, "Stopped")); }
    setRunning(false);
  }

  const done = rows.filter((r) => r.state === "done").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 860 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "Outfit,sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-.02em" }}>Bulk write</h1>
          <p style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>Add many articles at once, review them, then publish everything on-chain with one approval.</p>
        </div>
        <Link href="/write/article" className="btn btn-secondary btn-sm"><FileText size={12} />Write a single article</Link>
      </div>

      <div className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <label style={lab}>Paste articles</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={10} placeholder={SAMPLE} spellCheck={false}
          style={{ ...inp, fontFamily: "JetBrains Mono,monospace", fontSize: 12, lineHeight: 1.55, resize: "vertical" }} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button className="btn btn-primary btn-sm" onClick={parseText} disabled={!text.trim()}>Add to list</button>
          <input ref={fileRef} type="file" accept=".md,.markdown,.txt,.html,.htm,.json" multiple hidden onChange={(e) => onFiles(e.target.files)} />
          <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()} style={{ display: "flex", gap: 6, alignItems: "center" }}><Upload size={13} />Upload files</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setText(SAMPLE)}>Example</button>
          {note && <span style={{ fontSize: 12, color: "var(--text-3)" }}>{note}</span>}
        </div>
        <p style={{ fontSize: 11, color: "var(--text-4)", lineHeight: 1.6, margin: 0 }}>
          Start each article with a <code># Title</code> line. Optional <code>Category:</code>, <code>Blurb:</code> and <code>Price:</code> lines may follow it. Upload .md / .txt / .html files (one article each, or several with # titles) or a .json list of
          {" "}<code>{`{title, body, category, blurb, price}`}</code>.
        </p>
      </div>

      {rows.length > 0 && (<>
        <div className="card" style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10 }}>
          <div><label style={lab}>Default category</label><input list="bulk-cats" style={inp} value={defCat} onChange={(e) => setDefCat(e.target.value)} /><datalist id="bulk-cats">{CATS.map((c) => <option key={c} value={c} />)}</datalist></div>
          <div><label style={lab}>Default price (USDC, 0 = free)</label><input style={inp} value={defPrice} onChange={(e) => setDefPrice(e.target.value.replace(/[^0-9.]/g, ""))} /></div>
          <div style={{ display: "flex", alignItems: "flex-end" }}><span style={{ fontSize: 11, color: "var(--text-4)", lineHeight: 1.5 }}>Used for articles that don’t set their own. Paid articles need monetization enabled for your wallet.</span></div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((r) => (
            <div key={r.key} className="card" style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8, borderColor: r.state === "error" ? "rgba(220,38,38,.4)" : r.state === "done" ? "rgba(22,163,74,.4)" : undefined }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ width: 18, display: "flex", justifyContent: "center", flexShrink: 0 }}>
                  {r.state === "done" ? <CheckCircle2 size={16} color="#16a34a" /> : r.state === "error" ? <XCircle size={16} color="#dc2626" /> : r.state === "running" ? <Loader2 size={16} className="spin" /> : null}
                </span>
                <input style={{ ...inp, fontWeight: 700 }} value={r.title} disabled={r.state === "running" || r.state === "done"} onChange={(e) => patch(r.key, { title: e.target.value })} />
                {r.state === "done" && r.id != null && <Link href={`/article/${r.id}`} title="Open" style={{ color: "var(--brand)", display: "flex" }}><ExternalLink size={15} /></Link>}
                {r.state !== "running" && r.state !== "done" && <button onClick={() => setRows((x) => x.filter((y) => y.key !== r.key))} title="Remove" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-4)" }}><Trash2 size={15} /></button>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8 }}>
                <input style={inp} placeholder={`Category (${defCat})`} value={r.category} disabled={r.state === "running" || r.state === "done"} onChange={(e) => patch(r.key, { category: e.target.value })} />
                <input style={inp} placeholder={`Price (${defPrice || 0})`} value={r.price} disabled={r.state === "running" || r.state === "done"} onChange={(e) => patch(r.key, { price: e.target.value.replace(/[^0-9.]/g, "") })} />
                <input style={{ ...inp, gridColumn: "span 2" }} placeholder="Blurb (optional)" value={r.blurb} disabled={r.state === "running" || r.state === "done"} onChange={(e) => patch(r.key, { blurb: e.target.value })} />
              </div>
              <div style={{ fontSize: 11, color: r.state === "error" ? "#dc2626" : "var(--text-4)" }}>
                {r.state === "error" || r.state === "running" ? r.detail : `${wordCount(r.body).toLocaleString()} words`}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", position: "sticky", bottom: 12 }}>
          <button className="btn btn-primary" disabled={running || !todo.length} onClick={publishAll} style={{ display: "flex", gap: 7, alignItems: "center" }}>
            {running ? <><Loader2 size={15} className="spin" />Publishing…</> : <><Play size={15} />{isAuth ? `Publish ${todo.length} article${todo.length === 1 ? "" : "s"}` : "Sign in to publish"}</>}
          </button>
          {done > 0 && <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>{done} published</span>}
          {rows.some((r) => r.state === "error") && !running && <span style={{ fontSize: 12, color: "#dc2626" }}>Some failed — fix and press Publish again to retry them.</span>}
          <button className="btn btn-ghost btn-sm" disabled={running} style={{ marginLeft: "auto" }} onClick={() => setRows((r) => r.filter((x) => x.state !== "done"))}>Clear published</button>
        </div>
      </>)}
    </div>
  );
}
