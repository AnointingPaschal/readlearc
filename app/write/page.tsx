"use client";
import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Bold, Italic, Heading2, List, Quote, Code2, Eye, EyeOff, Send, DollarSign, Clock, CheckCircle2, AlertCircle, PenLine, FileText, FlaskConical, Hash } from "lucide-react";
import Navbar from "../../components/ui/Navbar";
import SetupBanner from "../../components/ui/SetupBanner";
import ConnectGate from "../../components/ui/ConnectGate";
import { useAuth } from "../../lib/auth";
import { EXPLORER_URL } from "../../lib/chain";

const CATS = ["Web3","Development","Blockchain","Economics","Research","Guide","AI","DeFi","Culture","Opinion"];

function renderPreview(text: string) {
  return text.trim()
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^# (.+)$/gm,  "<h2 style='font-family:Outfit,sans-serif;font-size:1.5em;font-weight:800;color:var(--text);margin:1.8em 0 .6em;letter-spacing:-.03em'>$1</h2>")
    .replace(/^## (.+)$/gm, "<h3 style='font-family:Outfit,sans-serif;font-size:1.2em;font-weight:700;color:var(--text);margin:1.5em 0 .5em'>$1</h3>")
    .replace(/^> (.+)$/gm,  "<blockquote style='border-left:3px solid var(--brand);padding-left:16px;color:var(--text-3);font-style:italic;margin:20px 0'>$1</blockquote>")
    .split("\n\n").map(p => {
      if (p.startsWith("<h") || p.startsWith("<blockquote")) return p;
      if (p.startsWith("- ") || p.startsWith("• ")) {
        const items = p.split("\n").map(l=>l.replace(/^[-•]\s*/,"")).filter(Boolean);
        return `<ul style='padding-left:22px;margin:14px 0'>${items.map(i=>`<li style='margin:7px 0'>${i}</li>`).join("")}</ul>`;
      }
      return `<p style='margin-bottom:18px'>${p}</p>`;
    }).join("");
}

export default function WritePage() {
  const { isAuth, address } = useAuth();

  const [title,      setTitle]      = useState("");
  const [blurb,      setBlurb]      = useState("");
  const [body,       setBody]       = useState("");
  const [price,      setPrice]      = useState(0.02);
  const [category,   setCategory]   = useState("");
  const [isResearch, setIsResearch] = useState(false);
  const [preview,    setPreview]    = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published,  setPublished]  = useState(false);
  const [articleId,  setArticleId]  = useState("");
  const [step,       setStep]       = useState("");
  const [error,      setError]      = useState("");
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const words    = body.split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(words / 200));

  const checks = [
    { label:"Title added",   ok: title.trim().length > 3   },
    { label:"Blurb written", ok: blurb.trim().length > 10  },
    { label:"Body content",  ok: body.trim().length  > 50  },
    { label:"Category set",  ok: category.length     > 0   },
    { label:"Price set",     ok: price               >= 0.001 },
  ];
  const allDone = checks.every(c => c.ok);

  const insertText = useCallback((prefix: string, suffix = "", placeholder = "") => {
    const el = editorRef.current;
    if (!el) return;
    const start = el.selectionStart, end = el.selectionEnd;
    const selected = body.slice(start, end) || placeholder;
    const next = body.slice(0, start) + prefix + selected + suffix + body.slice(end);
    setBody(next);
    setTimeout(() => {
      el.focus();
      const pos = start + prefix.length + selected.length + suffix.length;
      el.setSelectionRange(pos, pos);
    }, 10);
  }, [body]);

  const TOOLBAR = [
    { icon:Bold,    title:"Bold",    action:()=>insertText("**","**","bold text")       },
    { icon:Italic,  title:"Italic",  action:()=>insertText("_","_","italic text")       },
    { icon:Heading2,title:"H2",      action:()=>insertText("\n## ","","Heading")         },
    { icon:Hash,    title:"H1",      action:()=>insertText("\n# ","","Main Heading")     },
    { icon:List,    title:"List",    action:()=>insertText("\n- ","","List item")        },
    { icon:Quote,   title:"Quote",   action:()=>insertText("\n> ","","Your quote here")  },
    { icon:Code2,   title:"Code",    action:()=>insertText("`","`","code")               },
  ];

  async function publish() {
    if (!allDone || !address) return;
    setPublishing(true); setError(""); setStep("Saving to database…");
    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:         title.trim(),
          blurb:         blurb.trim(),
          content:       body.trim(),
          price,
          category,
          readTime,
          isResearch,
          authorAddress: address,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setArticleId(String(data.id));
      setPublished(true);
    } catch (e: any) {
      setError(e.message?.slice(0, 200) || "Failed to publish");
    } finally { setPublishing(false); setStep(""); }
  }

  if (!isAuth) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <SetupBanner/><Navbar/>
      <ConnectGate title="Connect to write" body="Connect your wallet to publish articles on Readlearc." icon={PenLine}/>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <SetupBanner/><Navbar/>
      <div style={{ maxWidth:1160, margin:"0 auto", padding:"calc(var(--header-h) + 20px) 14px 60px" }}>

        {/* Top bar */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, gap:10, flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Link href="/" className="btn btn-ghost btn-sm"><ArrowLeft size={13}/>Home</Link>
            <span style={{ color:"var(--text-4)", fontSize:13 }}>›</span>
            <span style={{ fontSize:13, fontWeight:600, color:"var(--text-3)" }}>New {isResearch?"Research Paper":"Article"}</span>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <button onClick={()=>setPreview(v=>!v)} className="btn btn-ghost btn-sm">
              {preview?<><EyeOff size={13}/>Edit</>:<><Eye size={13}/>Preview</>}
            </button>
            <button onClick={publish} disabled={publishing||published||!allDone||!address} className="btn btn-primary btn-sm" style={{ fontWeight:700, minWidth:140 }}>
              {publishing
                ? <><div style={{ width:12,height:12,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%" }} className="spin"/>{step||"Publishing…"}</>
                : published
                ? <><CheckCircle2 size={13}/>Published!</>
                : <><Send size={13}/>Publish Article</>}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ marginBottom:14, padding:"12px 16px", background:"rgba(220,38,38,.06)", border:"1px solid rgba(220,38,38,.18)", borderRadius:"var(--r-md)", display:"flex", gap:9 }}>
            <AlertCircle size={14} style={{ color:"#dc2626", flexShrink:0, marginTop:1 }}/>
            <span style={{ fontSize:13, color:"#dc2626" }}>{error}</span>
          </div>
        )}

        {/* Success */}
        {published ? (
          <div className="card" style={{ padding:"clamp(32px,6vw,64px) clamp(20px,4vw,32px)", textAlign:"center", maxWidth:520, margin:"0 auto" }}>
            <div style={{ width:60,height:60,borderRadius:"50%",background:"rgba(5,150,105,.08)",border:"1.5px solid rgba(5,150,105,.2)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px" }}>
              <CheckCircle2 size={28} style={{ color:"var(--accent)" }}/>
            </div>
            <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(22px,5vw,32px)", fontWeight:900, color:"var(--text)", marginBottom:8, letterSpacing:"-0.02em" }}>
              {isResearch?"Research paper":"Article"} submitted!
            </h2>
            <p style={{ color:"var(--text-3)", fontSize:14, marginBottom:4 }}>Article #{articleId} · Status: <strong style={{ color:"#d97706" }}>Pending review</strong></p>
            <p style={{ color:"var(--text-4)", fontSize:12, marginBottom:24 }}>An admin will approve your article — it will then appear on the homepage.</p>
            <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap", marginTop:8 }}>
              {articleId && <Link href={`/article/${articleId}`} className="btn btn-primary">Preview Article</Link>}
              <Link href="/creator" className="btn btn-secondary">Creator Studio</Link>
              <button onClick={()=>{setPublished(false);setTitle("");setBlurb("");setBody("");setCategory("");setArticleId("");setIsResearch(false);}} className="btn btn-ghost">Write Another</button>
            </div>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 260px", gap:16, alignItems:"start" }} id="write-grid">
            <style>{`@media(max-width:768px){#write-grid{grid-template-columns:1fr !important}#write-sidebar{order:-1}}`}</style>

            {/* Editor */}
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div className="card" style={{ padding:"20px 22px" }}>
                <input type="text" placeholder={isResearch?"Research paper title…":"Article title…"} value={title} onChange={e=>setTitle(e.target.value)}
                  style={{ width:"100%", border:"none", outline:"none", fontFamily:"Outfit,sans-serif", fontSize:"clamp(20px,4vw,32px)", fontWeight:900, letterSpacing:"-0.025em", color:"var(--text)", background:"transparent", lineHeight:1.15 }}/>
              </div>
              <div className="card" style={{ padding:"16px 20px" }}>
                <label style={{ fontSize:10, fontWeight:700, color:"var(--text-4)", textTransform:"uppercase", letterSpacing:".07em", display:"block", marginBottom:7, fontFamily:"Outfit,sans-serif" }}>
                  Preview blurb <span style={{ color:"var(--text-4)", fontWeight:400, fontSize:9 }}>(shown before paywall)</span>
                </label>
                <textarea placeholder="A teaser that convinces readers to unlock the full article…" value={blurb} onChange={e=>setBlurb(e.target.value)} maxLength={320} rows={3}
                  style={{ width:"100%", border:"none", outline:"none", background:"transparent", color:"var(--text-2)", fontSize:14, lineHeight:1.65, resize:"none", fontFamily:"Inter,sans-serif" }}/>
                <div style={{ textAlign:"right", fontSize:10, color:"var(--text-4)", marginTop:4, fontFamily:"JetBrains Mono,monospace" }}>{blurb.length}/320</div>
              </div>

              {!preview ? (
                <div className="card" style={{ overflow:"hidden", padding:0 }}>
                  <div style={{ padding:"8px 14px", borderBottom:"1px solid var(--border)", background:"var(--bg-alt)", display:"flex", alignItems:"center", gap:2, flexWrap:"wrap" }}>
                    {TOOLBAR.map(({ icon:Icon, title, action }) => (
                      <button key={title} onClick={action} title={title}
                        style={{ width:32,height:30,borderRadius:"var(--r)",border:"none",background:"transparent",color:"var(--text-3)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .12s" }}
                        onMouseEnter={e=>{(e.currentTarget as any).style.background="var(--border)";(e.currentTarget as any).style.color="var(--text)"}}
                        onMouseLeave={e=>{(e.currentTarget as any).style.background="transparent";(e.currentTarget as any).style.color="var(--text-3)"}}>
                        <Icon size={14} strokeWidth={2}/>
                      </button>
                    ))}
                    <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:5, fontSize:11, color:"var(--text-4)" }}>
                      <Clock size={11}/>{readTime}m · {words} words
                    </div>
                  </div>
                  <textarea ref={editorRef} value={body} onChange={e=>setBody(e.target.value)} rows={22}
                    placeholder={isResearch
                      ? "## Abstract\n\nYour abstract here…\n\n## Introduction\n\n## Methodology\n\n## Results\n\n## Discussion\n\n## Conclusion"
                      : "Write your full article here.\n\nMarkdown supported: **bold**, _italic_, ## heading, > quote, - list item\n\nThe first 50% will be shown free — the rest requires payment to unlock."}
                    style={{ width:"100%",border:"none",outline:"none",background:"var(--bg-card)",color:"var(--text)",fontFamily:"Inter,sans-serif",fontSize:15,lineHeight:1.85,padding:"20px 22px",resize:"vertical",minHeight:400 }}/>
                </div>
              ) : (
                <div className="card" style={{ padding:"clamp(20px,4vw,36px)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20, paddingBottom:14, borderBottom:"1px solid var(--border)" }}>
                    <span className="badge badge-brand" style={{ textTransform:"capitalize" }}>{category||"Uncategorized"}</span>
                    <span className="price-tag">${price.toFixed(3)} USDC</span>
                    {isResearch && <span className="badge badge-blue">Research</span>}
                  </div>
                  <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(22px,5vw,36px)", fontWeight:900, color:"var(--text)", marginBottom:16, lineHeight:1.15, letterSpacing:"-0.03em" }}>{title||"Your title…"}</h1>
                  <p style={{ fontSize:16, color:"var(--text-2)", lineHeight:1.72, marginBottom:20, borderLeft:"3px solid var(--brand)", paddingLeft:16, fontStyle:"italic" }}>{blurb||"Your blurb…"}</p>
                  <hr className="divider" style={{ marginBottom:20 }}/>
                  <div className="article-body" dangerouslySetInnerHTML={{ __html: renderPreview(body)||"<p style='color:var(--text-4);font-style:italic'>Start writing to see preview…</p>" }}/>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div id="write-sidebar" style={{ display:"flex", flexDirection:"column", gap:12, position:"sticky", top:"calc(var(--header-h) + 12px)" }}>

              {/* Content type */}
              <div className="card" style={{ padding:"16px" }}>
                <h3 style={{ fontSize:12, fontWeight:700, color:"var(--text-2)", marginBottom:10, fontFamily:"Outfit,sans-serif" }}>Content Type</h3>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
                  {[{id:false,icon:FileText,label:"Article",sub:"Blog post"},{id:true,icon:FlaskConical,label:"Research",sub:"Paper"}].map(t=>(
                    <button key={String(t.id)} onClick={()=>setIsResearch(t.id)}
                      style={{ padding:"10px 8px", borderRadius:"var(--r-md)", textAlign:"center", cursor:"pointer", transition:"all .15s", display:"flex", flexDirection:"column", alignItems:"center", gap:5,
                        border:`1.5px solid ${isResearch===t.id?"var(--brand)":"var(--border)"}`,
                        background:isResearch===t.id?"var(--brand-muted)":"transparent" }}>
                      <t.icon size={14} style={{ color:isResearch===t.id?"var(--brand)":"var(--text-4)" }}/>
                      <div style={{ fontSize:12, fontWeight:700, color:isResearch===t.id?"var(--brand)":"var(--text-2)" }}>{t.label}</div>
                      <div style={{ fontSize:10, color:"var(--text-4)" }}>{t.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="card" style={{ padding:"16px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:12 }}><DollarSign size={13} style={{ color:"var(--accent)" }}/><h3 style={{ fontSize:12, fontWeight:700, color:"var(--text-2)", fontFamily:"Outfit,sans-serif" }}>Price</h3></div>
                <div style={{ display:"flex", alignItems:"baseline", gap:4, background:"var(--bg-alt)", border:"1.5px solid var(--border)", borderRadius:"var(--r-md)", padding:"8px 12px", marginBottom:10 }}>
                  <span style={{ fontWeight:700, color:"var(--text-4)", fontSize:13 }}>$</span>
                  <input type="number" min={0.001} max={1} step={0.001} value={price} onChange={e=>setPrice(parseFloat(e.target.value)||0)}
                    style={{ flex:1, border:"none", outline:"none", background:"transparent", fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--accent)", width:"100%" }}/>
                  <span style={{ color:"var(--text-4)", fontSize:11, fontWeight:700, flexShrink:0 }}>USDC</span>
                </div>
                <input type="range" min={0.001} max={1} step={0.001} value={price} onChange={e=>setPrice(parseFloat(e.target.value))}
                  style={{ width:"100%", accentColor:"var(--accent)", cursor:"pointer", marginBottom:6 }}/>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"var(--text-4)", marginBottom:10 }}><span>$0.001</span><span>$1.00</span></div>
                <div style={{ padding:"8px 10px", background:"var(--accent-muted)", border:"1px solid rgba(5,150,105,.2)", borderRadius:"var(--r)", fontSize:12 }}>
                  You earn <strong style={{ color:"var(--accent)", fontFamily:"Outfit,sans-serif" }}>${(price*0.85).toFixed(4)}</strong>
                  <span style={{ color:"var(--text-4)" }}> per read (85%)</span>
                </div>
              </div>

              {/* Category */}
              <div className="card" style={{ padding:"16px" }}>
                <h3 style={{ fontSize:12, fontWeight:700, color:"var(--text-2)", marginBottom:10, fontFamily:"Outfit,sans-serif" }}>Category</h3>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                  {CATS.map(c=>(
                    <button key={c} onClick={()=>setCategory(c)} style={{ padding:"5px 10px", borderRadius:"var(--r-f)", fontSize:11, fontWeight:600, cursor:"pointer", transition:"all .13s",
                      border:`1.5px solid ${category===c?"var(--brand)":"var(--border)"}`, background:category===c?"var(--brand-muted)":"transparent", color:category===c?"var(--brand)":"var(--text-3)" }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checklist */}
              <div className="card" style={{ padding:"16px" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                  <h3 style={{ fontSize:12, fontWeight:700, color:"var(--text-2)", fontFamily:"Outfit,sans-serif" }}>Checklist</h3>
                  <span style={{ fontSize:11, fontWeight:700, color:allDone?"var(--accent)":"var(--text-4)" }}>{checks.filter(c=>c.ok).length}/{checks.length}</span>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  {checks.map(item=>(
                    <div key={item.label} style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:16,height:16,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",
                        border:`1.5px solid ${item.ok?"var(--accent)":"var(--border-2)"}`, background:item.ok?"var(--accent-muted)":"transparent" }}>
                        {item.ok && <CheckCircle2 size={10} style={{ color:"var(--accent)" }}/>}
                      </div>
                      <span style={{ fontSize:12, color:item.ok?"var(--text-2)":"var(--text-4)", fontWeight:item.ok?500:400 }}>{item.label}</span>
                    </div>
                  ))}
                </div>
                {allDone && address && !published && (
                  <button onClick={publish} disabled={publishing} className="btn btn-primary" style={{ marginTop:14, width:"100%", justifyContent:"center", fontWeight:700, fontSize:13 }}>
                    {publishing?<><div style={{ width:12,height:12,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%"}} className="spin"/>Publishing…</>:<><Send size={13}/>Publish to Supabase</>}
                  </button>
                )}
                {!address && <div style={{ marginTop:10, fontSize:11, color:"#dc2626", textAlign:"center" }}>Connect wallet first</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
