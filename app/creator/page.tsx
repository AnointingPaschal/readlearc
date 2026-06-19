
"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { DollarSign, BookOpen, Users, Wallet, PlusCircle, ExternalLink, RefreshCw, Send, Zap } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "../../components/ui/Navbar";
import SetupBanner from "../../components/ui/SetupBanner";
import ConnectGate from "../../components/ui/ConnectGate";
import { useWallet } from "../../lib/wallet";
import { fetchWriterStats, USDC_ADDRESS, USDC_ABI, EXPLORER_URL, type Article } from "../../lib/chain";

// Re-export ARC_EXPLORER


export default function CreatorPage() {
  const { address, shortAddress, isConnected, usdcBalance, provider, signer, refreshBalance } = useWallet();
  const [articles,  setArticles]  = useState<Article[]>([]);
  const [earned,    setEarned]    = useState(0);
  const [reads,     setReads]     = useState(0);
  const [byArticle, setByArticle] = useState<Map<string,number>>(new Map());
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);

  const [sendTo,   setSendTo]   = useState("");
  const [sendAmt,  setSendAmt]  = useState("");
  const [sending,  setSending]  = useState(false);
  const [sendStep, setSendStep] = useState("");
  const [sendHash, setSendHash] = useState("");
  const [sendErr,  setSendErr]  = useState("");
  const [showSend, setShowSend] = useState(false);

  const load = useCallback(async () => {
    if (!isConnected || !address) return;
    setRefreshing(true);
    const stats = await fetchWriterStats(address, provider||undefined);
    setArticles(stats.articles);
    setEarned(stats.totalEarned);
    setReads(stats.totalReads);
    setByArticle(stats.earningsByArticle);
    setLoading(false); setRefreshing(false);
  }, [isConnected, address, provider]);

  useEffect(() => { if (isConnected) load(); else setLoading(false); }, [load]);

  async function handleSend() {
    if (!signer || !sendTo || !sendAmt || !USDC_ADDRESS) return;
    setSending(true); setSendErr(""); setSendHash("");
    try {
      if (!ethers.isAddress(sendTo)) throw new Error("Invalid address");
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const dec  = await usdc.decimals();
      setSendStep("Confirm in wallet…");
      const tx = await usdc.transfer(sendTo, ethers.parseUnits(sendAmt, dec));
      setSendStep("Confirming…");
      await tx.wait();
      setSendHash(tx.hash); setSendStep("Done!"); setSendTo(""); setSendAmt("");
      await refreshBalance();
      setTimeout(() => { setShowSend(false); setSendStep(""); setSendHash(""); }, 5000);
    } catch (e: any) { setSendErr(e.reason||e.message); }
    finally { setSending(false); }
  }

  if (!isConnected) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <SetupBanner /><Navbar />
      <ConnectGate title="Creator Studio" body="Connect your wallet to view your on-chain earnings, article analytics, and manage your USDC." icon={Zap} />
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <SetupBanner /><Navbar />
      <style>{`.c-kpi{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:18px}@media(min-width:768px){.c-kpi{grid-template-columns:repeat(4,1fr)!important}}.c-row{display:grid;grid-template-columns:1fr;gap:14px;margin-bottom:18px}@media(min-width:860px){.c-row{grid-template-columns:1fr 256px!important}}.at{display:none}.ac{display:block}@media(min-width:580px){.at{display:block!important}.ac{display:none!important}}`}</style>
      <div style={{ maxWidth:1200, margin:"0 auto", padding:"76px 14px 60px" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24, flexWrap:"wrap", gap:12 }}>
          <div>
            <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(20px,4vw,28px)", fontWeight:900, color:"var(--text)", letterSpacing:"-0.02em", marginBottom:4 }}>Creator Studio</h1>
            <p style={{ color:"var(--text-4)", fontSize:12, display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ width:6,height:6,borderRadius:"50%",background:"#059669",display:"inline-block" }}/>{shortAddress} · Arc Testnet
            </p>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <button onClick={load} disabled={refreshing} style={{ width:34,height:34,borderRadius:"50%",border:"1.5px solid var(--border)",background:"var(--bg-alt)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-3)" }}>
              <RefreshCw size={14} className={refreshing?"spin":""}/>
            </button>
            <Link href={`/profile/${address}`} className="btn btn-ghost btn-sm">My Profile</Link>
            <Link href="/write" className="btn btn-primary btn-sm" style={{ fontWeight:700 }}><PlusCircle size={13} strokeWidth={2.5}/>New Article</Link>
          </div>
        </div>

        <div className="c-kpi">
          {[
            { label:"Total Earned",   value:`$${earned.toFixed(4)}`, sub:"writer share 85%",    color:"#059669",    bg:"rgba(5,150,105,.08)"   },
            { label:"USDC Balance",   value:`$${usdcBalance}`,       sub:"in your wallet",      color:"var(--brand)",bg:"var(--brand-muted)"     },
            { label:"Total Reads",    value:reads.toLocaleString(),  sub:"across all articles", color:"#0284c7",    bg:"rgba(2,132,199,.08)"    },
            { label:"Articles",       value:articles.length.toString(),sub:"on-chain",          color:"#d97706",    bg:"rgba(217,119,6,.08)"    },
          ].map(k => (
            <div key={k.label} className="card" style={{ padding:"16px" }}>
              {loading ? <div className="skeleton" style={{ height:28, borderRadius:6, marginBottom:6 }}/> :
                <div style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(18px,3.5vw,22px)", fontWeight:900, color:k.color, lineHeight:1 }}>{k.value}</div>}
              <div style={{ fontSize:11, color:"var(--text-3)", fontWeight:600, marginTop:4 }}>{k.label}</div>
              <div style={{ fontSize:10, color:"var(--text-4)", marginTop:1 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        <div className="c-row">
          {/* Earnings chart placeholder */}
          <div className="card" style={{ padding:"20px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:8 }}>
              <div>
                <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:14, fontWeight:700, color:"var(--text)" }}>Earnings from Chain</h2>
                <p style={{ fontSize:11, color:"var(--text-4)", marginTop:1 }}>From ArticleRead events · 85% writer share</p>
              </div>
              <span style={{ fontSize:12, fontWeight:700, color:"#059669" }}>${earned.toFixed(4)} total</span>
            </div>
            {loading ? <div className="skeleton" style={{ height:80, borderRadius:8 }}/> :
              earned === 0 ? <div style={{ height:80, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-4)", fontSize:13 }}>No earnings yet — publish and share your articles!</div> :
              <div style={{ display:"flex", alignItems:"flex-end", gap:4, height:80 }}>
                {articles.slice(0,10).map((a,i) => {
                  const e = byArticle.get(a.id)||0;
                  const maxE = Math.max(...articles.map(x=>byArticle.get(x.id)||0),.001);
                  return <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                    <div title={a.title.slice(0,30)} style={{ width:"100%", borderRadius:"3px 3px 0 0", background:"linear-gradient(to top,var(--brand),var(--brand-light))", opacity:.8, height:`${Math.max((e/maxE)*100,e>0?6:2)}%`, minHeight:2, cursor:"default" }}/>
                    <span style={{ fontSize:8, color:"var(--text-4)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", width:"100%", textAlign:"center" }}>{a.id}</span>
                  </div>;
                })}
              </div>
            }
          </div>

          {/* Wallet */}
          <div className="card" style={{ padding:"20px", display:"flex", flexDirection:"column" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
              <div style={{ width:28,height:28,borderRadius:8,background:"rgba(5,150,105,.08)",display:"flex",alignItems:"center",justifyContent:"center" }}><Wallet size={13} style={{ color:"#059669" }}/></div>
              <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:13, fontWeight:700, color:"var(--text)" }}>USDC Balance</h2>
            </div>
            <div style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(24px,4vw,32px)", fontWeight:900, color:"#059669", letterSpacing:"-0.03em", lineHeight:1 }}>${usdcBalance}</div>
            <div style={{ fontSize:11, color:"var(--text-4)", margin:"4px 0 12px" }}>Available in wallet · earnings go here directly</div>
            {!showSend ? (
              <button onClick={() => setShowSend(true)} className="btn btn-primary btn-sm" style={{ width:"100%", justifyContent:"center" }}><Send size={12}/>Send / Withdraw USDC</button>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                <input type="text" placeholder="To address (0x…)" value={sendTo} onChange={e => setSendTo(e.target.value)} style={{ width:"100%", background:"var(--bg-alt)", border:"1.5px solid var(--border)", borderRadius:"var(--r2)", padding:"7px 10px", outline:"none", fontSize:11, color:"var(--text)", fontFamily:"JetBrains Mono,monospace" }}/>
                <div style={{ display:"flex", gap:5, alignItems:"center", background:"var(--bg-alt)", border:"1.5px solid var(--border)", borderRadius:"var(--r2)", padding:"7px 10px" }}>
                  <span style={{ fontWeight:700, color:"var(--text-4)", fontSize:12 }}>$</span>
                  <input type="number" step="0.01" placeholder="Amount" value={sendAmt} onChange={e => setSendAmt(e.target.value)} style={{ flex:1, border:"none", outline:"none", background:"transparent", fontSize:15, fontWeight:700, color:"var(--brand)", fontFamily:"Outfit,sans-serif" }}/>
                  <button onClick={() => setSendAmt(usdcBalance)} style={{ fontSize:10, fontWeight:700, color:"var(--brand)", background:"var(--brand-muted)", border:"1px solid var(--border-brand)", borderRadius:4, padding:"2px 6px", cursor:"pointer" }}>MAX</button>
                </div>
                {sendErr && <div style={{ fontSize:11, color:"#dc2626" }}>{sendErr}</div>}
                {sendHash && <a href={`${EXPLORER_URL}/tx/${sendHash}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:10, color:"#059669", fontFamily:"JetBrains Mono,monospace", textDecoration:"none" }}>✓ Sent! {sendHash.slice(0,14)}…</a>}
                <div style={{ display:"flex", gap:5 }}>
                  <button onClick={() => { setShowSend(false); setSendErr(""); }} className="btn btn-ghost btn-sm" style={{ flex:1, justifyContent:"center", fontSize:11 }}>Cancel</button>
                  <button onClick={handleSend} disabled={sending||!sendTo||!sendAmt} className="btn btn-primary btn-sm" style={{ flex:2, justifyContent:"center", fontSize:11 }}>
                    {sending ? <><div style={{ width:11,height:11,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%"}} className="spin"/>{sendStep}</> : <><Send size={11}/>Send</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Articles */}
        <div className="card" style={{ overflow:"hidden", padding:0 }}>
          <div style={{ padding:"14px 18px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:14, fontWeight:700, color:"var(--text)" }}>Your Articles</h2>
            <Link href="/write" style={{ fontSize:12, fontWeight:600, color:"var(--brand)", textDecoration:"none" }}>+ New article</Link>
          </div>
          {loading ? <div style={{ padding:14 }}>{[1,2,3].map(i=><div key={i} className="skeleton" style={{ height:40,borderRadius:7,marginBottom:8 }}/>)}</div>
          : articles.length === 0 ? (
            <div style={{ padding:"40px 20px", textAlign:"center" }}>
              <BookOpen size={28} style={{ color:"var(--text-4)", marginBottom:10 }}/>
              <p style={{ fontSize:14, fontWeight:600, color:"var(--text-3)", marginBottom:4 }}>No articles yet</p>
              <Link href="/write" className="btn btn-primary btn-sm" style={{ marginTop:10 }}>Write First Article</Link>
            </div>
          ) : (<>
            <div className="at" style={{ overflowX:"auto" }}>
              <table className="admin-table">
                <thead><tr><th style={{ textAlign:"left" }}>Article</th><th style={{ textAlign:"right" }}>Reads</th><th style={{ textAlign:"right" }}>Earned</th><th style={{ textAlign:"right" }}>Price</th><th/></tr></thead>
                <tbody>
                  {articles.map((a,i) => {
                    const e = byArticle.get(a.id)||(a.reads*parseFloat(a.price)*.85);
                    return <tr key={a.id}>
                      <td style={{ maxWidth:280 }}><div style={{ fontSize:13, fontWeight:600, color:"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.title}</div><span className="badge badge-neutral" style={{ marginTop:3, fontSize:9 }}>{a.category}</span></td>
                      <td style={{ textAlign:"right" }}>{a.reads.toLocaleString()}</td>
                      <td style={{ textAlign:"right", fontWeight:700, color:"#059669" }}>${e.toFixed(4)}</td>
                      <td style={{ textAlign:"right", fontFamily:"JetBrains Mono,monospace", fontSize:11 }}>${a.price}</td>
                      <td style={{ textAlign:"right" }}><Link href={`/article/${a.id}`} style={{ display:"inline-flex", alignItems:"center", gap:3, fontSize:11, color:"var(--brand)", textDecoration:"none", fontWeight:600 }}>View <ExternalLink size={10}/></Link></td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
            <div className="ac">
              {articles.map((a,i) => {
                const e = byArticle.get(a.id)||(a.reads*parseFloat(a.price)*.85);
                return <div key={a.id} style={{ padding:"12px 14px", borderBottom:i<articles.length-1?"1px solid var(--border)":"none" }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"var(--text)", marginBottom:6, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{a.title}</div>
                  <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"center", fontSize:11 }}>
                    <div><div style={{ color:"var(--text-4)", fontSize:9, fontWeight:700, textTransform:"uppercase" }}>Earned</div><div style={{ fontWeight:800, color:"#059669", fontSize:14 }}>${e.toFixed(4)}</div></div>
                    <div><div style={{ color:"var(--text-4)", fontSize:9, fontWeight:700, textTransform:"uppercase" }}>Reads</div><div style={{ color:"var(--text-2)" }}>{a.reads}</div></div>
                    <Link href={`/article/${a.id}`} style={{ marginLeft:"auto", color:"var(--brand)", textDecoration:"none", fontWeight:700, display:"flex", alignItems:"center", gap:3 }}>View <ExternalLink size={10}/></Link>
                  </div>
                </div>;
              })}
            </div>
          </>)}
        </div>
        <div style={{ marginTop:14, textAlign:"center", fontSize:10, color:"var(--text-4)", fontFamily:"JetBrains Mono,monospace" }}>
          <Zap size={9} style={{ display:"inline", marginRight:4 }}/>Earnings settled atomically via Readlearc.sol · 85% writer share per read
        </div>
      </div>
    </div>
  );
}
