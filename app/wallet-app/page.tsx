"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Send, Download, Eye, EyeOff, Copy, Check, Settings, Plus, ChevronDown, RefreshCw, ArrowUpRight, ArrowDownLeft, ExternalLink, QrCode, Wallet, LogOut, X } from "lucide-react";
import QRCode from "qrcode";
import { loadWallets, getActiveIndex, setActiveIndex, getUsdcBalance, sendUsdc, StoredWallet, ARC_RPC, USDC_ADDR } from "../../lib/internal-wallet";
import { ethers } from "ethers";

type Modal = null|"send"|"receive"|"settings"|"wallets";

export default function WalletApp() {
  const router = useRouter();
  const [wallets,    setWallets]    = useState<StoredWallet[]>([]);
  const [activeIdx,  setActiveIdx_] = useState(0);
  const [balance,    setBalance]    = useState("0.0000");
  const [hideBalance,setHideBalance]= useState(false);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal,      setModal]      = useState<Modal>(null);
  const [txHistory,  setTxHistory]  = useState<any[]>([]);
  const [copied,     setCopied]     = useState(false);
  const [qrDataUrl,  setQrDataUrl]  = useState("");
  const [sendTo,     setSendTo]     = useState("");
  const [sendAmt,    setSendAmt]    = useState("");
  const [sendPw,     setSendPw]     = useState("");
  const [sending,    setSending]    = useState(false);
  const [sendHash,   setSendHash]   = useState("");
  const [sendError,  setSendError]  = useState("");

  const active = wallets[activeIdx] || null;

  const loadBalance = useCallback(async (addr: string) => {
    const bal = await getUsdcBalance(addr);
    setBalance(bal);
  }, []);

  useEffect(() => {
    const ws = loadWallets();
    if (!ws.length) { setLoading(false); return; }
    const idx = getActiveIndex();
    setWallets(ws);
    setActiveIdx_(Math.min(idx, ws.length-1));
    setLoading(false);
    if (ws[idx]) loadBalance(ws[idx].address);
  }, [loadBalance]);

  useEffect(() => {
    if (!active) return;
    QRCode.toDataURL(active.address, { width:200, margin:2 }).then(setQrDataUrl).catch(()=>{});
  }, [active?.address]);

  function copyAddress() {
    if (!active) return;
    navigator.clipboard.writeText(active.address);
    setCopied(true); setTimeout(()=>setCopied(false),2000);
  }

  async function refresh() {
    if (!active) return;
    setRefreshing(true);
    await loadBalance(active.address);
    setRefreshing(false);
  }

  async function doSend() {
    if (!active || !sendTo || !sendAmt || !sendPw) return;
    setSending(true); setSendError(""); setSendHash("");
    try {
      if (!ethers.isAddress(sendTo)) throw new Error("Invalid recipient address");
      const { hash } = await sendUsdc(active.encryptedKey, sendPw, sendTo, sendAmt);
      setSendHash(hash);
      setSendTo(""); setSendAmt(""); setSendPw("");
      await loadBalance(active.address);
    } catch(e:any) {
      const msg = e.message || "";
      if (msg.includes("invalid password") || msg.includes("decrypt")) setSendError("Wrong password");
      else setSendError(msg.slice(0,120));
    }
    setSending(false);
  }

  function switchWallet(idx: number) {
    setActiveIdx_(idx);
    setActiveIndex(idx);
    setModal(null);
    if (wallets[idx]) loadBalance(wallets[idx].address);
  }

  if (loading) return (
    <div style={{ minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:14 }}>
      <div style={{ width:40,height:40,border:"3px solid var(--border)",borderTopColor:"var(--brand)",borderRadius:"50%" }} className="spin"/>
      <p style={{ color:"var(--text-3)",fontSize:14 }}>Loading wallet…</p>
    </div>
  );

  // No wallet: onboarding
  if (!wallets.length) return (
    <div style={{ minHeight:"100vh",background:"var(--bg)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24 }}>
      <div style={{ textAlign:"center",maxWidth:360 }}>
        <div style={{ width:80,height:80,borderRadius:28,background:"linear-gradient(135deg,var(--brand),var(--accent))",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px" }}>
          <Wallet size={36} color="white"/>
        </div>
        <h1 style={{ fontFamily:"Outfit,sans-serif",fontSize:28,fontWeight:900,color:"var(--text)",marginBottom:8,letterSpacing:"-.02em" }}>Readlearc Wallet</h1>
        <p style={{ fontSize:14,color:"var(--text-4)",lineHeight:1.7,marginBottom:32 }}>A self-custodial USDC wallet for Arc Testnet. Your keys, your crypto.</p>
        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          <Link href="/wallet-app/create" className="btn btn-primary" style={{ height:52,justifyContent:"center",fontWeight:700,fontSize:15 }}>
            <Plus size={16}/>Create New Wallet
          </Link>
          <Link href="/wallet-app/import" className="btn btn-secondary" style={{ height:52,justifyContent:"center",fontWeight:700,fontSize:15 }}>
            Import Existing Wallet
          </Link>
        </div>
        <p style={{ fontSize:11,color:"var(--text-4)",marginTop:20,lineHeight:1.65 }}>Your wallet is stored encrypted on this device only. We never have access to your keys.</p>
      </div>
    </div>
  );

  const short = active ? active.address.slice(0,6)+"…"+active.address.slice(-4) : "";

  return (
    <div style={{ minHeight:"100vh",background:"var(--bg)",display:"flex",flexDirection:"column" }}>
      {/* Header */}
      <div style={{ background:"linear-gradient(160deg,var(--brand),var(--brand-d))",padding:"50px 20px 28px" }}>
        {/* Top bar */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24 }}>
          <button onClick={()=>setModal("wallets")} style={{ display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.25)",borderRadius:"var(--r-f)",padding:"6px 12px 6px 8px",cursor:"pointer" }}>
            <div style={{ width:24,height:24,borderRadius:"50%",background:"rgba(255,255,255,.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:"white" }}>
              {(active?.name||"W")[0]}
            </div>
            <span style={{ fontSize:13,fontWeight:700,color:"white",maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{active?.name}</span>
            <ChevronDown size={13} style={{ color:"rgba(255,255,255,.7)" }}/>
          </button>
          <div style={{ display:"flex",gap:8 }}>
            <button onClick={refresh} style={{ width:34,height:34,borderRadius:"50%",background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.2)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"white" }}>
              <RefreshCw size={14} className={refreshing?"spin":""}/>
            </button>
            <Link href="/wallet-app/settings" style={{ width:34,height:34,borderRadius:"50%",background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",textDecoration:"none" }}>
              <Settings size={14}/>
            </Link>
          </div>
        </div>

        {/* Address */}
        <button onClick={copyAddress} style={{ display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",borderRadius:"var(--r-f)",padding:"5px 12px",cursor:"pointer",marginBottom:20 }}>
          <span style={{ fontFamily:"JetBrains Mono,monospace",fontSize:12,color:"rgba(255,255,255,.85)" }}>{short}</span>
          {copied?<Check size={12} style={{ color:"#86efac" }}/>:<Copy size={12} style={{ color:"rgba(255,255,255,.6)" }}/>}
        </button>

        {/* Balance */}
        <div style={{ marginBottom:28 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:4 }}>
            <span style={{ fontSize:13,color:"rgba(255,255,255,.7)",fontWeight:500 }}>USDC Balance</span>
            <button onClick={()=>setHideBalance(v=>!v)} style={{ background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,.5)",display:"flex" }}>
              {hideBalance?<Eye size={13}/>:<EyeOff size={13}/>}
            </button>
          </div>
          <div style={{ fontFamily:"Outfit,sans-serif",fontSize:"clamp(36px,8vw,52px)",fontWeight:900,color:"white",letterSpacing:"-0.03em",lineHeight:1 }}>
            {hideBalance?"••••••":("$" + balance)}
          </div>
          <div style={{ fontSize:12,color:"rgba(255,255,255,.6)",marginTop:4 }}>Arc Testnet · USDC</div>
        </div>

        {/* Action buttons */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
          <button onClick={()=>setModal("send")} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:7,padding:"14px 10px",background:"rgba(255,255,255,.15)",border:"1.5px solid rgba(255,255,255,.25)",borderRadius:"var(--r-lg)",cursor:"pointer",transition:"all .15s" }}
            onMouseEnter={e=>(e.currentTarget as any).style.background="rgba(255,255,255,.22)"}
            onMouseLeave={e=>(e.currentTarget as any).style.background="rgba(255,255,255,.15)"}>
            <div style={{ width:38,height:38,borderRadius:"50%",background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center" }}><Send size={17} color="white"/></div>
            <span style={{ fontSize:13,fontWeight:700,color:"white" }}>Send</span>
          </button>
          <button onClick={()=>setModal("receive")} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:7,padding:"14px 10px",background:"rgba(255,255,255,.15)",border:"1.5px solid rgba(255,255,255,.25)",borderRadius:"var(--r-lg)",cursor:"pointer",transition:"all .15s" }}
            onMouseEnter={e=>(e.currentTarget as any).style.background="rgba(255,255,255,.22)"}
            onMouseLeave={e=>(e.currentTarget as any).style.background="rgba(255,255,255,.15)"}>
            <div style={{ width:38,height:38,borderRadius:"50%",background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center" }}><Download size={17} color="white"/></div>
            <span style={{ fontSize:13,fontWeight:700,color:"white" }}>Receive</span>
          </button>
        </div>
      </div>

      {/* Tokens section */}
      <div style={{ flex:1,padding:"20px 16px" }}>
        <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:700,color:"var(--text)",marginBottom:12,letterSpacing:"-.01em" }}>Assets</h3>
        <div className="card" style={{ padding:"14px 16px",display:"flex",alignItems:"center",gap:14 }}>
          <div style={{ width:44,height:44,borderRadius:"50%",background:"#2775ca",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
            <span style={{ fontWeight:900,fontSize:16,color:"white" }}>$</span>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:700,color:"var(--text)" }}>USD Coin</div>
            <div style={{ fontSize:12,color:"var(--text-4)",marginTop:1 }}>USDC · Arc Testnet</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:"Outfit,sans-serif",fontSize:16,fontWeight:800,color:"var(--text)" }}>${hideBalance?"••••":balance}</div>
            <div style={{ fontSize:11,color:"var(--text-4)",marginTop:1 }}>≈ ${balance} USD</div>
          </div>
        </div>

        <div style={{ marginTop:20, display:"flex", gap:10 }}>
          <Link href="/" className="btn btn-secondary btn-sm" style={{ flex:1, justifyContent:"center" }}>Readlearc Home</Link>
          <Link href="/explore" className="btn btn-primary btn-sm" style={{ flex:2, justifyContent:"center" }}>Browse Articles</Link>
        </div>
      </div>

      {/* ── MODALS ── */}

      {/* Send modal */}
      {modal==="send" && (
        <div style={{ position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center" }} onClick={e=>{if(e.target===e.currentTarget)setModal(null);}}>
          <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,.5)",backdropFilter:"blur(4px)" }}/>
          <div style={{ position:"relative",width:"100%",maxWidth:480,background:"var(--bg-card)",borderRadius:"var(--r-xl) var(--r-xl) 0 0",padding:"24px 20px",paddingBottom:36 }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20 }}>
              <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:18,fontWeight:900,color:"var(--text)" }}>Send USDC</h3>
              <button onClick={()=>{setModal(null);setSendError("");setSendHash("");}} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text-4)" }}><X size={18}/></button>
            </div>
            {sendHash ? (
              <div style={{ textAlign:"center",padding:"24px 0" }}>
                <div style={{ fontSize:40,marginBottom:12 }}>✓</div>
                <p style={{ fontFamily:"Outfit,sans-serif",fontSize:18,fontWeight:800,color:"var(--accent)",marginBottom:8 }}>Sent!</p>
                <a href={"https://testnet.arcscan.app/tx/"+sendHash} target="_blank" rel="noopener noreferrer" style={{ fontSize:11,color:"var(--brand)",fontFamily:"JetBrains Mono,monospace",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:3 }}>
                  {sendHash.slice(0,20)}… <ExternalLink size={10}/>
                </a>
                <br/>
                <button onClick={()=>{setSendHash("");setModal(null);}} className="btn btn-primary" style={{ marginTop:16,justifyContent:"center" }}>Done</button>
              </div>
            ) : (<>
              <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                <div>
                  <label style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5,fontFamily:"Outfit,sans-serif" }}>To Address</label>
                  <input value={sendTo} onChange={e=>setSendTo(e.target.value)} className="input" placeholder="0x…" style={{ fontFamily:"JetBrains Mono,monospace",fontSize:13 }}/>
                </div>
                <div>
                  <label style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5,fontFamily:"Outfit,sans-serif" }}>Amount (USDC)</label>
                  <div style={{ display:"flex",gap:8 }}>
                    <div style={{ flex:1,display:"flex",alignItems:"center",gap:4,background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",padding:"9px 12px" }}>
                      <span style={{ fontWeight:700,color:"var(--text-4)" }}>$</span>
                      <input type="number" value={sendAmt} onChange={e=>setSendAmt(e.target.value)} step="0.01" min="0.001" style={{ flex:1,border:"none",outline:"none",background:"transparent",fontSize:18,fontWeight:700,color:"var(--text)",fontFamily:"Outfit,sans-serif" }} placeholder="0.00"/>
                      <span style={{ fontSize:11,fontWeight:600,color:"var(--text-4)" }}>USDC</span>
                    </div>
                    <button onClick={()=>setSendAmt(balance)} style={{ padding:"9px 12px",background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",fontSize:11,fontWeight:700,color:"var(--brand)",cursor:"pointer" }}>MAX</button>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5,fontFamily:"Outfit,sans-serif" }}>Wallet Password</label>
                  <input type="password" value={sendPw} onChange={e=>setSendPw(e.target.value)} className="input" placeholder="Enter password to sign"/>
                </div>
                {sendError && <p style={{ fontSize:12,color:"#dc2626",padding:"8px 10px",background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.18)",borderRadius:"var(--r)" }}>{sendError}</p>}
                <button onClick={doSend} disabled={!sendTo||!sendAmt||!sendPw||sending} className="btn btn-primary" style={{ height:50,justifyContent:"center",fontWeight:700,fontSize:15 }}>
                  {sending?<><div style={{ width:16,height:16,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%"}} className="spin"/>Sending…</>:<><Send size={15}/>Send USDC</>}
                </button>
              </div>
            </>)}
          </div>
        </div>
      )}

      {/* Receive modal */}
      {modal==="receive" && (
        <div style={{ position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center" }} onClick={e=>{if(e.target===e.currentTarget)setModal(null);}}>
          <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,.5)",backdropFilter:"blur(4px)" }}/>
          <div style={{ position:"relative",width:"100%",maxWidth:480,background:"var(--bg-card)",borderRadius:"var(--r-xl) var(--r-xl) 0 0",padding:"24px 20px",paddingBottom:36,textAlign:"center" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20 }}>
              <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:18,fontWeight:900,color:"var(--text)" }}>Receive USDC</h3>
              <button onClick={()=>setModal(null)} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text-4)" }}><X size={18}/></button>
            </div>
            {qrDataUrl && <img src={qrDataUrl} alt="QR Code" style={{ width:200,height:200,border:"8px solid white",borderRadius:"var(--r-lg)",margin:"0 auto 16px",display:"block",boxShadow:"var(--shadow)" }}/>}
            <p style={{ fontSize:11,color:"var(--text-4)",marginBottom:8 }}>Scan QR or copy address below</p>
            <div style={{ display:"flex",alignItems:"center",gap:8,background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",padding:"11px 14px",marginBottom:14 }}>
              <span style={{ flex:1,fontFamily:"JetBrains Mono,monospace",fontSize:11,color:"var(--text)",wordBreak:"break-all",textAlign:"left" }}>{active?.address}</span>
              <button onClick={copyAddress} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--brand)",display:"flex",flexShrink:0 }}>
                {copied?<Check size={16} style={{ color:"var(--accent)" }}/>:<Copy size={16}/>}
              </button>
            </div>
            <p style={{ fontSize:11,color:"var(--text-4)",lineHeight:1.65 }}>Only send USDC on Arc Testnet to this address.</p>
          </div>
        </div>
      )}

      {/* Wallet switcher */}
      {modal==="wallets" && (
        <div style={{ position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center" }} onClick={e=>{if(e.target===e.currentTarget)setModal(null);}}>
          <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,.5)",backdropFilter:"blur(4px)" }}/>
          <div style={{ position:"relative",width:"100%",maxWidth:480,background:"var(--bg-card)",borderRadius:"var(--r-xl) var(--r-xl) 0 0",padding:"20px",paddingBottom:36 }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
              <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:18,fontWeight:900,color:"var(--text)" }}>My Wallets</h3>
              <button onClick={()=>setModal(null)} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text-4)" }}><X size={18}/></button>
            </div>
            {wallets.map((w,i)=>(
              <button key={i} onClick={()=>switchWallet(i)} style={{ width:"100%",display:"flex",alignItems:"center",gap:12,padding:"12px",borderRadius:"var(--r-lg)",border:`1.5px solid ${i===activeIdx?"var(--brand)":"var(--border)"}`,background:i===activeIdx?"var(--brand-muted)":"transparent",cursor:"pointer",marginBottom:8,textAlign:"left",transition:"all .15s" }}>
                <div style={{ width:40,height:40,borderRadius:"50%",background:`linear-gradient(135deg,hsl(${parseInt(w.address.slice(2,4),16)*1.4}deg,65%,55%),hsl(${parseInt(w.address.slice(4,6),16)*1.4}deg,55%,45%))`,flexShrink:0 }}/>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:700,color:i===activeIdx?"var(--brand)":"var(--text)" }}>{w.name}</div>
                  <div style={{ fontFamily:"JetBrains Mono,monospace",fontSize:10,color:"var(--text-4)",marginTop:1 }}>{w.address.slice(0,10)}…{w.address.slice(-6)}</div>
                </div>
                {i===activeIdx && <div style={{ width:8,height:8,borderRadius:"50%",background:"var(--brand)",flexShrink:0 }}/>}
              </button>
            ))}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:4 }}>
              <Link href="/wallet-app/create" onClick={()=>setModal(null)} className="btn btn-secondary btn-sm" style={{ justifyContent:"center" }}><Plus size={13}/>Create</Link>
              <Link href="/wallet-app/import" onClick={()=>setModal(null)} className="btn btn-ghost btn-sm" style={{ justifyContent:"center" }}>Import</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
