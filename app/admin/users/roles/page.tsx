"use client";
import { useState, useEffect } from "react";
import { Search, Shield, ShieldCheck, ShieldAlert, ShieldOff, RefreshCw, Plus, X, CheckCircle2, AlertCircle, Copy, Check } from "lucide-react";
import { useAuth } from "../../../../lib/auth";

const ROLES = [
  { value:3, label:"Super Admin", desc:"Full access including owner functions", color:"#dc2626" },
  { value:2, label:"Admin",       desc:"Manage content, users and settings",   color:"var(--brand)" },
  { value:1, label:"Moderator",   desc:"Approve/reject articles and comments", color:"#d97706" },
];

interface Entry { walletAddress:string; role:number; roleName:string; username?:string; grantedAt:string; }

export default function AdminRolesPage() {
  const { address: myAddress } = useAuth();
  const [roles,   setRoles]   = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [newAddr, setNewAddr] = useState("");
  const [newRole, setNewRole] = useState(2);
  const [adding,  setAdding]  = useState(false);
  const [acting,  setActing]  = useState("");
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [copied,  setCopied]  = useState(false);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/roles");
    const d = await r.json();
    setRoles(Array.isArray(d) ? d : []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function grantRole() {
    const addr = newAddr.trim().toLowerCase();
    if (!addr.startsWith("0x") || addr.length < 10) { setError("Enter a valid wallet address (0x…)"); return; }
    setAdding(true); setError(""); setSuccess("");
    const r = await fetch("/api/admin/roles", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ walletAddress: addr, role: newRole }),
    });
    const d = await r.json();
    if (!r.ok) { setError(d.error || "Failed to assign role"); }
    else {
      setSuccess(`Role assigned! The user must lock and unlock their wallet to see admin access.`);
      setNewAddr(""); setShowAdd(false);
      await load();
    }
    setAdding(false);
  }

  async function revokeRole(address: string) {
    setActing(address); setError(""); setSuccess("");
    const r = await fetch("/api/admin/roles", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ walletAddress: address, role: 0 }),
    });
    const d = await r.json();
    if (!r.ok) setError(d.error || "Failed to revoke");
    else { setSuccess("Role revoked."); await load(); }
    setActing("");
  }

  function copyAddr() {
    if (!myAddress) return;
    navigator.clipboard.writeText(myAddress);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const filtered = roles.filter(r => !search ||
    r.walletAddress.toLowerCase().includes(search.toLowerCase()) ||
    r.username?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div>
          <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--text)", letterSpacing:"-.02em" }}>Admin Roles</h1>
          <p style={{ fontSize:12, color:"var(--text-4)", marginTop:2 }}>{roles.length} users with elevated permissions</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={load} disabled={loading} style={{ display:"flex",alignItems:"center",gap:5,padding:"7px 12px",border:"1.5px solid var(--border)",background:"var(--bg-alt)",borderRadius:"var(--r-f)",cursor:"pointer",fontSize:12,fontWeight:600,color:"var(--text-3)" }}>
            <RefreshCw size={12} className={loading?"spin":""}/>Refresh
          </button>
          <button onClick={() => setShowAdd(v=>!v)} className="btn btn-primary" style={{ gap:6 }}>
            <Plus size={12}/>Grant Role
          </button>
        </div>
      </div>

      {/* My address helper */}
      {myAddress && (
        <div style={{ padding:"10px 14px", background:"var(--bg-alt)", border:"1px solid var(--border)", borderRadius:"var(--r-md)", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:10, fontWeight:700, color:"var(--text-4)", textTransform:"uppercase", letterSpacing:".07em", marginBottom:2, fontFamily:"Outfit,sans-serif" }}>Your connected wallet</div>
            <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:11, color:"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{myAddress}</div>
          </div>
          <button onClick={copyAddr} style={{ display:"flex",alignItems:"center",gap:4,padding:"5px 10px",border:"1.5px solid var(--border)",borderRadius:"var(--r)",background:"var(--bg-card)",cursor:"pointer",fontSize:11,fontWeight:600,color:"var(--brand)",flexShrink:0 }}>
            {copied ? <><Check size={11}/>Copied!</> : <><Copy size={11}/>Copy</>}
          </button>
          <button onClick={() => { setNewAddr(myAddress.toLowerCase()); setShowAdd(true); }} style={{ display:"flex",alignItems:"center",gap:4,padding:"5px 10px",border:"1.5px solid var(--brand-border)",borderRadius:"var(--r)",background:"var(--brand-muted)",cursor:"pointer",fontSize:11,fontWeight:700,color:"var(--brand)",flexShrink:0 }}>
            Grant to me
          </button>
        </div>
      )}

      {/* Add role form */}
      {showAdd && (
        <div className="card" style={{ padding:"16px", border:"1.5px solid var(--brand-border)", background:"var(--brand-muted)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <h3 style={{ fontFamily:"Outfit,sans-serif", fontSize:14, fontWeight:700, color:"var(--text)" }}>Grant Role</h3>
            <button onClick={() => setShowAdd(false)} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text-4)",display:"flex" }}><X size={14}/></button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div>
              <label style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:5,fontFamily:"Outfit,sans-serif" }}>Wallet Address</label>
              <input value={newAddr} onChange={e => setNewAddr(e.target.value)} placeholder="0x… paste wallet address" className="admin-input" style={{ fontFamily:"JetBrains Mono,monospace", fontSize:12 }}/>
            </div>
            <div>
              <label style={{ fontSize:11,fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:".07em",display:"block",marginBottom:8,fontFamily:"Outfit,sans-serif" }}>Role Level</label>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {ROLES.map(r => (
                  <button key={r.value} onClick={() => setNewRole(r.value)}
                    style={{ padding:"8px 14px",borderRadius:"var(--r)",border:`1.5px solid ${newRole===r.value?r.color:"var(--border)"}`,background:newRole===r.value?`${r.color}12`:"transparent",cursor:"pointer",textAlign:"left",flex:1,minWidth:100 }}>
                    <div style={{ fontSize:12,fontWeight:700,color:newRole===r.value?r.color:"var(--text-2)" }}>{r.label}</div>
                    <div style={{ fontSize:10,color:"var(--text-4)",marginTop:2 }}>{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={grantRole} disabled={adding || !newAddr} className="btn btn-primary" style={{ width:"100%",justifyContent:"center" }}>
              {adding ? "Assigning…" : `Grant ${ROLES.find(r=>r.value===newRole)?.label}`}
            </button>
          </div>
        </div>
      )}

      {error   && <div style={{ padding:"10px 14px",background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.2)",borderRadius:"var(--r-md)",fontSize:13,color:"#dc2626",display:"flex",gap:7 }}><AlertCircle size={14} style={{ flexShrink:0,marginTop:1 }}/>{error}</div>}
      {success && <div style={{ padding:"10px 14px",background:"rgba(5,150,105,.06)",border:"1px solid rgba(5,150,105,.2)",borderRadius:"var(--r-md)",fontSize:13,color:"var(--accent)",display:"flex",gap:7 }}><CheckCircle2 size={14} style={{ flexShrink:0,marginTop:1 }}/>{success}</div>}

      <div style={{ position:"relative" }}>
        <Search size={13} style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--text-4)",pointerEvents:"none" }}/>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by address or username…" className="admin-input" style={{ paddingLeft:34 }}/>
      </div>

      <div className="card" style={{ overflow:"hidden", padding:0 }}>
        {loading ? [1,2].map(i=><div key={i} className="skeleton" style={{ height:56,margin:"8px 16px",borderRadius:"var(--r)" }}/>) :
         !filtered.length ? (
           <div style={{ padding:"48px",textAlign:"center" }}>
             <Shield size={32} style={{ color:"var(--text-4)",marginBottom:12 }}/>
             <p style={{ fontSize:14,fontWeight:600,color:"var(--text-3)",marginBottom:4 }}>No admin roles assigned yet</p>
             <p style={{ fontSize:11,color:"var(--text-4)" }}>Click "Grant Role" to give admin access to a wallet address.</p>
           </div>
         ) : filtered.map(entry => {
           const R = ROLES.find(r=>r.value===entry.role) || ROLES[1];
           return (
             <div key={entry.walletAddress} style={{ padding:"12px 16px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap" }}>
               <div style={{ width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,hsl(${parseInt(entry.walletAddress.slice(2,4)||"0",16)*1.4}deg,65%,55%),hsl(${parseInt(entry.walletAddress.slice(4,6)||"0",16)*1.4}deg,55%,45%))`,flexShrink:0 }}/>
               <div style={{ flex:1,minWidth:100 }}>
                 <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:2 }}>
                   <span style={{ fontSize:11,fontWeight:700,color:R.color,background:`${R.color}12`,padding:"1px 8px",borderRadius:99,border:`1px solid ${R.color}30` }}>{R.label}</span>
                 </div>
                 <div style={{ fontFamily:"JetBrains Mono,monospace",fontSize:11,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{entry.walletAddress}</div>
                 {entry.username && <div style={{ fontSize:10,color:"var(--text-4)" }}>@{entry.username}</div>}
               </div>
               <button onClick={() => revokeRole(entry.walletAddress)} disabled={acting===entry.walletAddress}
                 style={{ display:"flex",alignItems:"center",gap:4,padding:"5px 10px",border:"1px solid rgba(220,38,38,.3)",background:"rgba(220,38,38,.06)",borderRadius:"var(--r)",cursor:"pointer",fontSize:11,fontWeight:600,color:"#dc2626",flexShrink:0 }}>
                 {acting===entry.walletAddress?"Revoking…":<><ShieldOff size={11}/>Revoke</>}
               </button>
             </div>
           );
         })}
      </div>
    </div>
  );
}
