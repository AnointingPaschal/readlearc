"use client";
import { useState, useEffect } from "react";
import { User, Check, X, AtSign } from "lucide-react";
import { useAuth } from "../../lib/auth";

interface Props { onComplete?: () => void; }

export default function UsernameModal({ onComplete }: Props) {
  const { address, isAuth } = useAuth();
  const [show,        setShow]        = useState(false);
  const [username,    setUsername]    = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio,         setBio]         = useState("");
  const [checking,    setChecking]    = useState(false);
  const [available,   setAvailable]   = useState<boolean|null>(null);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");

  // Check if user already has a profile
  useEffect(() => {
    if (!isAuth || !address) return;
    fetch(`/api/profiles/${address}`)
      .then(r => r.json())
      .then(d => { if (!d.username) setShow(true); })
      .catch(() => setShow(true));
  }, [isAuth, address]);

  // Check username availability
  useEffect(() => {
    if (!username || username.length < 3) { setAvailable(null); return; }
    const t = setTimeout(async () => {
      setChecking(true);
      const r = await fetch(`/api/profiles/check-username?username=${username}`);
      const d = await r.json();
      setAvailable(d.available);
      setChecking(false);
    }, 500);
    return () => clearTimeout(t);
  }, [username]);

  async function save() {
    if (!username || !available || !address) return;
    setSaving(true); setError("");
    try {
      const r = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address, username, displayName, bio }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setShow(false);
      onComplete?.();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  function skip() { setShow(false); }

  if (!show || !isAuth) return null;

  const usernameValid = /^[a-zA-Z0-9_]{3,30}$/.test(username);

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.6)", backdropFilter:"blur(4px)" }}/>
      <div style={{ position:"relative", width:"100%", maxWidth:440, background:"var(--bg-card)", borderRadius:"var(--r-xl)", border:"1px solid var(--border)", boxShadow:"var(--shadow-lg)", overflow:"hidden" }}>
        <div style={{ padding:"24px 24px 0" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:40, height:40, borderRadius:"50%", background:"var(--brand-muted)", border:"1.5px solid var(--brand-border)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <User size={18} style={{ color:"var(--brand)" }}/>
              </div>
              <div>
                <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:18, fontWeight:900, color:"var(--text)", letterSpacing:"-.02em" }}>Set up your profile</h2>
                <p style={{ fontSize:12, color:"var(--text-4)" }}>Choose your username on Readlearc</p>
              </div>
            </div>
            <button onClick={skip} style={{ width:30, height:30, borderRadius:"50%", border:"1.5px solid var(--border)", background:"var(--bg-alt)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-4)" }}>
              <X size={13}/>
            </button>
          </div>

          {/* Username */}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, fontWeight:700, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:6, fontFamily:"Outfit,sans-serif" }}>Username *</label>
            <div style={{ position:"relative" }}>
              <AtSign size={14} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"var(--text-4)", pointerEvents:"none" }}/>
              <input
                type="text" value={username} maxLength={30}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="your_username"
                className="input"
                style={{ paddingLeft:34, paddingRight:36, fontFamily:"JetBrains Mono,monospace" }}
              />
              {username.length >= 3 && (
                <div style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)" }}>
                  {checking
                    ? <div style={{ width:14, height:14, border:"2px solid var(--border)", borderTopColor:"var(--brand)", borderRadius:"50%" }} className="spin"/>
                    : available === true
                      ? <Check size={14} style={{ color:"var(--accent)" }}/>
                      : available === false
                        ? <X size={14} style={{ color:"#dc2626" }}/>
                        : null
                  }
                </div>
              )}
            </div>
            {username && !usernameValid && <p style={{ fontSize:11, color:"#dc2626", marginTop:4 }}>3–30 chars, letters/numbers/underscore only</p>}
            {available === false && <p style={{ fontSize:11, color:"#dc2626", marginTop:4 }}>This username is taken</p>}
            {available === true  && <p style={{ fontSize:11, color:"var(--accent)", marginTop:4 }}>Username available!</p>}
          </div>

          {/* Display name */}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, fontWeight:700, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:6, fontFamily:"Outfit,sans-serif" }}>Display Name</label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your Name" className="input" maxLength={100}/>
          </div>

          {/* Bio */}
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:11, fontWeight:700, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:6, fontFamily:"Outfit,sans-serif" }}>Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell readers about yourself…" maxLength={160} rows={3}
              className="input" style={{ height:"auto", padding:"10px 12px", resize:"none", lineHeight:1.6 }}/>
            <div style={{ textAlign:"right", fontSize:10, color:"var(--text-4)", marginTop:3 }}>{bio.length}/160</div>
          </div>

          {error && <p style={{ fontSize:12, color:"#dc2626", marginBottom:10 }}>{error}</p>}
        </div>

        <div style={{ padding:"0 24px 20px", display:"flex", gap:8 }}>
          <button onClick={skip} className="btn btn-ghost" style={{ flex:1, justifyContent:"center" }}>Skip for now</button>
          <button onClick={save} disabled={!available || saving || !usernameValid} className="btn btn-primary" style={{ flex:2, justifyContent:"center" }}>
            {saving ? <><div style={{ width:14, height:14, border:"2px solid rgba(255,255,255,.3)", borderTopColor:"white", borderRadius:"50%" }} className="spin"/>Saving…</> : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
