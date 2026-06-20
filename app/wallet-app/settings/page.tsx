"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, LogOut, Shield, Eye, EyeOff, Copy, Check, Trash2, AlertTriangle } from "lucide-react";
import { loadWallets, getActiveIndex, decryptKey, saveWallets } from "../../../lib/internal-wallet";

export default function WalletSettings() {
  const [wallets, setWallets_] = useState<import("../../../lib/internal-wallet").StoredWallet[]>([]);
  const [idx_, setIdx_]        = useState(0);
  useEffect(() => {
    setWallets_(loadWallets());
    setIdx_(getActiveIndex());
  }, []);
  const idx    = idx_;
  const active = wallets[idx];
  const [password,    setPassword]    = useState("");
  const [showSeed,    setShowSeed]    = useState(false);
  const [seedPhrase,  setSeedPhrase]  = useState("");
  const [privateKey,  setPrivateKey]  = useState("");
  const [revealType,  setRevealType]  = useState<"seed"|"key"|null>(null);
  const [copied,      setCopied]      = useState<"seed"|"key"|null>(null);
  const [error,       setError]       = useState("");
  const [confirming,  setConfirming]  = useState(false);

  async function reveal(type: "seed"|"key") {
    setError(""); setSeedPhrase(""); setPrivateKey("");
    try {
      const pk = await decryptKey(active.encryptedKey, password);
      if (type==="key") {
        setPrivateKey(pk); setRevealType("key");
      } else {
        const { ethers } = await import("ethers");
        const w = new ethers.Wallet(pk);
        // We can't get mnemonic from private key directly in ethers v6
        // unless it was stored. Show private key as backup instead.
        setSeedPhrase("Seed phrase only available at wallet creation. Use private key to backup.");
        setPrivateKey(pk); setRevealType("seed");
      }
    } catch { setError("Incorrect password"); }
  }

  function copy(text: string, type: "seed"|"key") {
    navigator.clipboard.writeText(text);
    setCopied(type); setTimeout(()=>setCopied(null), 2000);
  }

  function deleteWallet() {
    const all = loadWallets();
    all.splice(idx, 1);
    saveWallets(all);
    window.location.href = "/wallet-app";
  }

  if (!active) return <div style={{ padding:20, color:"var(--text-3)" }}>No wallet found.</div>;

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"16px", display:"flex", alignItems:"center", gap:12, borderBottom:"1px solid var(--border)", background:"var(--bg-card)" }}>
        <Link href="/wallet-app" style={{ display:"flex",alignItems:"center",color:"var(--text-3)",textDecoration:"none" }}><ArrowLeft size={16}/></Link>
        <h1 style={{ fontFamily:"Outfit,sans-serif",fontSize:18,fontWeight:800,color:"var(--text)" }}>Wallet Settings</h1>
      </div>

      <div style={{ flex:1, padding:"20px 16px", maxWidth:480, margin:"0 auto", width:"100%", display:"flex", flexDirection:"column", gap:14 }}>
        {/* Wallet info */}
        <div className="card" style={{ padding:"16px" }}>
          <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:700,color:"var(--text-4)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:10 }}>Wallet Info</h3>
          <div style={{ marginBottom:8 }}>
            <div style={{ fontSize:11,color:"var(--text-4)",marginBottom:2 }}>Name</div>
            <div style={{ fontSize:14,fontWeight:700,color:"var(--text)" }}>{active.name}</div>
          </div>
          <div>
            <div style={{ fontSize:11,color:"var(--text-4)",marginBottom:2 }}>Address</div>
            <div style={{ fontFamily:"JetBrains Mono,monospace",fontSize:11,color:"var(--text)",wordBreak:"break-all" }}>{active.address}</div>
          </div>
        </div>

        {/* Backup */}
        <div className="card" style={{ padding:"16px" }}>
          <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:4 }}>
            <Shield size={14} style={{ color:"var(--brand)" }}/>
            <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:700,color:"var(--text)" }}>Backup Wallet</h3>
          </div>
          <p style={{ fontSize:12,color:"var(--text-4)",lineHeight:1.6,marginBottom:14 }}>Export your private key to backup or import into another wallet app.</p>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="input" placeholder="Enter wallet password" style={{ marginBottom:10 }}/>
          {error && <p style={{ fontSize:11,color:"#dc2626",marginBottom:8 }}>{error}</p>}
          <button onClick={()=>reveal("key")} disabled={!password} className="btn btn-secondary btn-sm" style={{ width:"100%",justifyContent:"center" }}>
            Show Private Key
          </button>

          {revealType && privateKey && (
            <div style={{ marginTop:12,padding:"12px 14px",background:"rgba(220,38,38,.05)",border:"1px solid rgba(220,38,38,.2)",borderRadius:"var(--r)",position:"relative" }}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8 }}>
                <span style={{ fontSize:10,fontWeight:700,color:"#dc2626",textTransform:"uppercase",letterSpacing:".07em" }}>Private Key — Keep Secret!</span>
                <button onClick={()=>copy(privateKey,"key")} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--brand)",display:"flex",gap:4,alignItems:"center",fontSize:11 }}>
                  {copied==="key"?<><Check size={11}/>Copied</>:<><Copy size={11}/>Copy</>}
                </button>
              </div>
              <div style={{ fontFamily:"JetBrains Mono,monospace",fontSize:10,color:"var(--text)",wordBreak:"break-all",filter:showSeed?"none":"blur(5px)",userSelect:showSeed?"auto":"none" }}>
                {privateKey}
              </div>
              <button onClick={()=>setShowSeed(v=>!v)} style={{ marginTop:8,background:"none",border:"none",cursor:"pointer",color:"var(--text-4)",fontSize:11,display:"flex",alignItems:"center",gap:4 }}>
                {showSeed?<><EyeOff size={12}/>Hide</>:<><Eye size={12}/>Show</>}
              </button>
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div className="card" style={{ padding:"16px",borderColor:"rgba(220,38,38,.25)" }}>
          <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:4 }}>
            <AlertTriangle size={14} style={{ color:"#dc2626" }}/>
            <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:700,color:"#dc2626" }}>Danger Zone</h3>
          </div>
          <p style={{ fontSize:12,color:"var(--text-4)",lineHeight:1.6,marginBottom:14 }}>Remove this wallet from this device. Make sure you have a backup before proceeding.</p>
          {!confirming ? (
            <button onClick={()=>setConfirming(true)} className="btn btn-danger btn-sm" style={{ width:"100%",justifyContent:"center" }}>
              <Trash2 size={13}/>Remove Wallet
            </button>
          ) : (
            <div style={{ display:"flex",gap:8 }}>
              <button onClick={()=>setConfirming(false)} className="btn btn-ghost btn-sm" style={{ flex:1,justifyContent:"center" }}>Cancel</button>
              <button onClick={deleteWallet} className="btn btn-danger btn-sm" style={{ flex:2,justifyContent:"center" }}><Trash2 size={12}/>Confirm Delete</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
