"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Shield, Key, Plus, Eye, EyeOff, Lock, AlertTriangle, Check } from "lucide-react";
import { useAuth } from "../../lib/auth";
import {
  generateWallet, importFromMnemonic, importFromPrivateKey,
  addWallet, validateMnemonic, validatePrivateKey,
} from "../../lib/internal-wallet";

type View = "gate"|"unlock"|"create-pw"|"create-seed"|"import";

export default function AuthModal() {
  const { authModal, setAuthModal, hasWallet, isLocked, unlock, isAuth } = useAuth();
  const router = useRouter();

  const [view,       setView]       = useState<View>("gate");
  const [password,   setPassword]   = useState("");
  const [confirm,    setConfirm]    = useState("");
  const [showPw,     setShowPw]     = useState(false);
  const [walletName, setWalletName] = useState("My Wallet");
  const [mnemonic,   setMnemonic]   = useState("");
  const [words,      setWords]      = useState<string[]>([]);
  const [revealed,   setRevealed]   = useState(false);
  const [seedInput,  setSeedInput]  = useState("");
  const [keyInput,   setKeyInput]   = useState("");
  const [importTab,  setImportTab]  = useState<"seed"|"key">("seed");
  const [busy,       setBusy]       = useState(false);
  const [error,      setError]      = useState("");

  // Reset view when modal opens
  useEffect(() => {
    if (!authModal) return;
    setError(""); setPassword(""); setConfirm("");
    setView(isLocked ? "unlock" : hasWallet ? "unlock" : "gate");
  }, [authModal, isLocked, hasWallet]);

  if (!authModal) return null;

  // Unlock existing wallet
  async function doUnlock() {
    setBusy(true); setError("");
    try { await unlock(password); }
    catch { setError("Incorrect password. Try again."); }
    finally { setBusy(false); }
  }

  // Create wallet step 1 → generate seed
  function startCreate() {
    const { mnemonic: m } = generateWallet();
    setMnemonic(m);
    setWords(m.split(" "));
    setRevealed(false);
    setView("create-seed");
  }

  // Finish create
  async function finishCreate() {
    if (!password || password.length < 8) { setError("Password too short"); return; }
    setBusy(true); setError("");
    try {
      const wallet = importFromMnemonic(mnemonic);
      await addWallet(wallet, walletName, password);
      window.dispatchEvent(new Event("rl-wallet-created"));
      await unlock(password);
      setAuthModal(false);
    } catch(e:any) { setError(e.message); }
    finally { setBusy(false); }
  }

  // Import wallet
  async function doImport() {
    setBusy(true); setError("");
    try {
      const wallet = importTab==="seed"
        ? importFromMnemonic(seedInput)
        : importFromPrivateKey(keyInput);
      await addWallet(wallet, walletName, password);
      window.dispatchEvent(new Event("rl-wallet-created"));
      await unlock(password);
      setAuthModal(false);
    } catch(e:any) { setError(e.message); }
    finally { setBusy(false); }
  }

  const pwOk    = password.length >= 8 && password === confirm;
  const seedOk  = validateMnemonic(seedInput);
  const keyOk   = validatePrivateKey(keyInput);
  const importOk= importTab==="seed" ? seedOk : keyOk;

  return (
    <div style={{ position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}
      onClick={e=>{if(e.target===e.currentTarget)setAuthModal(false);}}>
      <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,.65)",backdropFilter:"blur(6px)" }}/>

      <div style={{ position:"relative",width:"100%",maxWidth:420,background:"var(--bg-card)",borderRadius:"var(--r-xl)",border:"1.5px solid var(--border)",boxShadow:"var(--shadow-lg)",overflow:"hidden",maxHeight:"92vh",overflowY:"auto" }}>
        {/* Header */}
        <div style={{ padding:"20px 20px 0",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,var(--brand),var(--accent))",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
              {view==="unlock"?<Lock size={16} color="white"/>:<Shield size={16} color="white"/>}
            </div>
            <div>
              <h2 style={{ fontFamily:"Outfit,sans-serif",fontSize:17,fontWeight:900,color:"var(--text)",letterSpacing:"-.02em" }}>
                {view==="gate"     ? "Sign In to Continue" :
                 view==="unlock"   ? "Unlock Your Wallet"  :
                 view==="create-pw"? "Create Wallet"       :
                 view==="create-seed"? "Your Recovery Phrase":
                 "Import Wallet"}
              </h2>
              <p style={{ fontSize:11,color:"var(--text-4)",marginTop:1 }}>
                {view==="gate"?"All-in-one crypto wallet for Readlearc":
                 view==="unlock"?"Enter your password to continue":
                 "Powered by Arc Testnet"}
              </p>
            </div>
          </div>
          <button onClick={()=>setAuthModal(false)} style={{ width:30,height:30,borderRadius:"50%",border:"1.5px solid var(--border)",background:"var(--bg-alt)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-4)",flexShrink:0 }}>
            <X size={13}/>
          </button>
        </div>

        <div style={{ padding:"18px 20px 22px",display:"flex",flexDirection:"column",gap:13 }}>

          {/* GATE: Choose create or import */}
          {view==="gate" && (<>
            <p style={{ fontSize:13,color:"var(--text-3)",lineHeight:1.65,textAlign:"center",padding:"0 8px" }}>
              Create a free crypto wallet to unlock articles, pay writers, and interact with the Arc blockchain.
            </p>
            <button onClick={()=>setView("create-pw")} className="btn btn-primary" style={{ height:50,justifyContent:"center",fontWeight:700,fontSize:15 }}>
              <Plus size={17}/>Create New Wallet
            </button>
            <button onClick={()=>setView("import")} className="btn btn-secondary" style={{ height:46,justifyContent:"center",fontWeight:700 }}>
              Import Existing Wallet
            </button>
            <p style={{ fontSize:11,color:"var(--text-4)",textAlign:"center",lineHeight:1.6 }}>
              Your keys are encrypted locally — we never have access to your funds.
            </p>
          </>)}

          {/* UNLOCK */}
          {view==="unlock" && (<>
            <div>
              <label style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5,fontFamily:"Outfit,sans-serif" }}>Password</label>
              <div style={{ position:"relative" }}>
                <input type={showPw?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&doUnlock()} autoFocus
                  className="input" placeholder="Enter your wallet password" style={{ paddingRight:42 }}/>
                <button onClick={()=>setShowPw(v=>!v)} style={{ position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--text-4)",display:"flex" }}>
                  {showPw?<EyeOff size={15}/>:<Eye size={15}/>}
                </button>
              </div>
            </div>
            {error && <p style={{ fontSize:12,color:"#dc2626",padding:"7px 10px",background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.18)",borderRadius:"var(--r)" }}>{error}</p>}
            <button onClick={doUnlock} disabled={!password||busy} className="btn btn-primary" style={{ height:48,justifyContent:"center",fontWeight:700,fontSize:15 }}>
              {busy?<><div style={{ width:15,height:15,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%"}} className="spin"/>Unlocking…</>:<><Lock size={15}/>Unlock Wallet</>}
            </button>
            <div style={{ display:"flex",gap:8 }}>
              <button onClick={()=>setView("import")} className="btn btn-ghost btn-sm" style={{ flex:1,justifyContent:"center",fontSize:12 }}>Import Different Wallet</button>
              <button onClick={()=>setView("create-pw")} className="btn btn-ghost btn-sm" style={{ flex:1,justifyContent:"center",fontSize:12 }}>Create New Wallet</button>
            </div>
          </>)}

          {/* CREATE — Password step */}
          {view==="create-pw" && (<>
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
            <button onClick={startCreate} disabled={!pwOk||!walletName} className="btn btn-primary" style={{ height:48,justifyContent:"center",fontWeight:700,fontSize:15 }}>
              Generate Wallet
            </button>
            <button onClick={()=>setView("gate")} className="btn btn-ghost btn-sm" style={{ justifyContent:"center" }}>← Back</button>
          </>)}

          {/* CREATE — Seed phrase */}
          {view==="create-seed" && (<>
            <div style={{ padding:"10px 12px",background:"rgba(217,119,6,.06)",border:"1px solid rgba(217,119,6,.2)",borderRadius:"var(--r)",display:"flex",gap:8 }}>
              <AlertTriangle size={13} style={{ color:"#d97706",flexShrink:0,marginTop:1 }}/>
              <p style={{ fontSize:11,color:"#d97706",lineHeight:1.6 }}>Write these 12 words down and store them safely. This is the only way to recover your wallet.</p>
            </div>
            <div style={{ background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r-lg)",padding:14,filter:revealed?"none":"blur(5px)",userSelect:revealed?"auto":"none",position:"relative" }}>
              {!revealed&&(
                <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",zIndex:1 }}>
                  <button onClick={()=>setRevealed(true)} className="btn btn-primary btn-sm" style={{ filter:"none" }}><Eye size={13}/>Reveal</button>
                </div>
              )}
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6 }}>
                {words.map((w,i)=>(
                  <div key={i} style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 8px",background:"var(--bg-card)",borderRadius:"var(--r)",border:"1px solid var(--border)" }}>
                    <span style={{ fontSize:9,fontWeight:700,color:"var(--text-4)",minWidth:14 }}>{i+1}.</span>
                    <span style={{ fontSize:11,fontWeight:600,color:"var(--text)",fontFamily:"JetBrains Mono,monospace" }}>{w}</span>
                  </div>
                ))}
              </div>
            </div>
            {error && <p style={{ fontSize:12,color:"#dc2626" }}>{error}</p>}
            <button onClick={finishCreate} disabled={!revealed||busy} className="btn btn-primary" style={{ height:48,justifyContent:"center",fontWeight:700,fontSize:15 }}>
              {busy?<><div style={{ width:15,height:15,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%"}} className="spin"/>Creating…</>:<><Check size={15}/>I've Saved It — Create Wallet</>}
            </button>
          </>)}

          {/* IMPORT */}
          {view==="import" && (<>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:6 }}>
              {(["seed","key"] as const).map(t=>(
                <button key={t} onClick={()=>setImportTab(t)} style={{ padding:"9px",borderRadius:"var(--r)",border:`1.5px solid ${importTab===t?"var(--brand)":"var(--border)"}`,background:importTab===t?"var(--brand-muted)":"transparent",color:importTab===t?"var(--brand)":"var(--text-3)",cursor:"pointer",fontWeight:700,fontSize:12,fontFamily:"Outfit,sans-serif",transition:"all .15s" }}>
                  {t==="seed"?"Seed Phrase":"Private Key"}
                </button>
              ))}
            </div>
            {importTab==="seed"?(
              <div>
                <textarea value={seedInput} onChange={e=>setSeedInput(e.target.value)} rows={3} className="input"
                  placeholder="Enter 12 or 24 word seed phrase…"
                  style={{ height:"auto",padding:"10px 12px",resize:"none",fontFamily:"JetBrains Mono,monospace",fontSize:12,lineHeight:1.65 }}/>
                {seedInput&&<p style={{ fontSize:10,color:seedOk?"var(--accent)":"#dc2626",marginTop:3,fontWeight:600 }}>{seedOk?"Valid seed phrase":"Invalid seed phrase"}</p>}
              </div>
            ):(
              <div>
                <input type="password" value={keyInput} onChange={e=>setKeyInput(e.target.value)} className="input" placeholder="0x..." style={{ fontFamily:"JetBrains Mono,monospace",fontSize:12 }}/>
                {keyInput&&<p style={{ fontSize:10,color:keyOk?"var(--accent)":"#dc2626",marginTop:3,fontWeight:600 }}>{keyOk?"Valid private key":"Invalid private key"}</p>}
              </div>
            )}
            <div>
              <label style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5,fontFamily:"Outfit,sans-serif" }}>Wallet Name</label>
              <input value={walletName} onChange={e=>setWalletName(e.target.value)} className="input" placeholder="My Wallet"/>
            </div>
            <div>
              <label style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5,fontFamily:"Outfit,sans-serif" }}>Set Password</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="input" placeholder="Min 8 characters"/>
            </div>
            <div>
              <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} className="input" placeholder="Confirm password"/>
            </div>
            {error&&<p style={{ fontSize:12,color:"#dc2626" }}>{error}</p>}
            <button onClick={doImport} disabled={!importOk||!pwOk||busy} className="btn btn-primary" style={{ height:48,justifyContent:"center",fontWeight:700,fontSize:15 }}>
              {busy?<><div style={{ width:15,height:15,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%"}} className="spin"/>Importing…</>:"Import Wallet"}
            </button>
            <button onClick={()=>setView(hasWallet?"unlock":"gate")} className="btn btn-ghost btn-sm" style={{ justifyContent:"center" }}>← Back</button>
          </>)}
        </div>
      </div>
    </div>
  );
}
