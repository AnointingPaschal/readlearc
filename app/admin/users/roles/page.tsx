"use client";
import { useState, useEffect } from "react";
import { Search, Shield, ShieldCheck, ShieldAlert, ShieldOff, UserX, RefreshCw, Plus, X } from "lucide-react";

const ROLES = [
  { value:3, label:"Super Admin", desc:"Full access including owner functions", icon:ShieldAlert, color:"#dc2626" },
  { value:2, label:"Admin",       desc:"Manage content, users and settings",    icon:ShieldCheck, color:"var(--brand)" },
  { value:1, label:"Moderator",   desc:"Approve/reject articles and comments",  icon:Shield,      color:"#d97706" },
  { value:0, label:"User",        desc:"Regular user — no admin access",        icon:ShieldOff,   color:"var(--text-4)" },
];

interface RoleEntry {
  walletAddress: string;
  role:          number;
  roleName:      string;
  username?:     string;
  displayName?:  string;
  grantedAt:     string;
}

export default function AdminRolesPage() {
  const [roles,    setRoles]    = useState<RoleEntry[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [newAddr,  setNewAddr]  = useState("");
  const [newRole,  setNewRole]  = useState(1);
  const [adding,   setAdding]   = useState(false);
  const [acting,   setActing]   = useState("");
  const [error,    setError]    = useState("");
  const [showAdd,  setShowAdd]  = useState(false);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/roles");
    const d = await r.json();
    setRoles(Array.isArray(d) ? d : []);
    setLoading(false);
  }

  useEffect(()=>{ load(); },[]);

  async function setRole(address: string, role: number) {
    setActing(address); setError("");
    const r = await fetch("/api/admin/roles", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ walletAddress:address, role }),
    });
    const d = await r.json();
    if (!r.ok) { setError(d.error); setActing(""); return; }
    await load();
    setActing("");
  }

  async function addRole() {
    if (!newAddr.startsWith("0x") || newAddr.length < 10) {
      setError("Enter a valid wallet address"); return;
    }
    setAdding(true); setError("");
    const r = await fetch("/api/admin/roles", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ walletAddress:newAddr, role:newRole }),
    });
    const d = await r.json();
    if (!r.ok) { setError(d.error); setAdding(false); return; }
    setNewAddr(""); setShowAdd(false);
    await load();
    setAdding(false);
  }

  const filtered = roles.filter(r =>
    !search ||
    r.walletAddress.toLowerCase().includes(search.toLowerCase()) ||
    r.username?.toLowerCase().includes(search.toLowerCase()) ||
    r.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleConfig = (role: number) => ROLES.find(r=>r.value===role) || ROLES[3];

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:10 }}>
        <div>
          <h1 style={{ fontFamily:"Outfit,sans-serif",fontSize:22,fontWeight:900,color:"var(--text)",letterSpacing:"-.02em" }}>Admin Roles</h1>
          <p style={{ fontSize:12,color:"var(--text-4)",marginTop:2 }}>{roles.length} users with elevated permissions</p>
        </div>
        <div style={{ display:"flex",gap:8 }}>
          <button onClick={load} disabled={loading} style={{ display:"flex",alignItems:"center",gap:5,padding:"7px 13px",border:"1.5px solid var(--border)",background:"var(--bg-alt)",borderRadius:"var(--r-f)",cursor:"pointer",fontSize:12,fontWeight:600,color:"var(--text-3)" }}>
            <RefreshCw size={12} className={loading?"spin":""}/>Refresh
          </button>
          <button onClick={()=>setShowAdd(v=>!v)} className="btn btn-primary btn-sm" style={{ gap:5 }}>
            {showAdd?<X size={13}/>:<Plus size={13}/>}{showAdd?"Cancel":"Grant Role"}
          </button>
        </div>
      </div>

      {/* Role legend */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:8 }}>
        {ROLES.filter(r=>r.value>0).map(r=>(
          <div key={r.value} className="card" style={{ padding:"11px 13px",borderLeft:`3px solid ${r.color}` }}>
            <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:3 }}>
              <r.icon size={13} style={{ color:r.color }}/>
              <span style={{ fontFamily:"Outfit,sans-serif",fontSize:12,fontWeight:700,color:r.color }}>{r.label}</span>
            </div>
            <p style={{ fontSize:10,color:"var(--text-4)",lineHeight:1.5 }}>{r.desc}</p>
          </div>
        ))}
      </div>

      {/* Add role form */}
      {showAdd && (
        <div className="card" style={{ padding:"16px" }}>
          <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:700,color:"var(--text)",marginBottom:12 }}>Grant Role to Wallet</h3>
          <div style={{ display:"grid",gap:10 }}>
            <input value={newAddr} onChange={e=>setNewAddr(e.target.value)} className="admin-input" placeholder="0x wallet address"
              style={{ fontFamily:"JetBrains Mono,monospace",fontSize:12 }}/>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6 }}>
              {ROLES.filter(r=>r.value>0).map(r=>(
                <button key={r.value} onClick={()=>setNewRole(r.value)} style={{ padding:"9px",borderRadius:"var(--r)",border:`1.5px solid ${newRole===r.value?r.color:"var(--border)"}`,background:newRole===r.value?`${r.color}12`:"transparent",cursor:"pointer",textAlign:"center",transition:"all .15s" }}>
                  <div style={{ fontFamily:"Outfit,sans-serif",fontSize:12,fontWeight:700,color:newRole===r.value?r.color:"var(--text-2)" }}>{r.label}</div>
                </button>
              ))}
            </div>
            {error&&<p style={{ fontSize:12,color:"#dc2626" }}>{error}</p>}
            <button onClick={addRole} disabled={adding||!newAddr} className="btn btn-primary btn-sm" style={{ justifyContent:"center" }}>
              {adding?<><div style={{ width:11,height:11,border:"1.5px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%"}} className="spin"/>Granting…</>:"Grant Role"}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ position:"relative" }}>
        <Search size={13} style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--text-4)",pointerEvents:"none" }}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by address or username…" className="admin-input" style={{ paddingLeft:34 }}/>
      </div>

      {/* Roles list */}
      {loading ? [1,2,3].map(i=><div key={i} className="skeleton" style={{ height:70,borderRadius:"var(--r-lg)" }}/>) :
       !filtered.length ? (
        <div className="card" style={{ padding:"40px",textAlign:"center" }}>
          <Shield size={28} style={{ color:"var(--text-4)",marginBottom:10 }}/>
          <p style={{ fontSize:14,fontWeight:600,color:"var(--text-3)" }}>No admin roles assigned yet</p>
          <p style={{ fontSize:12,color:"var(--text-4)",marginTop:4 }}>Click "Grant Role" to give admin access to a wallet address.</p>
        </div>
       ) : filtered.map(r=>{
          const cfg = getRoleConfig(r.role);
          return (
            <div key={r.walletAddress} className="card" style={{ padding:"14px 16px",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap",borderLeft:`3px solid ${cfg.color}` }}>
              <div style={{ width:40,height:40,borderRadius:"50%",background:`linear-gradient(135deg,hsl(${parseInt(r.walletAddress.slice(2,4),16)*1.4}deg,65%,55%),hsl(${parseInt(r.walletAddress.slice(4,6),16)*1.4}deg,55%,45%))`,flexShrink:0 }}/>
              <div style={{ flex:1,minWidth:180 }}>
                <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:3 }}>
                  <span style={{ fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:700,color:"var(--text)" }}>
                    {r.displayName || r.username || "Unknown User"}
                  </span>
                  {r.username && <span style={{ fontSize:10,color:"var(--text-4)" }}>@{r.username}</span>}
                </div>
                <div style={{ fontFamily:"JetBrains Mono,monospace",fontSize:10,color:"var(--text-4)" }}>{r.walletAddress}</div>
                <div style={{ display:"flex",alignItems:"center",gap:5,marginTop:4 }}>
                  <cfg.icon size={11} style={{ color:cfg.color }}/>
                  <span style={{ fontSize:11,fontWeight:700,color:cfg.color }}>{cfg.label}</span>
                  <span style={{ fontSize:10,color:"var(--text-4)" }}>since {new Date(r.grantedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div style={{ display:"flex",gap:5,flexShrink:0,flexWrap:"wrap" }}>
                {ROLES.filter(rl=>rl.value!==r.role).map(rl=>(
                  <button key={rl.value} onClick={()=>setRole(r.walletAddress,rl.value)} disabled={!!acting}
                    style={{ display:"flex",alignItems:"center",gap:3,padding:"5px 9px",borderRadius:"var(--r)",border:`1px solid ${rl.color}30`,background:`${rl.color}09`,fontSize:10,fontWeight:700,color:rl.color,cursor:"pointer",opacity:acting===r.walletAddress?.5:1 }}>
                    {rl.value===0?<UserX size={10}/>:<rl.icon size={10}/>}
                    {rl.value===0?"Remove":rl.label}
                  </button>
                ))}
              </div>
            </div>
          );
       })}
    </div>
  );
}
