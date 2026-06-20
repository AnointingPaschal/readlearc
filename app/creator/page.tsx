"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { DollarSign, BookOpen, Users, PlusCircle, ExternalLink, RefreshCw, Send, Zap, Edit3, Trash2, X, Save, Eye, CheckCircle2, Clock } from "lucide-react";
import Navbar from "../../components/ui/Navbar";
import SetupBanner from "../../components/ui/SetupBanner";
import ConnectGate from "../../components/ui/ConnectGate";
import { useWallet } from "../../lib/wallet";
import { USDC_ADDRESS, USDC_ABI, EXPLORER_URL, type DBArticle } from "../../lib/chain";

const STATUS_COLOR: Record<string, string> = {
  approved: "#059669", pending: "#d97706", rejected: "#dc2626", featured: "#ca8a04",
};

export default function CreatorPage() {
  const { address, shortAddress, isConnected, usdcBalance, signer, refreshBalance } = useWallet();

  const [articles,  setArticles]  = useState<DBArticle[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [editing,   setEditing]   = useState<string|null>(null);
  const [editData,  setEditData]  = useState<any>({});
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState("");

  // USDC send
  const [sendTo,   setSendTo]   = useState("");
  const [sendAmt,  setSendAmt]  = useState("");
  const [sending,  setSending]  = useState(false);
  const [sendHash, setSendHash] = useState("");
  const [sendErr,  setSendErr]  = useState("");
  const [showSend, setShowSend] = useState(false);

  const load = useCallback(async () => {
    if (!address) return;
    setRefreshing(true);
    try {
      const res = await fetch(`/api/articles?admin=1&author=${address}&limit=100`);
      const data = await res.json();
      setArticles(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false); setRefreshing(false);
  }, [address]);

  useEffect(() => { if (isConnected) load(); else setLoading(false); }, [load, isConnected]);

  async function saveEdit(id: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editData, authorAddress: address }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setArticles(prev => prev.map(a => a.id===id ? { ...a, ...editData } as DBArticle : a));
      setEditing(null); setEditData({});
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  async function deleteArticle(id: string) {
    if (!confirm("Delete this article permanently?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorAddress: address }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setArticles(prev => prev.filter(a => a.id !== id));
    } catch (e: any) { alert(e.message); }
    finally { setDeleting(""); }
  }

  async function handleSend() {
    if (!signer || !sendTo || !sendAmt || !USDC_ADDRESS) return;
    setSending(true); setSendErr(""); setSendHash("");
    try {
      if (!ethers.isAddress(sendTo)) throw new Error("Invalid address");
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const dec  = await usdc.decimals();
      const tx   = await usdc.transfer(sendTo, ethers.parseUnits(sendAmt, dec));
      await tx.wait();
      setSendHash(tx.hash); setSendTo(""); setSendAmt("");
      await refreshBalance();
    } catch (e: any) { setSendErr(e.reason || e.message); }
    finally { setSending(false); }
  }

  if (!isConnected) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <SetupBanner/><Navbar/>
      <ConnectGate title="Creator Studio" body="Connect your wallet to manage your articles and earnings." icon={Zap}/>
    </div>
  );

  const totalReads = articles.reduce((s,a) => s+a.reads, 0);
  const totalEarned = articles.filter(a=>a.status==="approved"||a.status==="featured").reduce((s,a) => s+(a.reads*parseFloat(a.price)*0.85),0);
  const published  = articles.filter(a=>a.status==="approved"||a.status==="featured").length;
  const pending    = articles.filter(a=>a.status==="pending").length;

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <SetupBanner/><Navbar/>
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"calc(var(--header-h) + 28px) 14px 60px" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:22, flexWrap:"wrap", gap:12 }}>
          <div>
            <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(20px,4vw,28px)", fontWeight:900, color:"var(--text)", letterSpacing:"-0.02em" }}>Creator Studio</h1>
            <p style={{ color:"var(--text-4)", fontSize:12, marginTop:3 }}>{shortAddress} · Arc Testnet</p>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <button onClick={load} disabled={refreshing} style={{ width:34,height:34,borderRadius:"50%",border:"1.5px solid var(--border)",background:"var(--bg-alt)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-3)" }}>
              <RefreshCw size={14} className={refreshing?"spin":""}/>
            </button>
            <Link href="/write" className="btn btn-primary btn-sm" style={{ fontWeight:700 }}><PlusCircle size={13}/>New Article</Link>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:10, marginBottom:20 }}>
          {[
            { label:"Published",   value:published.toString(),         color:"var(--brand)" },
            { label:"Pending",     value:pending.toString(),           color:"#d97706"      },
            { label:"Total Reads", value:totalReads.toLocaleString(),  color:"#0284c7"      },
            { label:"Est. Earned", value:`$${totalEarned.toFixed(4)}`, color:"var(--accent)"},
            { label:"USDC Balance",value:`$${usdcBalance}`,            color:"var(--accent)"},
          ].map(k=>(
            <div key={k.label} className="card" style={{ padding:"14px" }}>
              <div style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(17px,3vw,22px)", fontWeight:900, color:k.color, lineHeight:1 }}>{k.value}</div>
              <div style={{ fontSize:11, color:"var(--text-3)", fontWeight:600, marginTop:5 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Articles */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr clamp(200px,22vw,240px)", gap:16, alignItems:"start" }}>
          <div className="card" style={{ overflow:"hidden", padding:0 }}>
            <div style={{ padding:"14px 18px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:14, fontWeight:700, color:"var(--text)" }}>My Articles</h2>
              <span style={{ fontSize:12, color:"var(--text-4)" }}>{articles.length} total</span>
            </div>

            {loading ? <div style={{ padding:14 }}>{[1,2,3].map(i=><div key={i} className="skeleton" style={{ height:56,borderRadius:8,marginBottom:8 }}/>)}</div>
            : articles.length===0 ? (
              <div style={{ padding:"40px 20px", textAlign:"center" }}>
                <BookOpen size={28} style={{ color:"var(--text-4)", marginBottom:10 }}/>
                <p style={{ fontSize:14, fontWeight:600, color:"var(--text-3)", marginBottom:4 }}>No articles yet</p>
                <Link href="/write" className="btn btn-primary btn-sm" style={{ marginTop:10 }}>Write First Article</Link>
              </div>
            ) : articles.map((a, i) => (
              <div key={a.id} style={{ borderBottom:i<articles.length-1?"1px solid var(--border)":"none" }}>
                {editing===a.id ? (
                  /* Inline edit form */
                  <div style={{ padding:"14px 16px", background:"var(--bg-alt)", display:"flex", flexDirection:"column", gap:9 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:"var(--brand)" }}>Editing #{a.id}</span>
                      <div style={{ display:"flex", gap:5 }}>
                        <button onClick={()=>saveEdit(a.id)} disabled={saving} className="btn btn-primary btn-xs">
                          {saving?<><div style={{ width:10,height:10,border:"1.5px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%"}} className="spin"/>Saving…</>:<><Save size={10}/>Save</>}
                        </button>
                        <button onClick={()=>{setEditing(null);setEditData({});}} className="btn btn-ghost btn-xs"><X size={10}/>Cancel</button>
                      </div>
                    </div>
                    <input defaultValue={a.title} onChange={e=>setEditData((d:any)=>({...d,title:e.target.value}))}
                      style={{ width:"100%",background:"var(--bg-card)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",padding:"7px 10px",fontSize:13,color:"var(--text)",outline:"none",fontFamily:"Outfit,sans-serif",fontWeight:700 }}
                      placeholder="Title" onFocus={e=>(e.target as any).style.borderColor="var(--brand)"} onBlur={e=>(e.target as any).style.borderColor="var(--border)"}
                    />
                    <textarea defaultValue={a.blurb} rows={2} onChange={e=>setEditData((d:any)=>({...d,blurb:e.target.value}))}
                      style={{ width:"100%",background:"var(--bg-card)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",padding:"7px 10px",fontSize:12,color:"var(--text)",outline:"none",resize:"vertical",fontFamily:"Inter,sans-serif" }}
                      placeholder="Blurb" onFocus={e=>(e.target as any).style.borderColor="var(--brand)"} onBlur={e=>(e.target as any).style.borderColor="var(--border)"}
                    />
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
                      <input type="number" defaultValue={a.price} step="0.001" onChange={e=>setEditData((d:any)=>({...d,price:parseFloat(e.target.value)}))}
                        style={{ background:"var(--bg-card)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",padding:"7px 10px",fontSize:13,color:"var(--accent)",outline:"none",fontFamily:"Outfit,sans-serif",fontWeight:700 }}
                        placeholder="Price USDC" onFocus={e=>(e.target as any).style.borderColor="var(--brand)"} onBlur={e=>(e.target as any).style.borderColor="var(--border)"}
                      />
                      <input defaultValue={a.category} onChange={e=>setEditData((d:any)=>({...d,category:e.target.value}))}
                        style={{ background:"var(--bg-card)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",padding:"7px 10px",fontSize:13,color:"var(--text)",outline:"none" }}
                        placeholder="Category" onFocus={e=>(e.target as any).style.borderColor="var(--brand)"} onBlur={e=>(e.target as any).style.borderColor="var(--border)"}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ padding:"13px 16px", display:"flex", alignItems:"flex-start", gap:12 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", gap:6, marginBottom:5, flexWrap:"wrap", alignItems:"center" }}>
                        <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:"var(--r-f)", background:`${STATUS_COLOR[a.status]||"#6b7280"}14`, color:STATUS_COLOR[a.status]||"#6b7280", border:`1px solid ${STATUS_COLOR[a.status]||"#6b7280"}30`, fontFamily:"Outfit,sans-serif" }}>
                          {a.status}
                        </span>
                        <span className="badge badge-neutral" style={{ textTransform:"capitalize", fontSize:9 }}>{a.category}</span>
                        <span className="price-tag" style={{ fontSize:9 }}>${a.price}</span>
                      </div>
                      <h3 style={{ fontFamily:"Outfit,sans-serif", fontSize:13, fontWeight:700, color:"var(--text)", lineHeight:1.3, marginBottom:4, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as any, overflow:"hidden" }}>{a.title}</h3>
                      <div style={{ display:"flex", gap:10, fontSize:10, color:"var(--text-4)" }}>
                        <span style={{ display:"flex", alignItems:"center", gap:2 }}><Users size={9}/>{a.reads} reads</span>
                        <span style={{ display:"flex", alignItems:"center", gap:2 }}><DollarSign size={9} style={{ color:"var(--accent)" }}/>${(a.reads*parseFloat(a.price)*0.85).toFixed(4)}</span>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:5, flexShrink:0 }}>
                      <Link href={`/article/${a.id}`} style={{ width:28,height:28,borderRadius:"var(--r)",border:"1px solid var(--border)",background:"var(--bg-alt)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-3)",textDecoration:"none" }} title="Preview">
                        <Eye size={12}/>
                      </Link>
                      <button onClick={()=>{setEditing(a.id);setEditData({});}} style={{ width:28,height:28,borderRadius:"var(--r)",border:"1px solid var(--border-brand)",background:"var(--brand-muted)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--brand)",cursor:"pointer" }} title="Edit">
                        <Edit3 size={12}/>
                      </button>
                      <button onClick={()=>deleteArticle(a.id)} disabled={deleting===a.id} style={{ width:28,height:28,borderRadius:"var(--r)",border:"1px solid rgba(220,38,38,.3)",background:"rgba(220,38,38,.06)",display:"flex",alignItems:"center",justifyContent:"center",color:"#dc2626",cursor:"pointer",opacity:deleting===a.id?.5:1 }} title="Delete">
                        {deleting===a.id?<div style={{ width:10,height:10,border:"1.5px solid #dc2626",borderTopColor:"transparent",borderRadius:"50%"}} className="spin"/>:<Trash2 size={12}/>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Sidebar: Wallet */}
          <div style={{ display:"flex", flexDirection:"column", gap:12, position:"sticky", top:"calc(var(--header-h) + 12px)" }}>
            <div className="card" style={{ padding:"18px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:12 }}>
                <Zap size={14} style={{ color:"var(--accent)" }}/>
                <h3 style={{ fontFamily:"Outfit,sans-serif", fontSize:13, fontWeight:700, color:"var(--text)" }}>USDC Balance</h3>
              </div>
              <div style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(22px,4vw,30px)", fontWeight:900, color:"var(--accent)", lineHeight:1, marginBottom:4 }}>${usdcBalance}</div>
              <div style={{ fontSize:10, color:"var(--text-4)", marginBottom:14 }}>Your wallet · earnings go here</div>

              {!showSend ? (
                <button onClick={()=>setShowSend(true)} className="btn btn-primary btn-sm" style={{ width:"100%", justifyContent:"center" }}>
                  <Send size={12}/>Send / Withdraw USDC
                </button>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  <input type="text" placeholder="To address (0x…)" value={sendTo} onChange={e=>setSendTo(e.target.value)}
                    style={{ width:"100%",background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",padding:"7px 10px",fontSize:11,color:"var(--text)",fontFamily:"JetBrains Mono,monospace",outline:"none" }}
                    onFocus={e=>(e.target as any).style.borderColor="var(--brand)"} onBlur={e=>(e.target as any).style.borderColor="var(--border)"}
                  />
                  <div style={{ display:"flex", alignItems:"center", gap:5, background:"var(--bg-alt)", border:"1.5px solid var(--border)", borderRadius:"var(--r)", padding:"7px 10px" }}>
                    <span style={{ fontWeight:700, color:"var(--text-4)", fontSize:12 }}>$</span>
                    <input type="number" step="0.01" placeholder="0.00" value={sendAmt} onChange={e=>setSendAmt(e.target.value)}
                      style={{ flex:1,border:"none",outline:"none",background:"transparent",fontSize:15,fontWeight:700,color:"var(--accent)",fontFamily:"Outfit,sans-serif" }}/>
                    <button onClick={()=>setSendAmt(usdcBalance)} style={{ fontSize:9,fontWeight:700,color:"var(--brand)",background:"var(--brand-muted)",border:"1px solid var(--brand-border)",borderRadius:4,padding:"2px 6px",cursor:"pointer" }}>MAX</button>
                  </div>
                  {sendErr  && <div style={{ fontSize:10, color:"#dc2626" }}>{sendErr}</div>}
                  {sendHash && <div style={{ fontSize:10, color:"var(--accent)", fontFamily:"JetBrains Mono,monospace" }}>Sent! {sendHash.slice(0,16)}…</div>}
                  <div style={{ display:"flex", gap:5 }}>
                    <button onClick={()=>{setShowSend(false);setSendErr("");setSendHash("");}} className="btn btn-ghost btn-sm" style={{ flex:1, justifyContent:"center", fontSize:11 }}>Cancel</button>
                    <button onClick={handleSend} disabled={sending||!sendTo||!sendAmt} className="btn btn-primary btn-sm" style={{ flex:2, justifyContent:"center", fontSize:11 }}>
                      {sending?<><div style={{ width:11,height:11,border:"1.5px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%"}} className="spin"/>Sending…</>:<><Send size={11}/>Send</>}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="card" style={{ padding:"14px", fontSize:11, color:"var(--text-4)", lineHeight:1.65 }}>
              <div style={{ fontWeight:700, color:"var(--text-3)", marginBottom:5, fontSize:12 }}>How earnings work</div>
              Readers pay USDC directly to your wallet (85% of article price). Payments settle instantly — no waiting, no minimums.
              <div style={{ marginTop:8, fontSize:10, color:"var(--text-4)" }}>Platform fee: 15% · Updated per-article</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
