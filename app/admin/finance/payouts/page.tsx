
"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Wallet, AlertCircle, ExternalLink, Send, RefreshCw } from "lucide-react";
import { CONTRACT_ADDRESS, USDC_ADDRESS, USDC_ABI, EXPLORER_URL, IS_CONFIGURED, readContract, fetchUsdcBalance } from "../../../../lib/chain";
import { useWallet } from "../../../../lib/wallet";

export default function PayoutsPage() {
  const { address, connected, signer, short } = useWallet();
  const [ownerAddr,   setOwnerAddr]   = useState("");
  const [balance,     setBalance]     = useState("0.00");
  const [loading,     setLoading]     = useState(true);
  const [sendTo,      setSendTo]      = useState("");
  const [sendAmt,     setSendAmt]     = useState("");
  const [sending,     setSending]     = useState(false);
  const [sendHash,    setSendHash]    = useState("");
  const [sendErr,     setSendErr]     = useState("");

  async function load() {
    if (!CONTRACT_ADDRESS) { setLoading(false); return; }
    setLoading(true);
    try {
      const c = readContract();
      const owner = await c.owner();
      setOwnerAddr(owner);
      const bal = await fetchUsdcBalance(owner);
      setBalance(bal);
    } catch {} finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const isOwner = connected && address && ownerAddr && address.toLowerCase()===ownerAddr.toLowerCase();

  async function handleSend() {
    if (!signer || !sendTo || !sendAmt || !USDC_ADDRESS) return;
    setSending(true); setSendErr(""); setSendHash("");
    try {
      if (!ethers.isAddress(sendTo)) throw new Error("Invalid address");
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const dec  = await usdc.decimals();
      const tx   = await usdc.transfer(sendTo, ethers.parseUnits(sendAmt, dec));
      await tx.wait();
      setSendHash(tx.hash);
      await load();
    } catch(e:any) { setSendErr(e.reason||e.message); }
    finally { setSending(false); }
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, maxWidth:560 }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
        <div><h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--text)", letterSpacing:"-0.02em" }}>Payouts</h1><p style={{ color:"var(--text-4)", fontSize:12, marginTop:2 }}>Platform treasury · USDC balance</p></div>
        <button onClick={load} disabled={loading} style={{ width:34,height:34,borderRadius:"50%",border:"1.5px solid var(--border)",background:"var(--bg-alt)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-3)" }}><RefreshCw size={13} className={loading?"spin":""}/></button>
      </div>
      {!connected && <div style={{ padding:"10px 14px", background:"rgba(217,119,6,.06)", border:"1px solid rgba(217,119,6,.18)", borderRadius:"var(--r)", fontSize:12, color:"#d97706", fontWeight:600, display:"flex", gap:8 }}><AlertCircle size={14} style={{ flexShrink:0 }}/>Connect owner wallet to send USDC</div>}
      <div className="card" style={{ padding:"24px", textAlign:"center" }}>
        <div style={{ width:44,height:44,borderRadius:"50%",background:"rgba(5,150,105,.08)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px" }}><Wallet size={20} style={{ color:"#059669" }}/></div>
        {loading ? <div className="skeleton" style={{ height:40,width:140,borderRadius:7,margin:"0 auto 8px" }}/> :
          <div style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(28px,5vw,42px)", fontWeight:900, color:"#059669", lineHeight:1, marginBottom:4 }}>${balance} <span style={{ fontSize:".4em", fontWeight:600, color:"var(--text-4)" }}>USDC</span></div>}
        <div style={{ fontSize:11, color:"var(--text-4)", fontFamily:"JetBrains Mono,monospace", marginBottom:4 }}>{ownerAddr ? `${ownerAddr.slice(0,14)}…${ownerAddr.slice(-4)}` : "—"}</div>
        {ownerAddr && <a href={`${EXPLORER_URL}/address/${ownerAddr}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:"var(--brand)", textDecoration:"none", display:"inline-flex", alignItems:"center", gap:3 }}>View on Arc <ExternalLink size={10}/></a>}
      </div>
      {isOwner && (
        <div className="card" style={{ padding:"20px" }}>
          <h2 style={{ fontSize:14, fontWeight:700, color:"var(--text)", marginBottom:14 }}>Send USDC from Treasury</h2>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div><label style={{ fontSize:11, fontWeight:700, color:"var(--text-4)", textTransform:"uppercase", letterSpacing:".07em", display:"block", marginBottom:5 }}>To Address</label><input type="text" placeholder="0x…" value={sendTo} onChange={e=>setSendTo(e.target.value)} className="input" style={{ fontFamily:"JetBrains Mono,monospace", fontSize:12 }}/></div>
            <div><label style={{ fontSize:11, fontWeight:700, color:"var(--text-4)", textTransform:"uppercase", letterSpacing:".07em", display:"block", marginBottom:5 }}>Amount</label>
            <div style={{ display:"flex", alignItems:"center", gap:7, background:"var(--bg-alt)", border:"1.5px solid var(--border)", borderRadius:"var(--r)", padding:"10px 13px" }}>
              <span style={{ fontWeight:700, color:"var(--text-4)" }}>$</span>
              <input type="number" step="0.01" placeholder="0.00" value={sendAmt} onChange={e=>setSendAmt(e.target.value)} style={{ flex:1, border:"none", outline:"none", background:"transparent", fontSize:20, fontWeight:900, fontFamily:"Outfit,sans-serif", color:"#059669" }}/>
              <button onClick={() => setSendAmt(balance)} style={{ fontSize:10, fontWeight:700, color:"var(--brand)", background:"var(--brand-muted)", border:"1px solid var(--border-brand)", borderRadius:4, padding:"2px 7px", cursor:"pointer" }}>MAX</button>
            </div></div>
            {sendErr && <div style={{ fontSize:11, color:"#dc2626" }}>{sendErr}</div>}
            {sendHash && <a href={`${EXPLORER_URL}/tx/${sendHash}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:"#059669", fontFamily:"JetBrains Mono,monospace", textDecoration:"none" }}>Sent! {sendHash.slice(0,20)}…</a>}
            <button onClick={handleSend} disabled={sending||!sendTo||!sendAmt} className="btn btn-primary" style={{ width:"100%", justifyContent:"center", fontWeight:700 }}>
              {sending ? <><div style={{ width:13,height:13,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%"}} className="spin"/>Sending…</> : <><Send size={13}/>Send USDC</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
