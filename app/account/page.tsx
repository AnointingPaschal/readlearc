
"use client";
import { useAuth } from "../../lib/auth";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Save, CheckCircle2, AtSign, Globe, ExternalLink } from "lucide-react";
import Navbar from "../../components/ui/Navbar";
import SetupBanner from "../../components/ui/SetupBanner";
import ConnectGate from "../../components/ui/ConnectGate";

const GRADS = [
  "linear-gradient(135deg,#6d28d9,#059669)",
  "linear-gradient(135deg,#0284c7,#7c3aed)",
  "linear-gradient(135deg,#d97706,#dc2626)",
  "linear-gradient(135deg,#059669,#0284c7)",
  "linear-gradient(135deg,#7c3aed,#ec4899)",
  "linear-gradient(135deg,#ea580c,#eab308)",
];

function load(addr: string) { try { return JSON.parse(localStorage.getItem(`rl-profile-${addr.toLowerCase()}`)||"{}"); } catch { return {}; } }
function save(addr: string, d: any) { localStorage.setItem(`rl-profile-${addr.toLowerCase()}`, JSON.stringify(d)); }

export default function AccountPage() {
  const { address: _a, isAuth } = useAuth();
  const address = _a || "";
  const short = address ? `${address.slice(0,6)}…${address.slice(-4)}` : "";
  const balance = "—";
  const [name,    setName]    = useState("");
  const [bio,     setBio]     = useState("");
  const [website, setWebsite] = useState("");
  const [avatar,  setAvatar]  = useState(0);
  const [dirty,   setDirty]   = useState(false);
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    if (!address) return;
    const p = load(address);
    setName(p.displayName||""); setBio(p.bio||""); setWebsite(p.website||""); setAvatar(p.avatarIdx??0);
  }, [address]);

  function ch(setter: any) { return (e: any) => { setter(e.target.value); setDirty(true); }; }

  function handleSave() {
    if (!address) return;
    save(address, { displayName:name, bio, website, avatarIdx:avatar });
    setSaved(true); setDirty(false); setTimeout(()=>setSaved(false),3000);
  }

  if (!isAuth) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <SetupBanner/><Navbar/><ConnectGate title="Account Settings" body="Connect your wallet to edit your public profile. Your wallet address is your on-chain identity."/>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <SetupBanner/><Navbar/>
      <div style={{ maxWidth:600, margin:"0 auto", padding:"76px 16px 60px" }}>
        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(20px,4vw,26px)", fontWeight:900, color:"var(--text)", letterSpacing:"-0.02em", marginBottom:3 }}>Account Settings</h1>
          <p style={{ color:"var(--text-4)", fontSize:12 }}>Linked to <span style={{ fontFamily:"JetBrains Mono,monospace" }}>{short}</span></p>
        </div>

        {/* Identity strip */}
        <div className="card-flat" style={{ padding:"14px 18px", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10, borderRadius:"var(--r)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:40,height:40,borderRadius:"50%",background:GRADS[avatar],flexShrink:0 }}/>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:"var(--text)" }}>{name||"Unnamed Writer"}</div>
              <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:10, color:"var(--text-4)" }}>{address.slice(0,14)}…</div>
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:17, fontWeight:900, fontFamily:"Outfit,sans-serif", color:"var(--accent)" }}>${balance} <span style={{ fontSize:10, fontWeight:600, color:"var(--text-4)" }}>USDC</span></div>
            <Link href="/wallet" style={{ fontSize:11, color:"var(--brand)", textDecoration:"none" }}>Manage wallet →</Link>
          </div>
        </div>

        {/* Avatar */}
        <div className="card" style={{ padding:"18px 20px", marginBottom:14 }}>
          <h2 style={{ fontSize:13, fontWeight:700, color:"var(--text)", marginBottom:12 }}>Avatar</h2>
          <div style={{ display:"flex", gap:9, flexWrap:"wrap" }}>
            {GRADS.map((g,i) => (
              <button key={i} onClick={() => { setAvatar(i); setDirty(true); }} style={{ width:46,height:46,borderRadius:"50%",background:g,border:avatar===i?"3px solid var(--brand)":"3px solid transparent",cursor:"pointer",outline:avatar===i?"2px solid var(--brand-muted)":"none",outlineOffset:2,transition:"all .15s" }}/>
            ))}
          </div>
        </div>

        {/* Name */}
        <div className="card" style={{ padding:"18px 20px", marginBottom:14 }}>
          <label style={{ fontSize:11, fontWeight:700, color:"var(--text-4)", textTransform:"uppercase", letterSpacing:".07em", display:"block", marginBottom:7 }}>Display Name</label>
          <div style={{ display:"flex", alignItems:"center", gap:9, background:"var(--bg-alt)", border:"1.5px solid var(--border)", borderRadius:"var(--r)", padding:"10px 13px" }}>
            <AtSign size={14} style={{ color:"var(--text-4)", flexShrink:0 }}/>
            <input type="text" placeholder="Your name" value={name} onChange={ch(setName)} maxLength={60} style={{ flex:1, border:"none", outline:"none", background:"transparent", fontSize:15, color:"var(--text)", fontFamily:"Inter,sans-serif" }}/>
            <span style={{ fontSize:10, color:"var(--text-4)", fontFamily:"JetBrains Mono,monospace" }}>{name.length}/60</span>
          </div>
        </div>

        {/* Bio */}
        <div className="card" style={{ padding:"18px 20px", marginBottom:14 }}>
          <label style={{ fontSize:11, fontWeight:700, color:"var(--text-4)", textTransform:"uppercase", letterSpacing:".07em", display:"block", marginBottom:7 }}>Bio</label>
          <textarea placeholder="Tell readers who you are and what you write about…" value={bio} onChange={ch(setBio)} maxLength={300} rows={4}
            style={{ width:"100%", background:"var(--bg-alt)", border:"1.5px solid var(--border)", borderRadius:"var(--r)", padding:"10px 13px", outline:"none", color:"var(--text)", fontSize:14, lineHeight:1.65, resize:"vertical", fontFamily:"Inter,sans-serif" }}/>
          <div style={{ textAlign:"right", fontSize:10, color:"var(--text-4)", fontFamily:"JetBrains Mono,monospace", marginTop:4 }}>{bio.length}/300</div>
        </div>

        {/* Links */}
        <div className="card" style={{ padding:"18px 20px", marginBottom:22 }}>
          <h2 style={{ fontSize:13, fontWeight:700, color:"var(--text)", marginBottom:12 }}>Links</h2>
          <div style={{ display:"flex", alignItems:"center", gap:9, background:"var(--bg-alt)", border:"1.5px solid var(--border)", borderRadius:"var(--r)", padding:"10px 13px" }}>
            <Globe size={14} style={{ color:"var(--text-4)", flexShrink:0 }}/>
            <div style={{ fontSize:11, fontWeight:700, color:"var(--text-4)", width:54, flexShrink:0 }}>Website</div>
            <input type="text" placeholder="https://yoursite.com" value={website} onChange={ch(setWebsite)} style={{ flex:1, border:"none", outline:"none", background:"transparent", fontSize:13, color:"var(--text)", fontFamily:"Inter,sans-serif" }}/>
          </div>
        </div>

        <div style={{ display:"flex", gap:10, alignItems:"center", justifyContent:"flex-end" }}>
          <Link href={`/profile/${address}`} style={{ fontSize:13, color:"var(--brand)", fontWeight:600, textDecoration:"none", display:"flex", alignItems:"center", gap:3 }}>View profile <ExternalLink size={11}/></Link>
          <button onClick={handleSave} disabled={!dirty&&!saved} className="btn btn-primary" style={{ fontWeight:700, minWidth:130 }}>
            {saved ? <><CheckCircle2 size={14}/>Saved!</> : <><Save size={13}/>Save Changes</>}
          </button>
        </div>

        <div style={{ marginTop:24, padding:"12px 14px", background:"var(--bg-alt)", border:"1px solid var(--border)", borderRadius:"var(--r)", fontSize:11, color:"var(--text-4)", lineHeight:1.65 }}>
          <strong style={{ color:"var(--text-3)" }}>Note:</strong> Profile info (name, bio, avatar) is stored in your browser. Your on-chain identity — articles, reads, earnings — is permanent on Arc blockchain. On-chain profiles in v2.
        </div>
      </div>
    </div>
  );
}
