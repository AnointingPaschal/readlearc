"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, Trash2, RefreshCw, Search, CheckCircle2, AlertCircle, ArrowLeft, ExternalLink } from "lucide-react";

interface Post {
  id:string; group_id:string; author_address:string; content:string;
  type:string; likes:number; created_at:string; group_name?:string;
}

function short(a:string){ return a?`${a.slice(0,6)}…${a.slice(-4)}`:"—"; }
function hue(a:string){ return parseInt((a||"0").slice(2,4)||"0",16)*1.4; }

export default function AdminPostsPage() {
  const [posts,    setPosts]   = useState<Post[]>([]);
  const [groups,   setGroups]  = useState<Record<string,string>>({});
  const [loading,  setLoading] = useState(true);
  const [search,   setSearch]  = useState("");
  const [typeFilter,setTypeFilter]=useState("all");
  const [deleting, setDeleting]= useState<string|null>(null);
  const [msg,      setMsg]     = useState("");
  const [error,    setError]   = useState("");

  async function load() {
    setLoading(true);
    const grps = await fetch("/api/groups?type=all&limit=100").then(r=>r.json()).catch(()=>[]);
    const gMap: Record<string,string> = {};
    const allPosts: Post[] = [];

    if (Array.isArray(grps)) {
      for (const g of grps) {
        gMap[String(g.id)] = g.name;
        const ps = await fetch(`/api/groups/${g.id}/posts`).then(r=>r.json()).catch(()=>[]);
        if (Array.isArray(ps)) {
          ps.forEach((p:any) => allPosts.push({...p, group_id:String(g.id), group_name:g.name}));
        }
      }
    }

    setGroups(gMap);
    setPosts(allPosts.sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime()));
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  async function deletePost(id:string) {
    if (!confirm("Delete this post permanently?")) return;
    setDeleting(id);
    // Call the group posts API — we need to delete by post id
    // Use admin group-posts route
    const r = await fetch(`/api/admin/group-posts/${id}`,{method:"DELETE"});
    if (r.ok){ setMsg("Post deleted"); load(); }
    else { setError("Delete failed — make sure /api/admin/group-posts/[id] exists"); }
    setDeleting(null);
    setTimeout(()=>{setMsg("");setError("");},3000);
  }

  const filtered = posts.filter(p=>{
    if (typeFilter!=="all"&&p.type!==typeFilter) return false;
    if (search) {
      const q=search.toLowerCase();
      return p.content.toLowerCase().includes(q)||p.author_address.includes(q)||(p.group_name||"").toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div style={{padding:24,maxWidth:1000,margin:"0 auto"}}>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Link href="/admin/community" style={{display:"flex",alignItems:"center",gap:4,fontSize:12,color:"var(--brand)",textDecoration:"none"}}><ArrowLeft size={13}/>All Spaces</Link>
          <div style={{width:1,height:16,background:"var(--border)"}}/>
          <div>
            <h1 style={{fontFamily:"Outfit,sans-serif",fontSize:20,fontWeight:900,color:"var(--text)",letterSpacing:"-.02em"}}>All Posts</h1>
            <p style={{fontSize:11,color:"var(--text-4)"}}>{posts.length} total posts across all spaces</p>
          </div>
        </div>
        <button onClick={load} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",cursor:"pointer",fontSize:12,color:"var(--text-3)",fontWeight:600}}>
          <RefreshCw size={12}/>Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        {[
          {label:"Total Posts",v:posts.length,color:"var(--brand)"},
          {label:"Discussions", v:posts.filter(p=>p.type==="discussion").length,color:"#0284c7"},
          {label:"Announcements",v:posts.filter(p=>p.type==="announcement").length,color:"#dc2626"},
        ].map(s=>(
          <div key={s.label} className="card" style={{padding:"10px 14px",display:"flex",gap:10,alignItems:"center"}}>
            <span style={{fontFamily:"Outfit,sans-serif",fontSize:20,fontWeight:900,color:s.color}}>{s.v}</span>
            <span style={{fontSize:11,color:"var(--text-4)",fontWeight:600}}>{s.label}</span>
          </div>
        ))}
      </div>

      {msg   && <div style={{padding:"9px 14px",background:"rgba(5,150,105,.07)",border:"1px solid rgba(5,150,105,.2)",borderRadius:"var(--r-md)",marginBottom:12,fontSize:13,color:"var(--accent)",display:"flex",gap:7}}><CheckCircle2 size={13}/>{msg}</div>}
      {error && <div style={{padding:"9px 14px",background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.2)",borderRadius:"var(--r-md)",marginBottom:12,fontSize:13,color:"#dc2626",display:"flex",gap:7}}><AlertCircle size={13}/>{error}</div>}

      {/* Filters */}
      <div className="card" style={{padding:"10px 14px",marginBottom:14,display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:1,minWidth:180}}>
          <Search size={13} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"var(--text-4)",pointerEvents:"none"}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search posts…"
            style={{width:"100%",padding:"7px 10px 7px 30px",background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",fontSize:12,color:"var(--text)",outline:"none",boxSizing:"border-box" as const}}/>
        </div>
        <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}
          style={{padding:"7px 10px",background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",fontSize:12,color:"var(--text)",outline:"none",cursor:"pointer"}}>
          <option value="all">All Types</option>
          <option value="discussion">Discussions</option>
          <option value="announcement">Announcements</option>
        </select>
        <span style={{fontSize:11,color:"var(--text-4)",whiteSpace:"nowrap"}}>{filtered.length} posts</span>
      </div>

      {loading ? (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>{[...Array(5)].map((_,i)=><div key={i} className="skeleton" style={{height:80,borderRadius:"var(--r-lg)"}}/>)}</div>
      ) : !filtered.length ? (
        <div className="card" style={{padding:"40px 20px",textAlign:"center"}}>
          <MessageSquare size={32} style={{color:"var(--text-4)",marginBottom:10}}/>
          <p style={{color:"var(--text-3)"}}>No posts found</p>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {filtered.map(p=>(
            <div key={p.id} className="card" style={{padding:"12px 14px"}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:`hsl(${hue(p.author_address)}deg,40%,50%)`,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5,flexWrap:"wrap"}}>
                    <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:10,fontWeight:700,color:"var(--text)"}}>{short(p.author_address)}</span>
                    <span style={{fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:99,background:p.type==="announcement"?"rgba(220,38,38,.1)":"var(--brand-muted)",color:p.type==="announcement"?"#dc2626":"var(--brand)",border:`1px solid ${p.type==="announcement"?"rgba(220,38,38,.2)":"var(--brand-border)"}`}}>{p.type}</span>
                    {p.group_name&&(
                      <Link href={`/admin/community/${p.group_id}`} style={{fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:99,background:"rgba(2,132,199,.1)",color:"#0284c7",border:"1px solid rgba(2,132,199,.2)",textDecoration:"none",display:"flex",alignItems:"center",gap:3}}>
                        {p.group_name}<ExternalLink size={8}/>
                      </Link>
                    )}
                    <span style={{fontSize:10,color:"var(--text-4)",marginLeft:"auto",whiteSpace:"nowrap"}}>{new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                  <p style={{fontSize:12,color:"var(--text)",lineHeight:1.6,display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical" as any,overflow:"hidden"}}>{p.content}</p>
                </div>
                <button onClick={()=>deletePost(p.id)} disabled={deleting===p.id}
                  style={{width:28,height:28,borderRadius:"var(--r)",border:"1px solid rgba(220,38,38,.25)",background:"rgba(220,38,38,.07)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#dc2626",flexShrink:0}}>
                  {deleting===p.id?<RefreshCw size={11} style={{animation:"spin .7s linear infinite"}}/>:<Trash2 size={12}/>}
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
