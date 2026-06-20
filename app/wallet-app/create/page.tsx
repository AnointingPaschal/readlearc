"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Copy, Check, Shield, AlertTriangle, CheckCircle2 } from "lucide-react";
import { generateWallet, addWallet, validateMnemonic } from "../../../lib/internal-wallet";

type Step = "password"|"seed"|"verify"|"done";

export default function CreateWalletPage() {
  const router = useRouter();
  const [step,       setStep]       = useState<Step>("password");
  const [walletName, setWalletName] = useState("My Wallet");
  const [password,   setPassword]   = useState("");
  const [confirm,    setConfirm]    = useState("");
  const [showPw,     setShowPw]     = useState(false);
  const [mnemonic,   setMnemonic]   = useState("");
  const [words,      setWords]      = useState<string[]>([]);
  const [showSeed,   setShowSeed]   = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [selected,   setSelected]   = useState<number[]>([]);
  const [shuffled,   setShuffled]   = useState<string[]>([]);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");

  function generateSeed() {
    const { mnemonic: m } = generateWallet();
    const ws = m.split(" ");
    setMnemonic(m);
    setWords(ws);
    setShuffled([...ws].sort(() => Math.random()-0.5));
    setStep("seed");
  }

  function copyMnemonic() {
    navigator.clipboard.writeText(mnemonic);
    setCopied(true); setTimeout(()=>setCopied(false),2000);
  }

  function toggleWord(idx: number) {
    setSelected(prev =>
      prev.includes(idx) ? prev.filter(i=>i!==idx) : [...prev, idx]
    );
  }

  const selectedWords = selected.map(i => shuffled[i]);
  const verifyCorrect = selectedWords.join(" ") === words.join(" ");

  async function finishCreate() {
    setSaving(true); setError("");
    try {
      const wallet = await import("../../../lib/internal-wallet").then(m => m.importFromMnemonic(mnemonic));
      await addWallet(wallet, walletName, password);
      router.push("/wallet-app");
    } catch(e:any) { setError(e.message); setSaving(false); }
  }

  const pwOk = password.length >= 8;
  const pwMatch = password === confirm;

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <div style={{ padding:"16px", display:"flex", alignItems:"center", gap:12, borderBottom:"1px solid var(--border)", background:"var(--bg-card)" }}>
        <Link href="/wallet-app" style={{ display:"flex",alignItems:"center",gap:4,color:"var(--text-3)",textDecoration:"none",fontSize:13 }}><ArrowLeft size={16}/></Link>
        <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:18, fontWeight:800, color:"var(--text)" }}>Create Wallet</h1>
        <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
          {(["password","seed","verify"] as Step[]).map((s,i)=>(
            <div key={s} style={{ width:24,height:4,borderRadius:99,background:["password","seed","verify","done"].indexOf(step)>=i?"var(--brand)":"var(--border)" }}/>
          ))}
        </div>
      </div>

      <div style={{ flex:1, padding:"24px 20px", maxWidth:480, margin:"0 auto", width:"100%" }}>

        {/* Step 1: Password */}
        {step==="password" && (
          <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
            <div style={{ textAlign:"center",marginBottom:8 }}>
              <div style={{ width:64,height:64,borderRadius:24,background:"var(--brand-muted)",border:"1.5px solid var(--brand-border)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px" }}>
                <Shield size={28} style={{ color:"var(--brand)" }}/>
              </div>
              <h2 style={{ fontFamily:"Outfit,sans-serif",fontSize:22,fontWeight:900,color:"var(--text)",marginBottom:6 }}>Secure your wallet</h2>
              <p style={{ fontSize:13,color:"var(--text-4)",lineHeight:1.65 }}>Set a password to encrypt your wallet on this device. You'll need it to sign transactions.</p>
            </div>
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
              {password && !pwOk && <p style={{ fontSize:11,color:"#dc2626",marginTop:4 }}>At least 8 characters</p>}
            </div>
            <div>
              <label style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5,fontFamily:"Outfit,sans-serif" }}>Confirm Password</label>
              <input type={showPw?"text":"password"} value={confirm} onChange={e=>setConfirm(e.target.value)} className="input" placeholder="Repeat password"/>
              {confirm && !pwMatch && <p style={{ fontSize:11,color:"#dc2626",marginTop:4 }}>Passwords don't match</p>}
            </div>
            <button onClick={generateSeed} disabled={!pwOk||!pwMatch||!walletName} className="btn btn-primary" style={{ height:50,justifyContent:"center",fontWeight:700,fontSize:15 }}>
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Seed phrase */}
        {step==="seed" && (
          <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
            <div style={{ textAlign:"center",marginBottom:4 }}>
              <h2 style={{ fontFamily:"Outfit,sans-serif",fontSize:22,fontWeight:900,color:"var(--text)",marginBottom:6 }}>Secret Recovery Phrase</h2>
              <p style={{ fontSize:13,color:"var(--text-4)",lineHeight:1.65 }}>Write down these 12 words in order. This is the only way to recover your wallet if you lose access.</p>
            </div>
            <div style={{ padding:"10px 14px",background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.2)",borderRadius:"var(--r-md)",display:"flex",gap:8 }}>
              <AlertTriangle size={14} style={{ color:"#dc2626",flexShrink:0,marginTop:1 }}/>
              <p style={{ fontSize:12,color:"#dc2626",lineHeight:1.6 }}>Never share your seed phrase. Anyone with it has full control of your wallet.</p>
            </div>
            <div style={{ background:"var(--bg-card)",border:"1.5px solid var(--border)",borderRadius:"var(--r-lg)",padding:16,filter:showSeed?"none":"blur(6px)",userSelect:showSeed?"auto":"none",transition:"filter .3s",position:"relative" }}>
              {!showSeed && (
                <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",zIndex:1 }} onClick={()=>setShowSeed(true)}>
                  <button className="btn btn-primary btn-sm" style={{ filter:"none" }}><Eye size={13}/>Reveal Phrase</button>
                </div>
              )}
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8 }}>
                {words.map((w,i)=>(
                  <div key={i} style={{ display:"flex",alignItems:"center",gap:6,padding:"8px 10px",background:"var(--bg-alt)",borderRadius:"var(--r)",border:"1px solid var(--border)" }}>
                    <span style={{ fontSize:10,fontWeight:700,color:"var(--text-4)",minWidth:16 }}>{i+1}.</span>
                    <span style={{ fontSize:13,fontWeight:600,color:"var(--text)",fontFamily:"JetBrains Mono,monospace" }}>{w}</span>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={copyMnemonic} className="btn btn-secondary" style={{ justifyContent:"center" }}>
              {copied?<><Check size={13}/>Copied!</>:<><Copy size={13}/>Copy to Clipboard</>}
            </button>
            <button onClick={()=>setStep("verify")} disabled={!showSeed} className="btn btn-primary" style={{ height:50,justifyContent:"center",fontWeight:700,fontSize:15 }}>
              I've saved it — Continue
            </button>
          </div>
        )}

        {/* Step 3: Verify */}
        {step==="verify" && (
          <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
            <div style={{ textAlign:"center",marginBottom:4 }}>
              <h2 style={{ fontFamily:"Outfit,sans-serif",fontSize:22,fontWeight:900,color:"var(--text)",marginBottom:6 }}>Verify Your Phrase</h2>
              <p style={{ fontSize:13,color:"var(--text-4)",lineHeight:1.65 }}>Select the words in the correct order to confirm you've saved your seed phrase.</p>
            </div>
            {/* Selected area */}
            <div style={{ minHeight:80,background:"var(--bg-card)",border:`2px dashed ${verifyCorrect&&selected.length===12?"var(--accent)":"var(--border)"}`,borderRadius:"var(--r-lg)",padding:12,display:"flex",flexWrap:"wrap",gap:6,alignContent:"flex-start",transition:"border-color .2s" }}>
              {selectedWords.map((word,i)=>(
                <span key={i} onClick={()=>setSelected(prev=>{ const idx=selected[i]; return prev.filter((_,j)=>j!==i); })} style={{ padding:"5px 10px",background:"var(--brand-muted)",border:"1px solid var(--brand-border)",borderRadius:"var(--r-f)",fontSize:12,fontWeight:600,color:"var(--brand)",cursor:"pointer",fontFamily:"JetBrains Mono,monospace" }}>
                  {word}
                </span>
              ))}
            </div>
            {/* Shuffled words */}
            <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
              {shuffled.map((word,i)=>!selected.includes(i)&&(
                <button key={i} onClick={()=>toggleWord(i)} style={{ padding:"7px 12px",background:"var(--bg-card)",border:"1.5px solid var(--border)",borderRadius:"var(--r-f)",fontSize:12,fontWeight:600,color:"var(--text-2)",cursor:"pointer",fontFamily:"JetBrains Mono,monospace",transition:"all .12s" }}
                  onMouseEnter={e=>{(e.currentTarget as any).style.borderColor="var(--brand)";(e.currentTarget as any).style.color="var(--brand)";}}
                  onMouseLeave={e=>{(e.currentTarget as any).style.borderColor="var(--border)";(e.currentTarget as any).style.color="var(--text-2)";}}>
                  {word}
                </button>
              ))}
            </div>
            {error && <p style={{ fontSize:12,color:"#dc2626" }}>{error}</p>}
            <button onClick={finishCreate} disabled={!verifyCorrect||selected.length!==12||saving} className="btn btn-primary" style={{ height:50,justifyContent:"center",fontWeight:700,fontSize:15 }}>
              {saving?<><div style={{ width:16,height:16,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%"}} className="spin"/>Creating…</>:<>Create Wallet</>}
            </button>
            <button onClick={()=>{setSelected([]);setStep("seed");}} className="btn btn-ghost" style={{ justifyContent:"center" }}>← Back</button>
          </div>
        )}
      </div>
    </div>
  );
}
