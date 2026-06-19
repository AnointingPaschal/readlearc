"use client";
import { useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { ArrowLeft, Bold, Italic, Heading2, List, Quote, Code, Eye, Send, DollarSign, Clock, CheckCircle2, AlertCircle, PenLine } from "lucide-react";
import Navbar from "../../components/ui/Navbar";
import SetupBanner from "../../components/ui/SetupBanner";
import ConnectGate from "../../components/ui/ConnectGate";
import { useWallet } from "../../lib/wallet";
import { CONTRACT_ADDRESS, CONTRACT_ABI, USDC_ADDRESS, EXPLORER_URL, IS_CONFIGURED } from "../../lib/chain";

const CATS = ["Web3","Development","Blockchain","Economics","Research","Guide","AI","DeFi","Culture","Opinion"];

export default function WritePage() {
  const { isConnected, signer, address } = useWallet();
  const [title,     setTitle]     = useState("");
  const [blurb,     setBlurb]     = useState("");
  const [body,      setBody]      = useState("");
  const [price,     setPrice]     = useState(0.02);
  const [category,  setCategory]  = useState("");
  const [preview,   setPreview]   = useState(false);
  const [publishing,setPublishing]= useState(false);
  const [published, setPublished] = useState(false);
  const [txHash,    setTxHash]    = useState("");
  const [articleId, setArticleId] = useState("");
  const [step,      setStep]      = useState("");
  const [error,     setError]     = useState("");

  const words    = body.split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(words/200));

  const checks = [
    { label:"Title",     done: title.length > 0     },
    { label:"Blurb",     done: blurb.length > 0     },
    { label:"Body text", done: body.length > 50     },
    { label:"Category",  done: category.length > 0  },
    { label:"Price set", done: price > 0            },
  ];
  const allDone = checks.every(c => c.done);

  async function publish() {
    if (!signer || !IS_CONFIGURED || !allDone) return;
    setPublishing(true); setError("");
    try {
      const c = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      setStep("Sign in wallet…");
      const priceUnits = ethers.parseUnits(price.toFixed(6), 6);
      const tx = await c.publishArticle(title, blurb, body, priceUnits, category, readTime);
      setStep("Confirming on Arc…");
      const receipt = await tx.wait();
      setTxHash(tx.hash);
      // Parse article ID from event
      const event = receipt.logs.find((l: any) => {
        try { const iface = new ethers.Interface(["event ArticlePublished(uint256 indexed id, address indexed author, string title)"]); iface.parseLog(l); return true; } catch { return false; }
      });
      if (event) {
        try { const iface = new ethers.Interface(["event ArticlePublished(uint256 indexed id, address indexed author, string title)"]); const parsed = iface.parseLog(event as any); setArticleId(parsed?.args[0]?.toString() || ""); } catch {}
      }
      setPublished(true);
    } catch (e: any) { setError(e.reason || e.message || "Transaction failed"); }
    finally { setPublishing(false); setStep(""); }
  }

  if (!isConnected) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <SetupBanner /><Navbar />
      <ConnectGate title="Connect to write" body="Connect your wallet to publish articles on-chain. Your content will be stored permanently on Arc blockchain." icon={PenLine} />
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <SetupBanner /><Navbar />
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"74px 14px 60px" }}>

        {/* Top bar */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22, flexWrap:"wrap", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <Link href="/" className="btn btn-ghost btn-sm"><ArrowLeft size={14}/>Home</Link>
            <span style={{ color:"var(--text-4)" }}>›</span>
            <span style={{ fontSize:13, fontWeight:600, color:"var(--text-3)" }}>New Article</span>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => setPreview(v => !v)} className="btn btn-ghost btn-sm"><Eye size={14}/>{preview?"Edit":"Preview"}</button>
            <button onClick={publish} disabled={publishing||published||!allDone||!IS_CONFIGURED} className="btn btn-primary btn-sm" style={{ fontWeight:700 }}>
              {publishing ? <><div style={{ width:12,height:12,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%"}} className="spin"/>{step}</> : published ? <><CheckCircle2 size={14}/>Published!</> : <><Send size={13}/>Publish to Chain</>}
            </button>
          </div>
        </div>

        {error && <div style={{ marginBottom:14, padding:"12px 16px", background:"rgba(220,38,38,.06)", border:"1px solid rgba(220,38,38,.18)", borderRadius:"var(--r)", display:"flex", gap:10, alignItems:"flex-start" }}>
          <AlertCircle size={14} style={{ color:"#dc2626", flexShrink:0, marginTop:1 }}/><span style={{ fontSize:13, color:"#dc2626" }}>{error}</span></div>}

        {published ? (
          <div className="card" style={{ padding:"clamp(32px,6vw,64px) clamp(20px,4vw,32px)", textAlign:"center" }}>
            <div style={{ width:60,height:60,borderRadius:"50%",background:"rgba(5,150,105,.08)",border:"1px solid rgba(5,150,105,.2)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px" }}>
              <CheckCircle2 size={28} style={{ color:"#059669" }}/>
            </div>
            <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(22px,5vw,34px)", fontWeight:900, color:"var(--text)", marginBottom:10 }}>Article Published! 🎉</h2>
            <p style={{ color:"var(--text-3)", fontSize:15, marginBottom:6 }}>Your article is live on Arc blockchain.</p>
            {articleId && <p style={{ fontSize:12, color:"var(--text-4)", marginBottom:6 }}>Article ID: #{articleId}</p>}
            {txHash && <a href={`${EXPLORER_URL}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:"var(--brand)", fontFamily:"JetBrains Mono,monospace", textDecoration:"none", display:"inline-flex", alignItems:"center", gap:3, marginBottom:24 }}>Tx: {txHash.slice(0,16)}…</a>}
            <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap", marginTop:10 }}>
              {articleId && <Link href={`/article/${articleId}`} className="btn btn-primary">View Article</Link>}
              <Link href="/creator" className="btn btn-secondary">Creator Studio</Link>
              <button onClick={() => { setPublished(false); setTitle(""); setBlurb(""); setBody(""); setCategory(""); setTxHash(""); setArticleId(""); }} className="btn btn-ghost">Write Another</button>
            </div>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"1fr clamp(240px,25vw,280px)", gap:20, alignItems:"start" }} className="write-layout">

            {/* Editor */}
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {publishing && <div style={{ padding:"12px 16px", background:"var(--brand-muted)", border:"1.5px solid var(--border-brand)", borderRadius:"var(--r)", display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:13,height:13,border:"2px solid rgba(109,40,217,.3)",borderTopColor:"var(--brand)",borderRadius:"50%"}} className="spin"/><span style={{ fontSize:13, color:"var(--brand)", fontWeight:600 }}>{step}</span></div>}

              <input type="text" placeholder="Your article title…" value={title} onChange={e => setTitle(e.target.value)}
                style={{ width:"100%", border:"none", outline:"none", fontFamily:"Outfit,sans-serif", fontSize:"clamp(22px,5vw,38px)", fontWeight:900, letterSpacing:"-0.02em", color:"var(--text)", background:"transparent", lineHeight:1.15 }} />

              <div className="card-flat" style={{ padding:"16px 18px" }}>
                <label style={{ fontSize:10, fontWeight:700, color:"var(--text-4)", textTransform:"uppercase", letterSpacing:".07em", display:"block", marginBottom:7 }}>Preview Blurb <span style={{ color:"var(--text-4)", fontWeight:400 }}>(shown before payment)</span></label>
                <textarea placeholder="A teaser that makes readers want to unlock the full article…" value={blurb} onChange={e => setBlurb(e.target.value)} maxLength={300} rows={3}
                  style={{ width:"100%", border:"none", outline:"none", background:"transparent", color:"var(--text-2)", fontSize:14, lineHeight:1.65, resize:"none", fontFamily:"Inter,sans-serif" }} />
                <div style={{ textAlign:"right", fontSize:10, color:"var(--text-4)", fontFamily:"JetBrains Mono,monospace", marginTop:4 }}>{blurb.length}/300</div>
              </div>

              {!preview ? (
                <div className="card" style={{ overflow:"hidden", padding:0 }}>
                  <div style={{ padding:"9px 14px", borderBottom:"1px solid var(--border)", background:"var(--bg-alt)", display:"flex", alignItems:"center", gap:2, flexWrap:"wrap" }}>
                    {[{icon:Bold,label:"Bold"},{icon:Italic,label:"Italic"},{icon:Heading2,label:"Heading"},{icon:List,label:"List"},{icon:Quote,label:"Quote"},{icon:Code,label:"Code"}].map(({icon:Icon,label}) => (
                      <button key={label} title={label} style={{ width:32,height:32,borderRadius:"var(--r2)",border:"none",background:"transparent",color:"var(--text-3)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s" }}
                        onMouseEnter={e=>{(e.currentTarget as any).style.background="var(--border)";(e.currentTarget as any).style.color="var(--text)"}}
                        onMouseLeave={e=>{(e.currentTarget as any).style.background="transparent";(e.currentTarget as any).style.color="var(--text-3)"}}
                      ><Icon size={15} strokeWidth={2}/></button>
                    ))}
                    <div style={{ marginLeft:"auto", fontSize:11, color:"var(--text-4)", display:"flex", alignItems:"center", gap:5 }}><Clock size={11}/>{readTime}m · {words} words</div>
                  </div>
                  <textarea placeholder="Write your full article here. It will be stored entirely on-chain…" value={body} onChange={e => setBody(e.target.value)} rows={22} className="editor" />
                </div>
              ) : (
                <div className="card" style={{ padding:"clamp(24px,4vw,40px) clamp(18px,4vw,36px)" }}>
                  <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(22px,5vw,32px)", fontWeight:900, color:"var(--text)", marginBottom:14, letterSpacing:"-0.02em" }}>{title||"Your title…"}</h1>
                  <p style={{ fontSize:16, color:"var(--text-2)", lineHeight:1.7, marginBottom:20, borderLeft:"3px solid var(--brand)", paddingLeft:16 }}>{blurb||"Your blurb…"}</p>
                  <hr className="divider" style={{ marginBottom:20 }} />
                  <div style={{ fontSize:15, color:"var(--text-2)", lineHeight:1.85, whiteSpace:"pre-wrap" }}>{body||"Your article body…"}</div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div style={{ display:"flex", flexDirection:"column", gap:12, position:"sticky", top:80 }}>
              {/* Price */}
              <div className="card" style={{ padding:"18px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:14 }}><DollarSign size={14} style={{ color:"#059669" }}/><h3 style={{ fontSize:13, fontWeight:700, color:"var(--text-2)" }}>Article Price</h3></div>
                <div style={{ display:"flex", alignItems:"center", gap:6, background:"var(--bg-alt)", border:"1.5px solid var(--border)", borderRadius:"var(--r)", padding:"10px 13px", marginBottom:10 }}>
                  <span style={{ color:"var(--text-4)", fontWeight:700 }}>$</span>
                  <input type="number" min={0.001} max={1} step={0.001} value={price} onChange={e => setPrice(parseFloat(e.target.value)||0)}
                    style={{ flex:1, border:"none", outline:"none", background:"transparent", fontFamily:"Outfit,sans-serif", fontSize:24, fontWeight:900, color:"#059669" }} />
                  <span style={{ color:"var(--text-4)", fontSize:11, fontWeight:700 }}>USDC</span>
                </div>
                <input type="range" min={0.001} max={1} step={0.001} value={price} onChange={e => setPrice(parseFloat(e.target.value))} style={{ width:"100%", accentColor:"#059669", cursor:"pointer", marginBottom:4 }} />
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"var(--text-4)", marginBottom:12 }}><span>$0.001</span><span>$1.00</span></div>
                <div style={{ paddingTop:10, borderTop:"1px solid var(--border)", fontSize:12, color:"var(--text-3)" }}>
                  You earn: <strong style={{ color:"#059669" }}>${(price*.85).toFixed(4)} USDC</strong> per read
                </div>
              </div>

              {/* Category */}
              <div className="card" style={{ padding:"18px" }}>
                <h3 style={{ fontSize:13, fontWeight:700, color:"var(--text-2)", marginBottom:12 }}>Category</h3>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:5 }}>
                  {CATS.map(c => (
                    <button key={c} onClick={() => setCategory(c)} style={{ padding:"7px 8px", borderRadius:"var(--r2)", border:`1.5px solid ${category===c?"var(--brand)":"var(--border)"}`, background:category===c?"var(--brand-muted)":"transparent", color:category===c?"var(--brand)":"var(--text-3)", fontSize:12, fontWeight:600, cursor:"pointer", transition:"all .15s" }}>{c}</button>
                  ))}
                </div>
              </div>

              {/* Checklist */}
              <div className="card" style={{ padding:"18px" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                  <h3 style={{ fontSize:13, fontWeight:700, color:"var(--text-2)" }}>Checklist</h3>
                  <span style={{ fontSize:11, fontWeight:700, color:allDone?"#059669":"var(--text-4)" }}>{checks.filter(c=>c.done).length}/{checks.length}</span>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {checks.map(item => (
                    <div key={item.label} style={{ display:"flex", alignItems:"center", gap:9 }}>
                      <div style={{ width:17, height:17, borderRadius:"50%", flexShrink:0, border:`1.5px solid ${item.done?"#059669":"var(--border-mid)"}`, background:item.done?"rgba(5,150,105,.08)":"transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#059669", fontWeight:800 }}>
                        {item.done?"✓":""}
                      </div>
                      <span style={{ fontSize:12, fontWeight:500, color:item.done?"var(--text-2)":"var(--text-4)" }}>{item.label}</span>
                    </div>
                  ))}
                </div>
                {allDone && IS_CONFIGURED && (
                  <button onClick={publish} disabled={publishing||published} className="btn btn-primary" style={{ marginTop:14, width:"100%", justifyContent:"center", fontWeight:700 }}>
                    <Send size={14}/>Publish to Chain
                  </button>
                )}
                {!IS_CONFIGURED && <div style={{ marginTop:12, fontSize:11, color:"#dc2626", textAlign:"center" }}>Configure contract in Vercel first</div>}
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`.write-layout{@media(max-width:768px){grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}
