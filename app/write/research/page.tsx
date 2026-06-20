"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Save, Send, GripVertical, BookOpen, ChevronDown, ChevronUp, Clock, CheckCircle2, AlertCircle, Eye, EyeOff, X } from "lucide-react";
import Navbar from "../../../components/ui/Navbar";
import SetupBanner from "../../../components/ui/SetupBanner";
import ConnectGate from "../../../components/ui/ConnectGate";
import NetworkGuard from "../../../components/ui/NetworkGuard";
import { useAuth } from "../../../lib/auth";

interface Section { id:string; type:string; title:string; content:string; required:boolean; collapsed:boolean; }
interface Reference { id:string; text:string; url:string; year:string; }

const uid = () => Math.random().toString(36).slice(2,9);

const DEFAULTS = [
  { type:"abstract",     title:"Abstract",     content:"", required:true  },
  { type:"introduction", title:"Introduction", content:"", required:true  },
  { type:"methodology",  title:"Methodology",  content:"", required:false },
  { type:"results",      title:"Results",      content:"", required:false },
  { type:"discussion",   title:"Discussion",   content:"", required:false },
  { type:"conclusion",   title:"Conclusion",   content:"", required:true  },
];

const PLACEHOLDERS: Record<string,string> = {
  abstract:     "Summarize your research in 150–250 words. Cover the problem, methods, key findings, and conclusions.",
  introduction: "Introduce the problem, explain its significance, and outline your approach.",
  methodology:  "Describe your research methods, data sources, tools, and procedures.",
  results:      "Present your findings objectively with supporting data.",
  discussion:   "Interpret your results, compare with existing work, and discuss implications.",
  conclusion:   "Summarize contributions, limitations, and directions for future research.",
};

