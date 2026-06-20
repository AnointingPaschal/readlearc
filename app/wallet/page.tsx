
"use client";
import { useWallet } from "../../lib/wallet";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { Copy, Check, ExternalLink, Zap, ArrowDownLeft, ArrowUpRight, Send, RefreshCw, Info, X } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "../../components/ui/Navbar";
import SetupBanner from "../../components/ui/SetupBanner";
import ConnectGate from "../../components/ui/ConnectGate";
import { fetchWalletHistory, USDC_ADDRESS, USDC_ABI, EXPLORER_URL } from "../../lib/chain";

export default function WalletPage() {
  const { address, signer, connected, balance, refresh, provider } = useWallet();
  const short = address ? `${address.slice(0,6)}…${address.slice(-4)}` : "";
  const [copied,    setCopied]    = useState(false);
  const [txHistory, setTxHistory] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [sendOpen,  setSendOpen]  = useState(false);
  const [sendTo,    setSendTo]    = useState("");
  const [sendAmt,   setSendAmt]   = useState("");
  const [sending,   setSending]   = useState(false);
  const [sendStep,  setSendStep]  = useState("");
  const [sendErr,   setSendErr]   = useState("");
  const [sendHash,  setSendHash]  = useState("");

  const loadHistory = useCallback(async () => {
    if (!connected || !address) return;
    setRefreshing(true);
    const hist = await fetchWalletHistory(address, provider||undefined);
    setTxHistory(hist); setLoading(false); setRefreshing(false);
  }, [connected, address, provider]);

  useEffect(() => { if (connected) loadHistory(); else setLoading(false); }, [loadHistory]);

  function copy() { navigator.clipboard.writeText(address); setCopied(true); setTimeout(()=>setCopied(false),2000); }

  async function handleSend() {
    if (!signer || !sendTo || !sendAmt || !USDC_ADDRESS) return;
    setSending(true); setSendErr(""); setSendHash("");
    try {
      if (!ethers.isAddress(sendTo)) throw new Error("Invalid address");
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const dec  = await usdc.decimals();
      setSendStep("Confirm in wallet…");
      const tx = await usdc.transfer(sendTo, ethers.parseUnits(sendAmt, dec));
      setSendStep("Confirming on Arc…");
      await tx.wait();
      setSendHash(tx.hash); setSendStep("Sent!");
      setSendTo(""); setSendAmt("");
      await refresh(); loadHistory();
    } catch(e: any) { setSendErr(e.reason||e.message); }
    finally { setSending(false); }
  }

  if (!connected) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <SetupBanner/><Navbar/>
      <ConnectGate title="My Wallet" body="Connect your MetaMask or EIP-1193 wallet to view your USDC balance and transaction history."/>
    </div>
  );

  const inflows  = txHistory.filter(t=>t.type==="earn").reduce((s,t)=>s+t.amount,0);
  const outflows = txHistory.filter(t=>t.type==="read").reduce((s,t)=>s+Math.abs(t.amount),0);

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <SetupBanner/><Navbar/>
      {sendOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16, background:"rgba(0,0,0,.5)", backdropFilter:"blur(4px)" }}>
          <motion.div initial={{ opacity:0,scale:.95 }} animate={{ opacity:1,scale:1 }} className="card" style={{ width:"100%", maxWidth:400, padding:"24px 20px" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
              <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:17, fontWeight:800, color:"var(--text)" }}>Send USDC</h2>
              <button onClick={() => { setSendOpen(false); setSendErr(""); setSendStep(""); setSendHash(""); }} style={{ width:28,height:28,borderRadius:"50%",border:"1px solid var(--border)",background:"var(--bg-alt)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-3)" }}><X size={13}/></button>
            </div>
            {sendHash ? (
              <div style={{ textAlign:"center", padding:"8px 0" }}>
                <Zap size={32} style={{ color:"#059669", marginBottom:10 }}/>
                <p style={{ fontSize:14, fontWeight:700, color:"var(--text)", marginBottom:8 }}>USDC Sent!</p>
                <a href={`${EXPLORER_URL}/tx/${sendHash}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:10, color:"var(--brand)", fontFamily:"JetBrains Mono,monospace", textDecoration:"none" }}>{sendHash.slice(0,20)}…</a>
                <div style={{ marginTop:14 }}><button onClick={() => { setSendOpen(false); setSendHash(""); }} className="btn btn-primary btn-sm">Done</button></div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:"var(--text-4)", textTransform:"uppercase", letterSpacing:".07em", display:"block", marginBottom:5 }}>To</label>
                  <input type="text" placeholder="0x…" value={sendTo} onChange={e=>setSendTo(e.target.value)} className="input" style={{ fontFamily:"JetBrains Mono,monospace", fontSize:12 }}/>
                </div>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:"var(--text-4)", textTransform:"uppercase", letterSpacing:".07em", display:"block", marginBottom:5 }}>Amount (USDC)</label>
                  <div style={{ display:"flex", alignItems:"center", gap:7, background:"var(--bg-alt)", border:"1.5px solid var(--border)", borderRadius:"var(--r)", padding:"10px 13px" }}>
                    <span style={{ fontWeight:700, color:"var(--text-4)" }}>$</span>
                    <input type="number" step="0.01" placeholder="0.00" value={sendAmt} onChange={e=>setSendAmt(e.target.value)} style={{ flex:1, border:"none", outline:"none", background:"transparent", fontSize:20, fontWeight:900, fontFamily:"Outfit,sans-serif", color:"#059669" }}/>
                    <button onClick={() => setSendAmt(balance)} style={{ fontSize:10, fontWeight:700, color:"var(--brand)", background:"var(--brand-muted)", border:"1px solid var(--border-brand)", borderRadius:4, padding:"2px 7px", cursor:"pointer" }}>MAX</button>
                  </div>
                  <div style={{ fontSize:10, color:"var(--text-4)", marginTop:3 }}>Available: ${balance} USDC</div>
                </div>
                {sendErr && <div style={{ fontSize:11, color:"#dc2626" }}>{sendErr}</div>}
                <button onClick={handleSend} disabled={sending||!sendTo||!sendAmt} className="btn btn-primary" style={{ width:"100%", justifyContent:"center", fontWeight:700 }}>
                  {sending ? <><div style={{ width:13,height:13,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%"}} className="spin"/>{sendStep}</> : <><Send size={14}/>Send {sendAmt?`$${sendAmt}`:""} USDC</>}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      <div style={{ maxWidth:640, margin:"0 auto", padding:"76px 16px 60px" }}>
        <motion.h1 initial={{ opacity:0,y:14 }} animate={{ opacity:1,y:0 }} style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(20px,4vw,28px)", fontWeight:900, color:"var(--text)", letterSpacing:"-0.02em", marginBottom:22 }}>My Wallet</motion.h1>

        {/* Balance card */}
        <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:.05 }}
          style={{ borderRadius:20, padding:"clamp(24px,4vw,36px)", marginBottom:14, position:"relative", overflow:"hidden", background:"linear-gradient(135deg,var(--brand),var(--accent))", boxShadow:"0 12px 40px rgba(109,40,217,.3)" }}
        >
          <div style={{ position:"absolute", top:-60,right:-60, width:200,height:200, borderRadius:"50%", background:"rgba(255,255,255,.06)", pointerEvents:"none" }}/>
          <div style={{ position:"relative" }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,.65)", fontWeight:600, textTransform:"uppercase", letterSpacing:".06em", marginBottom:5 }}>Circle USDC · Arc Testnet</div>
            <div style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(36px,7vw,54px)", fontWeight:900, color:"white", lineHeight:1, marginBottom:4, letterSpacing:"-0.03em" }}>
              ${balance} <span style={{ fontSize:".42em", fontWeight:600, opacity:.75 }}>USDC</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:14, flexWrap:"wrap" }}>
              <span style={{ fontFamily:"JetBrains Mono,monospace", fontSize:11, color:"rgba(255,255,255,.6)" }}>{address.slice(0,14)}…{address.slice(-6)}</span>
              <button onClick={copy} style={{ background:"rgba(255,255,255,.15)", border:"none", borderRadius:6, padding:"4px 8px", cursor:"pointer", display:"flex", alignItems:"center", gap:3, color:"white", fontSize:11 }}>
                {copied ? <><Check size={11}/>Copied</> : <><Copy size={11}/>Copy</>}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ delay:.1 }} style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
          <div className="card" style={{ padding:"14px" }}>
            <div style={{ fontSize:9, color:"var(--text-4)", fontWeight:700, textTransform:"uppercase", marginBottom:4 }}>Earned (writer)</div>
            <div style={{ fontFamily:"Outfit,sans-serif", fontSize:20, fontWeight:900, color:"#059669" }}>${inflows.toFixed(4)}</div>
          </div>
          <div className="card" style={{ padding:"14px" }}>
            <div style={{ fontSize:9, color:"var(--text-4)", fontWeight:700, textTransform:"uppercase", marginBottom:4 }}>Spent (reader)</div>
            <div style={{ fontFamily:"Outfit,sans-serif", fontSize:20, fontWeight:900, color:"var(--text-2)" }}>${outflows.toFixed(4)}</div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ delay:.12 }} style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
          <button onClick={() => setSendOpen(true)} className="card" style={{ padding:"16px", textAlign:"center", cursor:"pointer", border:"none", background:"var(--bg-card)", display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
            <div style={{ width:38,height:38,borderRadius:"50%",background:"var(--brand-muted)",display:"flex",alignItems:"center",justifyContent:"center" }}><ArrowUpRight size={17} style={{ color:"var(--brand)" }}/></div>
            <div style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>Send USDC</div>
            <div style={{ fontSize:11, color:"var(--text-4)" }}>Transfer to any address</div>
          </button>
          <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" className="card" style={{ padding:"16px", textAlign:"center", cursor:"pointer", textDecoration:"none", display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
            <div style={{ width:38,height:38,borderRadius:"50%",background:"rgba(5,150,105,.08)",display:"flex",alignItems:"center",justifyContent:"center" }}><ArrowDownLeft size={17} style={{ color:"#059669" }}/></div>
            <div style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>Get Test USDC</div>
            <div style={{ fontSize:11, color:"var(--text-4)" }}>Circle Faucet ↗</div>
          </a>
        </motion.div>

        {/* Info */}
        <div style={{ padding:"12px 14px", background:"var(--bg-alt)", border:"1px solid var(--border)", borderRadius:"var(--r)", marginBottom:16, display:"flex", gap:8 }}>
          <Info size={13} style={{ color:"var(--brand)", flexShrink:0, marginTop:1 }}/>
          <div style={{ fontSize:12, color:"var(--text-3)", lineHeight:1.6 }}>
            USDC address on Arc Testnet: <code style={{ fontFamily:"JetBrains Mono,monospace", fontSize:11 }}>0x3600000000000000000000000000000000000000</code>. Gas fees on Arc are paid in USDC.
          </div>
        </div>

        {/* TX History */}
        <motion.div initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ delay:.14 }} className="card" style={{ padding:"18px", overflow:"hidden" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:15, fontWeight:700, color:"var(--text)" }}>Transaction History</h2>
            <button onClick={() => { setRefreshing(true); setLoading(true); loadHistory(); }} disabled={refreshing} style={{ width:30,height:30,borderRadius:"50%",border:"1px solid var(--border)",background:"var(--bg-alt)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-3)" }}>
              <RefreshCw size={12} className={refreshing?"spin":""}/>
            </button>
          </div>
          {loading ? <div>{[1,2,3].map(i=><div key={i} className="skeleton" style={{ height:54,borderRadius:9,marginBottom:9 }}/>)}</div>
          : txHistory.length === 0 ? (
            <div style={{ textAlign:"center", padding:"28px 0" }}>
              <Zap size={26} style={{ color:"var(--text-4)", marginBottom:8 }}/>
              <p style={{ color:"var(--text-3)", fontSize:13, fontWeight:600 }}>No transactions yet</p>
              <p style={{ color:"var(--text-4)", fontSize:11, marginTop:3 }}>Read or publish articles to see activity here.</p>
            </div>
          ) : txHistory.map((tx,i) => (
            <div key={tx.hash+i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 0", borderBottom:i<txHistory.length-1?"1px solid var(--border)":"none" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:34,height:34,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center", background:tx.amount>0?"rgba(5,150,105,.08)":"var(--brand-muted)" }}>
                  {tx.amount>0 ? <ArrowDownLeft size={14} style={{ color:"#059669" }}/> : <ArrowUpRight size={14} style={{ color:"var(--brand)" }}/>}
                </div>
                <div>
                  <p style={{ fontSize:13, fontWeight:600, color:"var(--text)", marginBottom:2 }}>{tx.label}</p>
                  <a href={`${EXPLORER_URL}/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:10, color:"var(--brand)", fontFamily:"JetBrains Mono,monospace", textDecoration:"none", display:"flex", alignItems:"center", gap:3 }}>
                    {tx.hash?.slice(0,14)}… <ExternalLink size={9}/>
                  </a>
                </div>
              </div>
              <span style={{ fontFamily:"Outfit,sans-serif", fontSize:13, fontWeight:800, color:tx.amount>0?"#059669":"var(--text-2)" }}>
                {tx.amount>0?"+":""}{tx.amount.toFixed(4)} <span style={{ fontSize:10, fontWeight:500, color:"var(--text-4)" }}>USDC</span>
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
