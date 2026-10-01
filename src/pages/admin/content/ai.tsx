/**
 * Admin → AI Writer. Generate articles, research works and community posts with the OpenRouter models
 * configured under Admin → AI, review/edit them, then publish everything on-chain under one approval.
 * Admin-published content is auto-approved by the ContentStore contract.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "@/lib/nav";
import { Sparkles, Wand2, Play, RefreshCw, Trash2, CheckCircle2, XCircle, Loader2, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { explainError } from "@/lib/chain";
import { publishArticle } from "@/lib/onchain/content";
import { runBatch } from "@/lib/tx-approval";
import { parseBulk, bodyToHtml, wordCount } from "@/lib/bulk-articles";
import { encodePost } from "@/lib/post";
import { ensureDefaultSpace } from "@/lib/space";
import { FACULTIES } from "@/lib/categories";

type Kind = "article" | "research" | "post";
type State = "queued" | "generating" | "ready" | "publishing" | "done" | "error";
interface Row { key: number; topic: string; state: State; title: string; blurb: string; category: string; body: string; price: string; id?: number; err?: string; open?: boolean }

const CATS = Array.from(new Set(FACULTIES.map((f) => f.label)));
const inp: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", padding: "8px 11px", fontSize: 12.5, color: "var(--text)", outline: "none", fontFamily: "inherit" };
const lab: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4, display: "block" };
const KINDS: { id: Kind; label: string; hint: string }[] = [
  { id: "article", label: "Articles", hint: "Full articles published to the library" },
  { id: "research", label: "Research works", hint: "Structured research articles (abstract → references)" },
  { id: "post", label: "Community posts", hint: "Short posts for a space" },
];
let k = 0;

export default function AIWriter() {
  const { signer, address, requireAuth } = useAuth();
  const [kind, setKind] = useState<Kind>("article");
  const [topics, setTopics] = useState("");
  const [theme, setTheme] = useState("");
  const [ideaCount, setIdeaCount] = useState("8");
  const [words, setWords] = useState("900");
  const [tone, setTone] = useState("clear and engaging");
  const [audience, setAudience] = useState("a general educated audience");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("0");
  const [extra, setExtra] = useState("");
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);
  const [model, setModel] = useState("");
  const [keySet, setKeySet] = useState(true);
  const [spaces, setSpaces] = useState<{ id: string; name: string }[]>([]);
  const [space, setSpace] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const stop = useRef(false);

  useEffect(() => {
    apiFetch("/api/openrouter/models").then((r) => r.json()).then((d) => { setModels(d.models || []); setModel(d.activeModel || d.models?.[0]?.id || ""); setKeySet(!!d.keySet); }).catch(() => {});
  }, []);
  useEffect(() => {
    if (!address) return;
    apiFetch(`/api/groups?member=${address.toLowerCase()}&limit=100`).then((r) => r.json()).then((l) => {
      const a = (Array.isArray(l) ? l : []).map((g: any) => ({ id: String(g.id), name: g.name }));
      setSpaces(a); setSpace((s) => s || a[0]?.id || "");
    }).catch(() => {});
  }, [address]);

  const patch = (key: number, p: Partial<Row>) => setRows((r) => r.map((x) => (x.key === key ? { ...x, ...p } : x)));
  const topicList = () => topics.split("\n").map((t) => t.trim()).filter(Boolean);

  async function ai(payload: Record<string, unknown>) {
    const r = await apiFetch("/api/admin/ai-generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model, ...payload }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || `AI error ${r.status}`);
    return d;
  }

  async function suggest() {
    if (!theme.trim()) return;
    setBusy(true); setNote("Asking the AI for ideas…");
    try {
      const d = await ai({ kind: "ideas", idea: kind, theme, count: Number(ideaCount) || 8 });
      setTopics((t) => (t.trim() ? t.trim() + "\n" : "") + (d.ideas as string[]).join("\n"));
      setNote(`Added ${d.ideas.length} ideas — edit the list, then press Generate.`);
    } catch (e) { setNote((e as Error).message); }
    setBusy(false);
  }

  async function generateOne(r: Row) {
    patch(r.key, { state: "generating", err: undefined });
    try {
      const d = await ai({ kind, topic: r.topic, words: Number(words) || 900, tone, audience, category: category || (kind === "research" ? "Research" : ""), instructions: extra });
      if (kind === "post") { patch(r.key, { state: "ready", body: String(d.text).trim(), title: r.topic }); return; }
      const it = parseBulk(String(d.text), r.topic)[0];
      if (!it) throw new Error("The AI reply wasn't in the expected format. Try Regenerate.");
      patch(r.key, { state: "ready", title: it.title || r.topic, blurb: it.blurb, category: it.category || category || (kind === "research" ? "Research" : "General"), body: it.body });
    } catch (e) { patch(r.key, { state: "error", err: (e as Error).message }); }
  }

  async function generateAll() {
    const list = topicList();
    if (!list.length) return;
    stop.current = false; setBusy(true); setNote("");
    const fresh: Row[] = list.map((t) => ({ key: ++k, topic: t, state: "queued", title: t, blurb: "", category: "", body: "", price }));
    setRows((x) => [...x.filter((r) => r.state === "done"), ...fresh]);
    setTopics("");
    for (const r of fresh) { if (stop.current) { patch(r.key, { state: "error", err: "Stopped" }); continue; } await generateOne(r); }
    setBusy(false);
  }

  async function publishAll() {
    if (!signer) { requireAuth(); return; }
    const queue = rows.filter((r) => r.state === "ready");
    if (!queue.length) return;
    setBusy(true); setNote("");
    try {
      let sid = space;
      await runBatch({
        title: `Publish ${queue.length} ${kind === "post" ? "post" : kind === "research" ? "research work" : "article"}${queue.length > 1 ? "s" : ""} on-chain`,
        detail: kind === "post" ? "Each post is one transaction in your space." : "Each item is written to the blockchain in a few transactions. Admin content is approved automatically.",
        count: queue.length * (kind === "post" ? 1 : 3) + (kind === "post" && !space ? 1 : 0), from: signer.address,
      }, async () => {
        if (kind === "post" && !sid) sid = (await ensureDefaultSpace(signer.address, "Readlearc")).id;
        for (const r of queue) {
          patch(r.key, { state: "publishing", err: "Starting…" });
          try {
            if (kind === "post") {
              const res = await apiFetch(`/api/groups/${sid}/posts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: encodePost({ text: r.body.trim(), images: [] }), type: "discussion" }) });
              if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Couldn't post");
              patch(r.key, { state: "done", err: undefined });
            } else {
              const out = await publishArticle(signer, { title: r.title, blurb: r.blurb, category: r.category || "General", price: r.price || "0", content: bodyToHtml(r.body) }, (d) => patch(r.key, { err: d }));
              patch(r.key, { state: "done", id: out.id, err: undefined });
            }
          } catch (e) { patch(r.key, { state: "error", err: explainError(e, "Failed") }); }
        }
      });
    } catch (e) { setNote(explainError(e, "Stopped")); setRows((x) => x.map((r) => (r.state === "publishing" ? { ...r, state: "ready", err: undefined } : r))); }
    setBusy(false);
  }

  const ready = rows.filter((r) => r.state === "ready").length;
  const done = rows.filter((r) => r.state === "done").length;
  const locked = (r: Row) => r.state === "generating" || r.state === "publishing" || r.state === "done" || r.state === "queued";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 860 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "Outfit,sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-.02em", display: "flex", alignItems: "center", gap: 8 }}><Sparkles size={20} />AI Writer</h1>
          <p style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>Generate real articles, research works and posts with your OpenRouter models, then publish them on-chain.</p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <Link href="/admin/content/bulk" className="btn btn-secondary btn-sm">Paste / upload</Link>
          <Link href="/write/article" className="btn btn-secondary btn-sm">Write by hand</Link>
        </div>
      </div>

      {(!keySet || !models.length) && (
        <div className="card" style={{ padding: 14, fontSize: 13, color: "var(--text-2)" }}>
          {!keySet ? "No OpenRouter key saved yet." : "No models selected yet."} Set it up in <Link href="/admin/ai/providers" style={{ color: "var(--brand)", fontWeight: 700 }}>Admin → OpenRouter AI</Link> (you can pick free models there).
        </div>
      )}

      <div className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {KINDS.map((o) => (
            <button key={o.id} onClick={() => setKind(o.id)} className={kind === o.id ? "btn btn-primary btn-sm" : "btn btn-ghost btn-sm"} title={o.hint} disabled={busy}>{o.label}</button>
          ))}
        </div>

        <div>
          <label style={lab}>Need ideas? Describe a theme</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input style={{ ...inp, flex: "1 1 240px", width: "auto" }} placeholder="e.g. Personal finance for Nigerian students" value={theme} onChange={(e) => setTheme(e.target.value)} />
            <input style={{ ...inp, width: 64 }} value={ideaCount} onChange={(e) => setIdeaCount(e.target.value.replace(/\D/g, ""))} title="How many ideas" />
            <button className="btn btn-secondary btn-sm" onClick={suggest} disabled={busy || !theme.trim()} style={{ display: "flex", gap: 6, alignItems: "center" }}><Wand2 size={13} />Suggest ideas</button>
          </div>
        </div>

        <div>
          <label style={lab}>Topics — one per line ({topicList().length})</label>
          <textarea style={{ ...inp, minHeight: 110, resize: "vertical" }} rows={5} value={topics} onChange={(e) => setTopics(e.target.value)}
            placeholder={kind === "post" ? "How to stay consistent when studying\nWhy spaced repetition works" : "How blockchain is changing remittances in Africa\nA beginner's guide to machine learning"} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 10 }}>
          {kind !== "post" && <div><label style={lab}>Length (words)</label><input style={inp} value={words} onChange={(e) => setWords(e.target.value.replace(/\D/g, ""))} /></div>}
          <div><label style={lab}>Tone</label><input style={inp} value={tone} onChange={(e) => setTone(e.target.value)} /></div>
          {kind !== "post" && <div><label style={lab}>Audience</label><input style={inp} value={audience} onChange={(e) => setAudience(e.target.value)} /></div>}
          {kind !== "post" && <div><label style={lab}>Category</label><input list="ai-cats" style={inp} value={category} placeholder={kind === "research" ? "Research" : "AI picks"} onChange={(e) => setCategory(e.target.value)} /><datalist id="ai-cats">{CATS.map((c) => <option key={c} value={c} />)}</datalist></div>}
          {kind !== "post" && <div><label style={lab}>Price (USDC, 0 = free)</label><input style={inp} value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))} /></div>}
          {kind === "post" && (
            <div><label style={lab}>Post in space</label>
              <select style={inp} value={space} onChange={(e) => setSpace(e.target.value)}>
                {!spaces.length && <option value="">My default space (auto-create)</option>}
                {spaces.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select></div>
          )}
          <div><label style={lab}>AI model</label>
            <select style={inp} value={model} onChange={(e) => setModel(e.target.value)}>
              {models.map((m) => <option key={m.id} value={m.id}>{m.name || m.id}</option>)}
            </select></div>
        </div>
        <div><label style={lab}>Extra instructions (optional)</label><input style={inp} value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="e.g. Use Nigerian examples. Include a short FAQ at the end." /></div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={generateAll} disabled={busy || !topicList().length || !keySet} style={{ display: "flex", gap: 7, alignItems: "center" }}>
            {busy ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />}Generate {topicList().length || ""}
          </button>
          {busy && rows.some((r) => r.state === "queued" || r.state === "generating") && <button className="btn btn-ghost btn-sm" onClick={() => { stop.current = true; }}>Stop</button>}
          {note && <span style={{ fontSize: 12, color: "var(--text-3)" }}>{note}</span>}
        </div>
      </div>

      {rows.length > 0 && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rows.map((r) => (
              <div key={r.key} className="card" style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8, borderColor: r.state === "error" ? "rgba(220,38,38,.4)" : r.state === "done" ? "rgba(22,163,74,.4)" : undefined }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ width: 18, display: "flex", justifyContent: "center", flexShrink: 0 }}>
                    {r.state === "done" ? <CheckCircle2 size={16} color="#16a34a" /> : r.state === "error" ? <XCircle size={16} color="#dc2626" /> : r.state === "generating" || r.state === "publishing" ? <Loader2 size={16} className="spin" /> : null}
                  </span>
                  {kind === "post" || r.state === "queued" || r.state === "generating" || r.state === "error"
                    ? <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{r.state === "queued" || r.state === "generating" || r.state === "error" ? r.topic : r.title}</div>
                    : <input style={{ ...inp, fontWeight: 700 }} value={r.title} disabled={locked(r)} onChange={(e) => patch(r.key, { title: e.target.value })} />}
                  {r.state === "done" && r.id != null && <Link href={`/article/${r.id}`} title="Open" style={{ color: "var(--brand)", display: "flex" }}><ExternalLink size={15} /></Link>}
                  {(r.state === "ready" || r.state === "error") && <button onClick={() => generateOne(r)} disabled={busy} title="Regenerate" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)" }}><RefreshCw size={15} /></button>}
                  {r.state !== "generating" && r.state !== "publishing" && r.state !== "done" && <button onClick={() => setRows((x) => x.filter((y) => y.key !== r.key))} title="Remove" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-4)" }}><Trash2 size={15} /></button>}
                </div>
                {r.state === "ready" && kind !== "post" && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8 }}>
                    <input style={inp} placeholder="Category" value={r.category} onChange={(e) => patch(r.key, { category: e.target.value })} />
                    <input style={inp} placeholder="Price" value={r.price} onChange={(e) => patch(r.key, { price: e.target.value.replace(/[^0-9.]/g, "") })} />
                    <input style={{ ...inp, gridColumn: "span 2" }} placeholder="Blurb" value={r.blurb} onChange={(e) => patch(r.key, { blurb: e.target.value })} />
                  </div>
                )}
                {(r.state === "ready" || r.state === "done") && (
                  r.open || kind === "post"
                    ? <textarea style={{ ...inp, minHeight: kind === "post" ? 90 : 260, resize: "vertical", fontFamily: kind === "post" ? "inherit" : "JetBrains Mono,monospace", lineHeight: 1.55 }} value={r.body} disabled={r.state === "done"} onChange={(e) => patch(r.key, { body: e.target.value })} />
                    : null
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: r.state === "error" ? "#dc2626" : "var(--text-4)" }}>
                  <span>{r.state === "error" || r.state === "publishing" ? r.err : r.state === "queued" ? "Queued" : r.state === "generating" ? "Writing…" : `${wordCount(r.body).toLocaleString()} words`}</span>
                  {kind !== "post" && (r.state === "ready" || r.state === "done") && (
                    <button onClick={() => patch(r.key, { open: !r.open })} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--brand)", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
                      {r.open ? <>Hide <ChevronUp size={12} /></> : <>Read / edit <ChevronDown size={12} /></>}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", position: "sticky", bottom: 12 }}>
            <button className="btn btn-primary" disabled={busy || !ready} onClick={publishAll} style={{ display: "flex", gap: 7, alignItems: "center" }}>
              <Play size={14} />Publish {ready || ""} on-chain
            </button>
            {done > 0 && <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>{done} published</span>}
            <button className="btn btn-ghost btn-sm" disabled={busy} style={{ marginLeft: "auto" }} onClick={() => setRows((r) => r.filter((x) => x.state !== "done"))}>Clear published</button>
          </div>
        </>
      )}
    </div>
  );
}
