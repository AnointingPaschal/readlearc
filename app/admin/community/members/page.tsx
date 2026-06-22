"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Crown, ArrowLeft, Search, RefreshCw, ExternalLink } from "lucide-react";

interface MemberEntry { address:string; spaces:string[]; spaceIds:string[]; owned:string[]; }

function short(a:string){ return a?`${a.slice(0,8)}…${a.slice(-4)}`:"—"; }
function hue(a:string){ return parseInt((a||"0").slice(2,4)||"0",16)*1.4; }

export default function AdminMembersPage() {
  const [members,  setMembers]  = useState<MemberEntry[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");

  useEffect(()=>{
    (async()=>{
      const grps = await fetch("/api/groups?type=all&limit=200").then(r=>r.json()).catch(()=>[]);
      if (!Array.isArray(grps)){setLoading(false);return;}
      const map: Record<string,{spaces:string[];spaceIds:string[];owned:string[]}> = {};
      for (const g of grps) {
        for (const addr of (g.member_addresses||[])) {
          if (!map[addr]) map[addr]={spaces:[],spaceIds:[],owned:[]};
          map[addr].spaces.push(g.name);
          map[addr].spaceIds.push(String(g.id));
          if (addr===g.owner_address) map[addr].owned.push(g.name);
        }
      }
      setMembers(Object.entries(map).map(([address,v])=>({address,...v})).sort((a,b)=>b.spaces.length-a.spaces.length));
      setLoading(false);
    })();
  },[]);

  const filtered = members.filter(m=>
    !search || m.address.includes(search.toLowerCase()) || m.spaces.some(s=>s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{padding:24,maxWidth:960,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,flexWrap:"wrap"}}>
        <Link href="/admin/community" style={{display:"flex",alignItems:"center",gap:4,fontSize:12,color:"var(--brand)",textDecoration:"none"}}><ArrowLeft size={12}/>All Spaces</Link>
        <div style={{width:1,height:16,background:"var(--border)"}}/>
        <div>
          <h1 style={{fontFamily:"Outfit,sans-serif",fontSize:20,fontWeight:900,color:"var(--text)",letterSpacing:"-.02em"}}>All Members</h1>
          <p style={{fontSize:11,color:"var(--text-4)"}}>{members.length} unique members across all spaces</p>
        </div>
      </div>

      <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center"}}>
        <div style={{position:"relative",flex:1,maxWidth:360}}>
          <Search size={13} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"var(--text-4)",pointerEvents:"none"}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by address or space name…"
            style={{width:"100%",padding:"8px 10px 8px 30px",background:"var(--bg-card)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",fontSize:12,color:"var(--text)",outline:"none",boxSizing:"border-box" as const}}/>
        </div>
        <span style={{fontSize:11,color:"var(--text-4)"}}>{filtered.length} members</span>
      </div>

      {loading ? (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>{[...Array(6)].map((_,i)=><div key={i} className="skeleton" style={{height:60,borderRadius:"var(--r-lg)"}}/>)}</div>
      ) : (
        <div className="card" style={{padding:0,overflow:"hidden"}}>
          <div style={{display:"grid",gridTemplateColumns:"200px 1fr 80px",padding:"9px 14px",background:"var(--bg-alt)",borderBottom:"1px solid var(--border)"}}>
            {["Member","Spaces","Owned"].map(h=><div key={h} style={{fontSize:10,fontWeight:700,color:"var(--text-4)",textTransform:"uppercase",letterSpacing:".07em"}}>{h}</div>)}
          </div>
          {filtered.map((m,i)=>(
            <div key={m.address} style={{display:"grid",gridTemplateColumns:"200px 1fr 80px",padding:"10px 14px",borderBottom:i<filtered.length-1?"1px solid var(--border)":"none",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:`hsl(${hue(m.address)}deg,40%,50%)`,flexShrink:0}}/>
                <div>
                  <div style={{fontFamily:"JetBrains Mono,monospace",fontSize:10,fontWeight:700,color:"var(--text)"}}>{short(m.address)}</div>
                  <div style={{fontSize:9,color:"var(--text-4)"}}>{m.spaces.length} space{m.spaces.length!==1?"s":""}</div>
                </div>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {m.spaces.slice(0,4).map((s,j)=>(
                  <Link key={j} href={`/admin/community/${m.spaceIds[j]}`} style={{fontSize:9,fontWeight:600,padding:"2px 7px",borderRadius:99,background:"var(--brand-muted)",color:"var(--brand)",border:"1px solid var(--brand-border)",textDecoration:"none",display:"flex",alignItems:"center",gap:3}}>
                    {s.length>20?s.slice(0,20)+"…":s}<ExternalLink size={7}/>
                  </Link>
                ))}
                {m.spaces.length>4&&<span style={{fontSize:9,color:"var(--text-4)"}}>+{m.spaces.length-4} more</span>}
              </div>
              <div>
                {m.owned.length>0&&(
                  <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:99,background:"rgba(202,138,4,.1)",color:"#ca8a04",border:"1px solid rgba(202,138,4,.2)"}}>
                    <Crown size={8}/>{m.owned.length}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
