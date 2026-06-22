"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users, Globe, Lock, Trash2, Eye, Search, RefreshCw,
  ChevronDown, MessageSquare, Crown, CheckCircle2, AlertCircle,
  Plus, Filter,
} from "lucide-react";

interface Group {
  id: string; name: string; description: string; type: "public"|"private";
  category: string; owner_address: string; member_count: number;
  post_count: number; tags: string[]; member_addresses: string[];
  banner_image?: string; created_at: string;
}

const lbl = (s: string) => s ? `${s.slice(0,6)}…${s.slice(-4)}` : "—";
const CATS = ["All","Science","Technology","Medicine","Business","Humanities","Law","Education","Engineering","Environment","Research","General"];

export default function AdminCommunityPage() {
  const [groups,   setGroups]   = useState<Group[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [catFilter,  setCatFilter]  = useState("All");
  const [deleting, setDeleting] = useState<string|null>(null);
  const [msg,      setMsg]      = useState("");
  const [error,    setError]    = useState("");

  async function load() {
    setLoading(true);
    const r = await fetch("/api/groups?type=all&limit=200").then(r=>r.json()).catch(()=>[]);
    setGroups(Array.isArray(r) ? r : []);
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  async function deleteGroup(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This removes all posts and members permanently.`)) return;
    setDeleting(id);
    const r = await fetch(`/api/groups/${id}`, { method:"DELETE" });
    if (r.ok) { setMsg(`Deleted "${name}"`); load(); }
    else { const d = await r.json(); setError(d.error || "Delete failed"); }
    setDeleting(null);
    setTimeout(()=>{ setMsg(""); setError(""); }, 3000);
  }

  const filtered = groups.filter(g => {
    if (typeFilter !== "all" && g.type !== typeFilter) return false;
    if (catFilter !== "All" && g.category !== catFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return g.name.toLowerCase().includes(q) || (g.description||"").toLowerCase().includes(q) || g.owner_address.includes(q);
    }
    return true;
  });

  const publicCount  = groups.filter(g=>g.type==="public").length;
  const privateCount = groups.filter(g=>g.type==="private").length;
  const totalMembers = groups.reduce((s,g)=>s+(g.member_count||0),0);
  const totalPosts   = groups.reduce((s,g)=>s+(g.post_count||0),0);

  return (
    <div style={{padding:24,maxWidth:1100,margin:"0 auto"}}>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{fontFamily:"Outfit,sans-serif",fontSize:22,fontWeight:900,color:"var(--text)",letterSpacing:"-.02em",marginBottom:3}}>Contribute Spaces</h1>
          <p style={{fontSize:12,color:"var(--text-4)"}}>Manage all public and private community spaces</p>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={load} style={{display:"flex",alignItems:"center",gap:5,padding:"8px 12px",background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",cursor:"pointer",fontSize:12,color:"var(--text-3)",fontWeight:600}}>
            <RefreshCw size={13}/>Refresh
          </button>
          <Link href="/contribute/create" style={{display:"flex",alignItems:"center",gap:5,padding:"8px 14px",background:"var(--brand)",border:"none",borderRadius:"var(--r)",textDecoration:"none",fontSize:12,color:"white",fontWeight:700}}>
            <Plus size={13}/>New Space
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10,marginBottom:20}}>
        {[
          {label:"Total Spaces", v:groups.length, color:"var(--brand)"},
          {label:"Public",       v:publicCount,   color:"#059669"},
          {label:"Private",      v:privateCount,  color:"#7c3aed"},
          {label:"Total Members",v:totalMembers,  color:"#0284c7"},
          {label:"Total Posts",  v:totalPosts,    color:"#d97706"},
        ].map(s=>(
          <div key={s.label} className="card" style={{padding:"12px 14px"}}>
            <div style={{fontFamily:"Outfit,sans-serif",fontSize:24,fontWeight:900,color:s.color,lineHeight:1}}>{s.v}</div>
            <div style={{fontSize:10,fontWeight:600,color:"var(--text-4)",textTransform:"uppercase",letterSpacing:".06em",marginTop:4}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Banners */}
      {msg   && <div style={{padding:"10px 14px",background:"rgba(5,150,105,.07)",border:"1px solid rgba(5,150,105,.2)",borderRadius:"var(--r-md)",marginBottom:12,fontSize:13,color:"var(--accent)",display:"flex",gap:7}}><CheckCircle2 size={14}/>{msg}</div>}
      {error && <div style={{padding:"10px 14px",background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.2)",borderRadius:"var(--r-md)",marginBottom:12,fontSize:13,color:"#dc2626",display:"flex",gap:7}}><AlertCircle size={14}/>{error}</div>}

      {/* Filters */}
      <div className="card" style={{padding:"12px 14px",marginBottom:14,display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:1,minWidth:180}}>
          <Search size={13} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"var(--text-4)",pointerEvents:"none"}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, description, owner…"
            style={{width:"100%",padding:"8px 10px 8px 30px",background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",fontSize:12,color:"var(--text)",outline:"none",boxSizing:"border-box" as const}}/>
        </div>
        <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}
          style={{padding:"8px 10px",background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",fontSize:12,color:"var(--text)",outline:"none",cursor:"pointer"}}>
          <option value="all">All Types</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
        <select value={catFilter} onChange={e=>setCatFilter(e.target.value)}
          style={{padding:"8px 10px",background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",fontSize:12,color:"var(--text)",outline:"none",cursor:"pointer"}}>
          {CATS.map(c=><option key={c}>{c}</option>)}
        </select>
        <span style={{fontSize:11,color:"var(--text-4)",whiteSpace:"nowrap"}}>{filtered.length} spaces</span>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>{[...Array(5)].map((_,i)=><div key={i} className="skeleton" style={{height:62,borderRadius:"var(--r-lg)"}}/>)}</div>
      ) : !filtered.length ? (
        <div className="card" style={{padding:"48px 20px",textAlign:"center"}}>
          <Users size={36} style={{color:"var(--text-4)",marginBottom:12}}/>
          <p style={{fontSize:15,fontWeight:700,color:"var(--text)",fontFamily:"Outfit,sans-serif",marginBottom:5}}>No spaces found</p>
          <p style={{fontSize:12,color:"var(--text-4)",marginBottom:16}}>Try adjusting your filters or seed some data.</p>
          <Link href="/admin/seed" style={{display:"inline-flex",alignItems:"center",gap:5,padding:"8px 16px",background:"var(--brand)",borderRadius:"var(--r)",textDecoration:"none",fontSize:12,color:"white",fontWeight:700}}>
            Go to Seed Data
          </Link>
        </div>
      ) : (
        <div className="card" style={{padding:0,overflow:"hidden"}}>
          {/* Table header */}
          <div style={{display:"grid",gridTemplateColumns:"2fr 90px 80px 70px 70px 110px 90px",gap:0,padding:"9px 14px",background:"var(--bg-alt)",borderBottom:"1px solid var(--border)"}}>
            {["Space","Type","Category","Members","Posts","Owner","Actions"].map(h=>(
              <div key={h} style={{fontSize:10,fontWeight:700,color:"var(--text-4)",textTransform:"uppercase",letterSpacing:".07em",fontFamily:"Outfit,sans-serif"}}>{h}</div>
            ))}
          </div>
          {filtered.map((g,i)=>(
            <div key={g.id} style={{display:"grid",gridTemplateColumns:"2fr 90px 80px 70px 70px 110px 90px",gap:0,padding:"11px 14px",borderBottom:i<filtered.length-1?"1px solid var(--border)":"none",alignItems:"center",transition:"background .1s"}}
              onMouseEnter={e=>(e.currentTarget.style.background="var(--bg-alt)")}
              onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
              {/* Name */}
              <div style={{minWidth:0}}>
                <div style={{fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:700,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.name}</div>
                {g.description && <div style={{fontSize:10,color:"var(--text-4)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:1}}>{g.description.slice(0,60)}{g.description.length>60?"…":""}</div>}
              </div>
              {/* Type */}
              <div>
                <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:99,background:g.type==="private"?"rgba(124,58,237,.1)":"rgba(5,150,105,.1)",color:g.type==="private"?"#7c3aed":"#059669",border:`1px solid ${g.type==="private"?"rgba(124,58,237,.2)":"rgba(5,150,105,.2)"}`}}>
                  {g.type==="private"?<Lock size={8}/>:<Globe size={8}/>}{g.type}
                </span>
              </div>
              {/* Category */}
              <div style={{fontSize:11,color:"var(--text-3)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.category}</div>
              {/* Members */}
              <div style={{fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:700,color:"var(--text)",display:"flex",alignItems:"center",gap:4}}>
                <Users size={11} style={{color:"var(--text-4)"}}/>
                {g.member_count}
              </div>
              {/* Posts */}
              <div style={{fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:700,color:"var(--text)",display:"flex",alignItems:"center",gap:4}}>
                <MessageSquare size={11} style={{color:"var(--text-4)"}}/>
                {g.post_count}
              </div>
              {/* Owner */}
              <div style={{fontFamily:"JetBrains Mono,monospace",fontSize:10,color:"var(--text-4)",display:"flex",alignItems:"center",gap:4}}>
                <Crown size={9} style={{color:"#ca8a04",flexShrink:0}}/>
                {lbl(g.owner_address)}
              </div>
              {/* Actions */}
              <div style={{display:"flex",gap:5}}>
                <Link href={`/contribute/${g.id}`} title="View space"
                  style={{width:28,height:28,borderRadius:"var(--r)",border:"1px solid var(--border)",background:"var(--bg-alt)",display:"flex",alignItems:"center",justifyContent:"center",textDecoration:"none",color:"var(--text-3)",transition:"all .12s"}}>
                  <Eye size={12}/>
                </Link>
                <Link href={`/admin/community/${g.id}`} title="Manage space"
                  style={{width:28,height:28,borderRadius:"var(--r)",border:"1px solid var(--brand-border)",background:"var(--brand-muted)",display:"flex",alignItems:"center",justifyContent:"center",textDecoration:"none",color:"var(--brand)",transition:"all .12s"}}>
                  <Users size={12}/>
                </Link>
                <button onClick={()=>deleteGroup(g.id, g.name)} disabled={deleting===g.id} title="Delete space"
                  style={{width:28,height:28,borderRadius:"var(--r)",border:"1px solid rgba(220,38,38,.25)",background:"rgba(220,38,38,.07)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#dc2626",transition:"all .12s"}}>
                  {deleting===g.id?<RefreshCw size={11} style={{animation:"spin .7s linear infinite"}}/>:<Trash2 size={12}/>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
