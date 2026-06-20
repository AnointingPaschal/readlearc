"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Key } from "lucide-react";
import { importFromMnemonic, importFromPrivateKey, addWallet, validateMnemonic, validatePrivateKey } from "../../../lib/internal-wallet";

export default function ImportWalletPage() {
  const router = useRouter();
  const [tab,        setTab]        = useState<"seed"|"key">("seed");
  const [walletName, setWalletName] = useState("Imported Wallet");
  const [seedInput,  setSeedInput]  = useState("");
  const [keyInput,   setKeyInput]   = useState("");
  const [password,   setPassword]   = useState("");
  const [confirm,    setConfirm]    = useState("");
  const [showPw,     setShowPw]     = useState(false);
  const [showKey,    setShowKey]    = useState(false);
  const [importing,  setImporting]  = useState(false);
  const [error,      setError]      = useState("");

  const seedWords = seedInput.trim().split(/\s+/).filter(Boolean);
  const seedOk    = tab==="seed" ? validateMnemonic(seedInput) : false;
  const keyOk     = tab==="key"  ? validatePrivateKey(keyInput) : false;
  const inputOk   = tab==="seed" ? seedOk : keyOk;
  const pwOk      = password.length >= 8 && password === confirm;

  async function doImport() {
    if (!inputOk || !pwOk) return;
    setImporting(true); setError("");
    try {
      const wallet = tab==="seed" ? importFromMnemonic(seedInput) : importFromPrivateKey(keyInput);
      await addWallet(wallet, walletName, password);
      router.push("/wallet-app");
    } catch(e:any) { setError(e.message); setImporting(false); }
  }

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"16px", display:"flex", alignItems:"center", gap:12, borderBottom:"1px solid var(--border)", background:"var(--bg-card)" }}>
        <Link href="/wallet-app" style={{ display:"flex",alignItems:"center",color:"var(--text-3)",textDecoration:"none" }}><ArrowLeft size={16}/></Link>
        <h1 style={{ fontFamily:"Outfit,sans-serif",fontSize:18,fontWeight:800,color:"var(--text)" }}>Import Wallet</h1>
      </div>

      <div style={{ flex:1,padding:"24px 20px",maxWidth:480,margin:"0 auto",width:"100%",display:"flex",flexDirection:"column",gap:16 }}>
        <div style={{ textAlign:"center",marginBottom:4 }}>
          <div style={{ width:60,height:60,borderRadius:20,background:"var(--brand-muted)",border:"1.5px solid var(--brand-border)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px" }}>
            <Key size={26} style={{ color:"var(--brand)" }}/>
          </div>
          <h2 style={{ fontFamily:"Outfit,sans-serif",fontSize:22,fontWeight:900,color:"var(--text)",marginBottom:4 }}>Import Existing Wallet</h2>
          <p style={{ fontSize:13,color:"var(--text-4)",lineHeight:1.65 }}>Enter your seed phrase or private key to restore your wallet.</p>
        </div>

        {/* Tabs */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:6 }}>
          {(["seed","key"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{ padding:"10px",borderRadius:"var(--r)",border:`1.5px solid ${tab===t?"var(--brand)":"var(--border)"}`,background:tab===t?"var(--brand-muted)":"transparent",color:tab===t?"var(--brand)":"var(--text-3)",cursor:"pointer",fontWeight:700,fontSize:13,fontFamily:"Outfit,sans-serif",transition:"all .15s" }}>
              {t==="seed"?"Seed Phrase":"Private Key"}
            </button>
          ))}
        </div>

        {tab==="seed" ? (
          <div>
            <label style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5,fontFamily:"Outfit,sans-serif" }}>12 or 24 Word Seed Phrase</label>
            <textarea value={seedInput} onChange={e=>setSeedInput(e.target.value)} rows={4} className="input"
              placeholder="Enter your seed phrase with words separated by spaces…"
              style={{ height:"auto",padding:"12px 14px",resize:"none",lineHeight:1.6,fontFamily:"JetBrains Mono,monospace",fontSize:13 }}/>
            <div style={{ display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--text-4)",marginTop:4 }}>
              <span>{seedWords.length}/12 words</span>
              {seedOk && <span style={{ color:"var(--accent)",fontWeight:700 }}>Valid seed phrase</span>}
              {seedInput && !seedOk && seedWords.length===12 && <span style={{ color:"#dc2626" }}>Invalid seed phrase</span>}
            </div>
          </div>
        ) : (
          <div>
            <label style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5,fontFamily:"Outfit,sans-serif" }}>Private Key</label>
            <div style={{ position:"relative" }}>
              <input type={showKey?"text":"password"} value={keyInput} onChange={e=>setKeyInput(e.target.value)} className="input" placeholder="0x..." style={{ fontFamily:"JetBrains Mono,monospace",fontSize:13,paddingRight:42 }}/>
              <button onClick={()=>setShowKey(v=>!v)} style={{ position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--text-4)",display:"flex" }}>
                {showKey?<EyeOff size={15}/>:<Eye size={15}/>}
              </button>
            </div>
            {keyInput && keyOk && <p style={{ fontSize:11,color:"var(--accent)",marginTop:4,fontWeight:700 }}>Valid private key</p>}
            {keyInput && !keyOk && <p style={{ fontSize:11,color:"#dc2626",marginTop:4 }}>Invalid private key format</p>}
          </div>
        )}

        <div>
          <label style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5,fontFamily:"Outfit,sans-serif" }}>Wallet Name</label>
          <input value={walletName} onChange={e=>setWalletName(e.target.value)} className="input" placeholder="My Wallet"/>
        </div>
        <div>
          <label style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5,fontFamily:"Outfit,sans-serif" }}>Password</label>
          <div style={{ position:"relative" }}>
            <input type={showPw?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} className="input" placeholder="Min 8 characters" style={{ paddingRight:42 }}/>
            <button onClick={()=>setShowPw(v=>!v)} style={{ position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--text-4)",display:"flex" }}>
              {showPw?<EyeOff size={15}/>:<Eye size={15}/>}
            </button>
          </div>
        </div>
        <div>
          <label style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5,fontFamily:"Outfit,sans-serif" }}>Confirm Password</label>
          <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} className="input" placeholder="Repeat password"/>
        </div>

        {error && <p style={{ fontSize:12,color:"#dc2626" }}>{error}</p>}

        <button onClick={doImport} disabled={!inputOk||!pwOk||importing} className="btn btn-primary" style={{ height:50,justifyContent:"center",fontWeight:700,fontSize:15 }}>
          {importing?<><div style={{ width:16,height:16,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%"}} className="spin"/>Importing…</>:"Import Wallet"}
        </button>
      </div>
    </div>
  );
}