export default function ResearchPage() {
  const { isAuth, address } = useAuth();
  const [draftId,    setDraftId]    = useState<string|null>(null);
  const [title,      setTitle]      = useState("");
  const [keywords,   setKeywords]   = useState<string[]>([]);
  const [kwInput,    setKwInput]    = useState("");
  const [sections,   setSections]   = useState<Section[]>(() => DEFAULTS.map(s => ({ ...s, id:uid(), collapsed:false })));
  const [references, setReferences] = useState<Reference[]>([]);
  const [price,      setPrice]      = useState(0.05);
  const [status,     setStatus]     = useState("draft");
  const [saving,     setSaving]     = useState(false);
  const [lastSaved,  setLastSaved]  = useState<Date|null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [articleId,  setArticleId]  = useState("");
  const [error,      setError]      = useState("");
  const [preview,    setPreview]    = useState(false);
  const timerRef = useRef<any>(null);

  const wordCount  = sections.reduce((s,sec) => s + sec.content.split(/\s+/).filter(Boolean).length, 0);
  const readTime   = Math.max(10, Math.ceil(wordCount / 200));
  const completion = Math.round(sections.filter(s => s.content.trim().length > 50).length / Math.max(sections.length,1) * 100);

  const saveDraft = useCallback(async () => {
    if (!address) return;
    setSaving(true);
    try {
      const payload = { authorAddress:address, title, sections, references, keywords, status };
      const url     = draftId ? "/api/drafts/" + draftId : "/api/drafts";
      const method  = draftId ? "PUT" : "POST";
      const r = await fetch(url, { method, headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
      const d = await r.json();
      if (!draftId && d.id) setDraftId(String(d.id));
      setLastSaved(new Date());
    } catch {}
    setSaving(false);
  }, [address, title, sections, references, keywords, status, draftId]);

  // Auto-save every 30s
  useEffect(() => {
    if (!isAuth) return;
    timerRef.current = setInterval(() => {
      if (title || sections.some(s => s.content)) saveDraft();
    }, 30000);
    return () => clearInterval(timerRef.current);
  }, [isAuth, saveDraft]);

  async function submit() {
    if (!address) return;
    setSubmitting(true); setError("");
    try {
      await saveDraft();
      const secs    = sections.map(s => "## " + s.title + "\n\n" + s.content).join("\n\n");
      const refs    = references.length ? "\n\n## References\n\n" + references.map((r,i) => (i+1) + ". " + r.text + (r.url ? " — " + r.url : "")).join("\n") : "";
      const full    = secs + refs;
      const blurb   = (sections.find(s => s.type === "abstract")?.content || "").slice(0, 300);
      const r = await fetch("/api/articles", {
        method: "POST", headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
          title: title || "Untitled Research", blurb, content: full, price,
          category: "Research", isResearch: true, authorAddress: address,
          readTime: Math.max(10, Math.ceil(full.split(/\s+/).length / 200)),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Submit failed");
      setArticleId(String(d.id));
      setSubmitted(true);
    } catch (e: any) { setError(e.message); }
    setSubmitting(false);
  }

  function updateSection(id:string, field:string, value:any) {
    setSections(prev => prev.map(s => s.id===id ? {...s,[field]:value} : s));
  }
  function removeSection(id:string) { setSections(prev => prev.filter(s => s.id!==id)); }
  function addSection(type="custom", title="New Section") {
    setSections(prev => [...prev, { id:uid(), type, title, content:"", required:false, collapsed:false }]);
  }
  function addRef() { setReferences(prev => [...prev, { id:uid(), text:"", url:"", year:String(new Date().getFullYear()) }]); }
  function updateRef(id:string, f:string, v:string) { setReferences(prev => prev.map(r => r.id===id ? {...r,[f]:v} : r)); }
  function removeRef(id:string) { setReferences(prev => prev.filter(r => r.id!==id)); }
  function addKeyword() {
    const k = kwInput.trim().toLowerCase();
    if (k && !keywords.includes(k)) setKeywords(prev => [...prev, k]);
    setKwInput("");
  }

  if (!isAuth) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <SetupBanner/><Navbar/><NetworkGuard/>
      <ConnectGate title="Connect to write research" body="Connect your wallet to publish research papers." icon={BookOpen}/>
    </div>
  );

  if (submitted) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <SetupBanner/><Navbar/><NetworkGuard/>
      <div style={{ maxWidth:520, margin:"calc(var(--header-h) + 60px) auto 0", padding:"0 14px", textAlign:"center" }}>
        <div className="card" style={{ padding:"52px 36px" }}>
          <CheckCircle2 size={48} style={{ color:"var(--accent)", marginBottom:16 }}/>
          <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:26, fontWeight:900, color:"var(--text)", marginBottom:8 }}>Research Submitted!</h2>
          <p style={{ color:"var(--text-3)", fontSize:14, marginBottom:8 }}>Article #{articleId} is pending admin review.</p>
          <p style={{ color:"var(--text-4)", fontSize:12, marginBottom:28 }}>Once approved, it will appear on the homepage and explore page.</p>
          <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
            <button onClick={()=>setSubmitted(false)} className="btn btn-secondary">Continue Editing</button>
            {articleId && <Link href={"/article/" + articleId} className="btn btn-ghost btn-sm">Preview</Link>}
            <Link href="/creator" className="btn btn-primary">Creator Studio</Link>
          </div>
        </div>
      </div>
    </div>
  );

  const statusColors: Record<string,string> = { draft:"badge-neutral", in_progress:"badge-amber", ready:"badge-green" };

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <SetupBanner/><Navbar/><NetworkGuard/>
      <div style={{ maxWidth:900, margin:"0 auto", padding:"calc(var(--header-h) + 20px) 14px 60px" }}>

        {/* Toolbar */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, gap:10, flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            <Link href="/write" className="btn btn-ghost btn-sm"><ArrowLeft size={13}/>Write</Link>
            <span style={{ color:"var(--text-4)", fontSize:12 }}>›</span>
            <span style={{ fontSize:13, fontWeight:600, color:"var(--text-3)" }}>Research Paper</span>
            <button onClick={()=>setStatus(s=>s==="draft"?"in_progress":s==="in_progress"?"ready":"draft")}
              className={"badge " + (statusColors[status]||"badge-neutral")} style={{ cursor:"pointer", border:"none" }}>
              {status==="draft"?"Draft":status==="in_progress"?"In Progress":"Ready to Submit"}
            </button>
          </div>
          <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
            <span style={{ fontSize:11, color:"var(--text-4)", display:"flex", alignItems:"center", gap:4 }}>
              <Clock size={10}/>{wordCount}w · {readTime}m
              {saving && <span style={{ color:"var(--brand)", marginLeft:4 }}>Saving…</span>}
              {lastSaved && !saving && <span style={{ color:"var(--accent)", marginLeft:4 }}>Saved {lastSaved.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</span>}
            </span>
            <button onClick={()=>setPreview(v=>!v)} className="btn btn-ghost btn-sm">
              {preview?<><EyeOff size={12}/>Edit</>:<><Eye size={12}/>Preview</>}
            </button>
            <button onClick={()=>saveDraft()} disabled={saving} className="btn btn-secondary btn-sm"><Save size={12}/>Save</button>
            <button onClick={submit} disabled={submitting||wordCount<50} className="btn btn-primary btn-sm" style={{ fontWeight:700 }}>
              {submitting?<><div style={{ width:11,height:11,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%"}} className="spin"/>Submitting…</>:<><Send size={12}/>Submit</>}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height:3, background:"var(--border)", borderRadius:99, marginBottom:16, overflow:"hidden" }}>
          <div style={{ height:"100%", width:completion+"%", background:"linear-gradient(90deg,var(--brand),var(--accent))", transition:"width .4s", borderRadius:99 }}/>
        </div>

        {error && <div style={{ marginBottom:12,padding:"10px 14px",background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.18)",borderRadius:"var(--r-md)",fontSize:13,color:"#dc2626",display:"flex",gap:8 }}><AlertCircle size={13} style={{ flexShrink:0,marginTop:1 }}/>{error}</div>}

        {preview ? (
          /* Preview mode */
          <div className="card" style={{ padding:"clamp(24px,5vw,44px)" }}>
            <div style={{ display:"flex",gap:8,marginBottom:20,flexWrap:"wrap" }}>
              <span className="badge badge-brand">Research Paper</span>
              <span className="price-tag">${price.toFixed(3)} USDC</span>
            </div>
            <h1 style={{ fontFamily:"Outfit,sans-serif",fontSize:"clamp(22px,4vw,36px)",fontWeight:900,color:"var(--text)",marginBottom:14,lineHeight:1.1,letterSpacing:"-.03em" }}>{title||"Untitled Research Paper"}</h1>
            {keywords.length>0 && <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:18 }}>{keywords.map(k=><span key={k} className="badge badge-neutral">{k}</span>)}</div>}
            <hr className="divider" style={{ marginBottom:24 }}/>
            <div className="article-body">
              {sections.map(s=>s.content&&(
                <div key={s.id} style={{ marginBottom:28 }}>
                  <h2 style={{ fontFamily:"Outfit,sans-serif",fontSize:"1.3em",fontWeight:800,color:"var(--text)",marginBottom:10 }}>{s.title}</h2>
                  <p style={{ whiteSpace:"pre-wrap",lineHeight:1.85,color:"var(--text-2)" }}>{s.content}</p>
                </div>
              ))}
              {references.length>0&&(
                <div>
                  <h2 style={{ fontFamily:"Outfit,sans-serif",fontSize:"1.3em",fontWeight:800,color:"var(--text)",marginBottom:12 }}>References</h2>
                  <ol style={{ paddingLeft:20 }}>
                    {references.map((r,i)=><li key={r.id} style={{ marginBottom:6,color:"var(--text-2)",lineHeight:1.6 }}>{r.text}{r.year&&" ("+r.year+")"}{r.url&&<a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color:"var(--brand)",marginLeft:6,fontSize:12 }}>[link]</a>}</li>)}
                  </ol>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {/* Title + meta */}
            <div className="card" style={{ padding:"20px" }}>
              <input type="text" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Research paper title…"
                style={{ width:"100%",border:"none",outline:"none",fontFamily:"Outfit,sans-serif",fontSize:"clamp(20px,3.5vw,30px)",fontWeight:900,letterSpacing:"-.025em",color:"var(--text)",background:"transparent",marginBottom:14 }}/>
              <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
                <div style={{ flex:2,minWidth:180 }}>
                  <label style={{ fontSize:10,fontWeight:700,color:"var(--text-4)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5,fontFamily:"Outfit,sans-serif" }}>Keywords</label>
                  <div style={{ display:"flex",gap:5,flexWrap:"wrap",marginBottom:6 }}>
                    {keywords.map(k=><span key={k} style={{ display:"flex",alignItems:"center",gap:3,padding:"3px 8px",background:"var(--brand-muted)",border:"1px solid var(--brand-border)",borderRadius:"var(--r-f)",fontSize:11,color:"var(--brand)" }}>
                      {k}<button onClick={()=>setKeywords(p=>p.filter(x=>x!==k))} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--brand)",padding:0,display:"flex" }}><X size={10}/></button>
                    </span>)}
                  </div>
                  <div style={{ display:"flex",gap:6 }}>
                    <input value={kwInput} onChange={e=>setKwInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"||e.key===","){e.preventDefault();addKeyword();}}} placeholder="Type keyword + Enter"
                      style={{ flex:1,padding:"6px 10px",background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",fontSize:12,color:"var(--text)",outline:"none" }}/>
                    <button onClick={addKeyword} className="btn btn-secondary btn-xs"><Plus size={11}/>Add</button>
                  </div>
                </div>
                <div style={{ flex:1,minWidth:100 }}>
                  <label style={{ fontSize:10,fontWeight:700,color:"var(--text-4)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5,fontFamily:"Outfit,sans-serif" }}>Price</label>
                  <div style={{ display:"flex",alignItems:"center",gap:3,background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",padding:"7px 10px" }}>
                    <span style={{ fontWeight:700,color:"var(--text-4)" }}>$</span>
                    <input type="number" step="0.01" min="0.01" value={price} onChange={e=>setPrice(parseFloat(e.target.value)||0)} style={{ flex:1,border:"none",outline:"none",background:"transparent",fontSize:17,fontWeight:700,color:"var(--accent)",fontFamily:"Outfit,sans-serif" }}/>
                    <span style={{ fontSize:10,color:"var(--text-4)",fontWeight:600 }}>USDC</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sections */}
            {sections.map(s=>(
              <div key={s.id} className="card" style={{ overflow:"hidden",padding:0 }}>
                <div style={{ padding:"11px 14px",background:"var(--bg-alt)",borderBottom:s.collapsed?"none":"1px solid var(--border)",display:"flex",alignItems:"center",gap:9 }}>
                  <GripVertical size={13} style={{ color:"var(--text-4)",cursor:"grab",flexShrink:0 }}/>
                  <input value={s.title} onChange={e=>updateSection(s.id,"title",e.target.value)} style={{ flex:1,border:"none",outline:"none",background:"transparent",fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:700,color:"var(--text)" }}/>
                  <span style={{ fontSize:10,color:"var(--text-4)",marginLeft:"auto",flexShrink:0 }}>{s.content.split(/\s+/).filter(Boolean).length}w</span>
                  {s.required && <span className="badge badge-brand" style={{ fontSize:8 }}>Required</span>}
                  <button onClick={()=>updateSection(s.id,"collapsed",!s.collapsed)} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text-4)",display:"flex",padding:2 }}>
                    {s.collapsed?<ChevronDown size={14}/>:<ChevronUp size={14}/>}
                  </button>
                  {!s.required&&<button onClick={()=>removeSection(s.id)} style={{ background:"none",border:"none",cursor:"pointer",color:"#dc2626",display:"flex",padding:2 }}><Trash2 size={13}/></button>}
                </div>
                {!s.collapsed&&(
                  <textarea value={s.content} onChange={e=>updateSection(s.id,"content",e.target.value)}
                    placeholder={PLACEHOLDERS[s.type]||"Write the " + s.title + " section…"}
                    style={{ width:"100%",border:"none",outline:"none",background:"var(--bg-card)",color:"var(--text)",fontFamily:"Inter,sans-serif",fontSize:14,lineHeight:1.85,padding:"18px 20px",resize:"vertical",minHeight:130 }}/>
                )}
              </div>
            ))}

            {/* Add section buttons */}
            <div style={{ display:"flex",gap:7,flexWrap:"wrap" }}>
              <button onClick={()=>addSection("methodology","Methodology")} className="btn btn-secondary btn-sm">+ Methodology</button>
              <button onClick={()=>addSection("results","Results")} className="btn btn-secondary btn-sm">+ Results</button>
              <button onClick={()=>addSection("discussion","Discussion")} className="btn btn-secondary btn-sm">+ Discussion</button>
              <button onClick={()=>addSection("custom","Custom Section")} className="btn btn-ghost btn-sm"><Plus size={12}/>Custom</button>
            </div>

            {/* References */}
            <div className="card" style={{ padding:"18px" }}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
                <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:700,color:"var(--text)",display:"flex",alignItems:"center",gap:6 }}><BookOpen size={13}/>References ({references.length})</h3>
                <button onClick={addRef} className="btn btn-secondary btn-xs"><Plus size={11}/>Add</button>
              </div>
              {!references.length ? (
                <p style={{ fontSize:12,color:"var(--text-4)",fontStyle:"italic" }}>No references yet.</p>
              ) : references.map((r,i)=>(
                <div key={r.id} style={{ display:"flex",gap:9,alignItems:"flex-start",marginBottom:10 }}>
                  <span style={{ fontSize:12,fontWeight:700,color:"var(--text-4)",paddingTop:9,minWidth:20,flexShrink:0 }}>{i+1}.</span>
                  <div style={{ flex:1,display:"grid",gap:5 }}>
                    <input value={r.text} onChange={e=>updateRef(r.id,"text",e.target.value)} placeholder="Author(s). Title. Journal, Year." className="admin-input" style={{ fontSize:12 }}/>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 70px",gap:5 }}>
                      <input value={r.url} onChange={e=>updateRef(r.id,"url",e.target.value)} placeholder="https://doi.org/…" className="admin-input" style={{ fontSize:11,fontFamily:"JetBrains Mono,monospace" }}/>
                      <input value={r.year} onChange={e=>updateRef(r.id,"year",e.target.value)} placeholder="Year" className="admin-input" style={{ fontSize:12 }}/>
                    </div>
                  </div>
                  <button onClick={()=>removeRef(r.id)} style={{ background:"none",border:"none",cursor:"pointer",color:"#dc2626",padding:8,display:"flex",flexShrink:0 }}><Trash2 size={12}/></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
