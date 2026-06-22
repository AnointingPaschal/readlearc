"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Users, Globe, Lock, Crown, Trash2, RefreshCw,
  MessageSquare, Tag, CheckCircle2, AlertCircle, Eye, Ban, ChevronRight,
} from "lucide-react";

interface Group {
  id:string; name:string; description:string; type:string; category:string;
  owner_address:string; member_addresses:string[]; member_count:number;
  post_count:number; rules:string; tags:string[]; banner_image?:string; created_at:string;
}
interface Post {
  id:string; group_id:string; author_address:string; content:string;
  type:string; likes:number; created_at:string;
}

function short(a:string){ return a?`${a.slice(0,8)}…${a.slice(-4)}`:"—"; }
function hue(a:string){ return parseInt((a||"0").slice(2,4)||"0",16)*1.4; }

export default function AdminGroupDetailPage() {
  const { id } = useParams<{id:string}>();
  const [group,   setGroup]   = useState<Group|null>(null);
  const [posts,   setPosts]   = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState<"overview"|"posts"|"members">("overview");
  const [msg,     setMsg]     = useState("");
  const [error,   setError]   = useState("");

  async function load() {
    setLoading(true);
    const [g,p] = await Promise.all([
      fetch(`/api/groups/${id}`).then(r=>r.json()).catch(()=>null),
      fetch(`/api/groups/${id}/posts`).then(r=>r.json()).catch(()=>[]),
    ]);
    setGroup(g||null);
    setPosts(Array.isArray(p)?p:[]);
    setLoading(false);
  }
  useEffect(()=>{ load(); },[id]);

  async function deletePost(pid:string) {
    if (!confirm("Delete this post?")) return;
    const r = await fetch(`/api/admin/group-posts/${pid}`,{method:"DELETE"});
    if (r.ok){ setMsg("Post deleted"); load(); }
    else { const d=await r.json(); setError(d.error||"Failed"); }
    setTimeout(()=>{setMsg("");setError("");},3000);
  }

  async function removeMember(addr:string) {
    if (!group) return;
    if (!confirm(`Remove ${short(addr)} from this space?`)) return;
    const r = await fetch(`/api/groups/${id}/members`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({memberAddress:addr,action:"leave"})});
    if (r.ok){ setMsg("Member removed"); load(); }
    else { const d=await r.json(); setError(d.error||"Failed"); }
    setTimeout(()=>{setMsg("");setError("");},3000);
  }

  async function updateType(type:string) {
    const r = await fetch(`/api/groups/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({type})});
    if (r.ok){ setMsg(`Changed to ${type}`); load(); }
    else { const d=await r.json(); setError(d.error||"Failed"); }
    setTimeout(()=>{setMsg("");setError("");},3000);
  }

  if (loading) return (
    <div style={{padding:24,maxWidth:900,margin:"0 auto"}}>
      <div style={{height:40,marginBottom:20}} className="skeleton"/>
      {[...Array(4)].map((_,i)=><div key={i} className="skeleton" style={{height:64,marginBottom:10,borderRadius:"var(--r-lg)"}}/>)}
    </div>
  );
  if (!group) return (
    <div style={{padding:24,textAlign:"center"}}>
      <AlertCircle size={40} style={{color:"var(--text-4)",marginBottom:12}}/>
      <p style={{color:"var(--text-3)"}}>Space not found</p>
      <Link href="/admin/community" style={{color:"var(--brand)"}}>← Back</Link>
    </div>
  );

  return (
    <div style={{padding:24,maxWidth:960,margin:"0 auto"}}>

      {/* Breadcrumb */}
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:20,fontSize:12,color:"var(--text-4)"}}>
        <Link href="/admin/community" style={{color:"var(--brand)",textDecoration:"none",display:"flex",alignItems:"center",gap:4}}><ArrowLeft size={12}/>Spaces</Link>
        <ChevronRight size={11}/>
        <span style={{color:"var(--text)"}}>{group.name}</span>
      </div>

      {/* Group header card */}
      <div className="card" style={{overflow:"hidden",marginBottom:16,padding:0}}>
        <div style={{height:80,background:group.banner_image?undefined:`linear-gradient(135deg,hsl(${hue(group.id)}deg,40%,25%),hsl(${hue(group.id)+60}deg,35%,18%))`,position:"relative"}}>
          {group.banner_image&&<img src={group.banner_image} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.3)"}}/>
          <div style={{position:"absolute",top:10,right:12,display:"flex",gap:6}}>
            {/* Type toggle */}
            <button onClick={()=>updateType(group.type==="public"?"private":"public")}
              style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:99,background:"rgba(0,0,0,.5)",border:"1px solid rgba(255,255,255,.2)",backdropFilter:"blur(8px)",cursor:"pointer",color:"white",fontSize:10,fontWeight:700}}>
              {group.type==="private"?<Lock size={9}/>:<Globe size={9}/>}
              {group.type==="private"?"Make Public":"Make Private"}
            </button>
            <Link href={`/contribute/${group.id}`} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:99,background:"rgba(0,0,0,.5)",border:"1px solid rgba(255,255,255,.2)",backdropFilter:"blur(8px)",textDecoration:"none",color:"white",fontSize:10,fontWeight:700}}>
              <Eye size={9}/>View Live
            </Link>
          </div>
        </div>
        <div style={{padding:"14px 18px",display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <h2 style={{fontFamily:"Outfit,sans-serif",fontSize:18,fontWeight:900,color:"var(--text)",letterSpacing:"-.02em"}}>{group.name}</h2>
              <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:99,background:group.type==="private"?"rgba(124,58,237,.1)":"rgba(5,150,105,.1)",color:group.type==="private"?"#7c3aed":"#059669",border:`1px solid ${group.type==="private"?"rgba(124,58,237,.2)":"rgba(5,150,105,.2)"}`,display:"flex",alignItems:"center",gap:4}}>
                {group.type==="private"?<Lock size={8}/>:<Globe size={8}/>}{group.type}
              </span>
              <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:99,background:"var(--brand-muted)",color:"var(--brand)",border:"1px solid var(--brand-border)"}}>{group.category}</span>
            </div>
            {group.description&&<p style={{fontSize:12,color:"var(--text-3)",lineHeight:1.6,maxWidth:560}}>{group.description}</p>}
          </div>
          <div style={{display:"flex",gap:14,fontSize:12,color:"var(--text-4)"}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:"Outfit,sans-serif",fontSize:22,fontWeight:900,color:"var(--text)"}}>{group.member_count}</div>
              <div style={{fontSize:9,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em"}}>Members</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:"Outfit,sans-serif",fontSize:22,fontWeight:900,color:"var(--text)"}}>{group.post_count}</div>
              <div style={{fontSize:9,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em"}}>Posts</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:"JetBrains Mono,monospace",fontSize:11,fontWeight:700,color:"var(--brand)",marginBottom:2}}>{short(group.owner_address)}</div>
              <div style={{fontSize:9,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em"}}>Owner</div>
            </div>
          </div>
        </div>
      </div>

      {/* Banners */}
      {msg   && <div style={{padding:"9px 14px",background:"rgba(5,150,105,.07)",border:"1px solid rgba(5,150,105,.2)",borderRadius:"var(--r-md)",marginBottom:12,fontSize:13,color:"var(--accent)",display:"flex",gap:7}}><CheckCircle2 size={13}/>{msg}</div>}
      {error && <div style={{padding:"9px 14px",background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.2)",borderRadius:"var(--r-md)",marginBottom:12,fontSize:13,color:"#dc2626",display:"flex",gap:7}}><AlertCircle size={13}/>{error}</div>}

      {/* Tabs */}
      <div style={{display:"flex",gap:0,borderBottom:"2px solid var(--border)",marginBottom:16}}>
        {(["overview","posts","members"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"8px 18px",border:"none",cursor:"pointer",fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:700,background:"transparent",color:tab===t?"var(--brand)":"var(--text-4)",borderBottom:`2px solid ${tab===t?"var(--brand)":"transparent"}`,marginBottom:-2,transition:"all .15s",textTransform:"capitalize"}}>
            {t === "posts" ? `Posts (${posts.length})` : t === "members" ? `Members (${group.member_count})` : t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab==="overview" && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <div className="card" style={{padding:"14px 16px"}}>
            <div style={{fontSize:11,fontWeight:800,color:"var(--text-4)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>Space Info</div>
            {[
              ["Created",new Date(group.created_at).toLocaleDateString()],
              ["Type",group.type],
              ["Category",group.category],
              ["Owner",short(group.owner_address)],
              ["Tags",group.tags?.join(", ")||"—"],
            ].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid var(--border)",fontSize:12}}>
                <span style={{color:"var(--text-4)",fontWeight:600}}>{k}</span>
                <span style={{color:"var(--text)",fontWeight:700,fontFamily:k==="Owner"?"JetBrains Mono,monospace":"inherit",fontSize:k==="Owner"?10:12}}>{v}</span>
              </div>
            ))}
          </div>
          {group.rules && (
            <div className="card" style={{padding:"14px 16px"}}>
              <div style={{fontSize:11,fontWeight:800,color:"var(--text-4)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>Rules</div>
              <pre style={{fontSize:12,color:"var(--text-3)",lineHeight:1.7,whiteSpace:"pre-wrap",margin:0,fontFamily:"inherit"}}>{group.rules}</pre>
            </div>
          )}
        </div>
      )}

      {/* Posts */}
      {tab==="posts" && (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {!posts.length ? (
            <div className="card" style={{padding:"36px 20px",textAlign:"center"}}>
              <MessageSquare size={30} style={{color:"var(--text-4)",marginBottom:10}}/>
              <p style={{color:"var(--text-3)",fontSize:13}}>No posts yet</p>
            </div>
          ) : posts.map(p=>(
            <div key={p.id} className="card" style={{padding:"12px 14px"}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:8}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:`hsl(${hue(p.author_address)}deg,40%,50%)`,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                    <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:10,fontWeight:700,color:"var(--text)"}}>{short(p.author_address)}</span>
                    <span style={{fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:99,background:p.type==="announcement"?"rgba(220,38,38,.1)":"var(--brand-muted)",color:p.type==="announcement"?"#dc2626":"var(--brand)",border:`1px solid ${p.type==="announcement"?"rgba(220,38,38,.2)":"var(--brand-border)"}`}}>{p.type}</span>
                    <span style={{fontSize:10,color:"var(--text-4)",marginLeft:"auto"}}>{new Date(p.created_at).toLocaleString()}</span>
                  </div>
                  <p style={{fontSize:12,color:"var(--text)",lineHeight:1.65,whiteSpace:"pre-wrap"}}>{p.content}</p>
                </div>
                <button onClick={()=>deletePost(p.id)} title="Delete post"
                  style={{width:28,height:28,borderRadius:"var(--r)",border:"1px solid rgba(220,38,38,.25)",background:"rgba(220,38,38,.07)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#dc2626",flexShrink:0}}>
                  <Trash2 size={12}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Members */}
      {tab==="members" && (
        <div className="card" style={{padding:0,overflow:"hidden"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 120px 90px",padding:"9px 14px",background:"var(--bg-alt)",borderBottom:"1px solid var(--border)"}}>
            {["Address","Role","Action"].map(h=><div key={h} style={{fontSize:10,fontWeight:700,color:"var(--text-4)",textTransform:"uppercase",letterSpacing:".07em"}}>{h}</div>)}
          </div>
          {(group.member_addresses||[]).map((addr,i)=>(
            <div key={addr} style={{display:"grid",gridTemplateColumns:"1fr 120px 90px",padding:"10px 14px",borderBottom:i<(group.member_addresses.length-1)?"1px solid var(--border)":"none",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:`hsl(${hue(addr)}deg,40%,50%)`,flexShrink:0}}/>
                <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:11,color:"var(--text)"}}>{short(addr)}</span>
              </div>
              <div>
                {addr===group.owner_address?(
                  <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:99,background:"rgba(202,138,4,.1)",color:"#ca8a04",border:"1px solid rgba(202,138,4,.2)"}}>
                    <Crown size={9}/>Owner
                  </span>
                ):(
                  <span style={{fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:99,background:"var(--bg-alt)",color:"var(--text-4)",border:"1px solid var(--border)"}}>Member</span>
                )}
              </div>
              <div>
                {addr!==group.owner_address&&(
                  <button onClick={()=>removeMember(addr)} title="Remove member"
                    style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",border:"1px solid rgba(220,38,38,.25)",borderRadius:"var(--r)",background:"rgba(220,38,38,.07)",cursor:"pointer",color:"#dc2626",fontSize:10,fontWeight:600}}>
                    <Ban size={10}/>Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
