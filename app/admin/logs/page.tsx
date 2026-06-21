"use client";
import { useState, useEffect } from "react";
import { RefreshCw, ExternalLink, BookOpen, Users, UserCheck, Bell, DollarSign, Filter } from "lucide-react";
import Link from "next/link";

const TYPE_META: Record<string,{label:string;color:string;bg:string;icon:any}> = {
  sale:             { label:"Article Sale",      color:"var(--accent)", bg:"rgba(5,150,105,.08)",   icon:DollarSign },
  follow:           { label:"New Follow",        color:"var(--brand)",  bg:"var(--brand-muted)",    icon:Users      },
  comment:          { label:"New Comment",       color:"#7c3aed",       bg:"rgba(124,58,237,.08)",  icon:BookOpen   },
  payout:           { label:"Payout Processed",  color:"#0284c7",       bg:"rgba(2,132,199,.08)",   icon:DollarSign },
  article_approved: { label:"Article Approved",  color:"var(--accent)", bg:"rgba(5,150,105,.08)",   icon:BookOpen   },
  reaction:         { label:"Reaction",          color:"#d97706",       bg:"rgba(217,119,6,.08)",   icon:Bell       },
};

export default function LogsPage() {
  const [logs,    setLogs]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("All");

  async function load() {
    setLoading(true);
    const r = await fetch("/api/activity").catch(()=>null);
    const d = r ? await r.json().catch(()=>[]) : [];
    setLogs(Array.isArray(d) ? d : []);
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  const types  = ["All", ...Array.from(new Set(logs.map(l=>l.action_type)))];
  const visible = filter==="All" ? logs : logs.filter(l=>l.action_type===filter);

  function timeAgo(ts:string) {
    const s = (Date.now()-new Date(ts).getTime())/1000;
    if(s<60) return "just now"; if(s<3600) return `${Math.floor(s/60)}m ago`;
    if(s<86400) return `${Math.floor(s/3600)}h ago`; return `${Math.floor(s/86400)}d ago`;
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10 }}>
        <div>
          <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--text)", letterSpacing:"-.02em" }}>Activity Logs</h1>
          <p style={{ fontSize:12, color:"var(--text-4)", marginTop:2 }}>{logs.length} events recorded</p>
        </div>
        <button onClick={load} disabled={loading} style={{ display:"flex",alignItems:"center",gap:5,padding:"7px 12px",border:"1.5px solid var(--border)",background:"var(--bg-alt)",borderRadius:"var(--r-f)",cursor:"pointer",fontSize:12,fontWeight:600,color:"var(--text-3)" }}>
          <RefreshCw size={12} className={loading?"spin":""}/>Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {types.map(t=>(
          <button key={t} onClick={()=>setFilter(t)} style={{ padding:"4px 11px",borderRadius:"var(--r-f)",fontSize:11,fontWeight:600,cursor:"pointer",border:`1.5px solid ${filter===t?"var(--brand)":"var(--border)"}`,background:filter===t?"var(--brand-muted)":"transparent",color:filter===t?"var(--brand)":"var(--text-3)",transition:"all .15s" }}>
            {t==="All"?t:TYPE_META[t]?.label||t}
          </button>
        ))}
      </div>

      <div className="card" style={{ overflow:"hidden", padding:0 }}>
        {loading ? [1,2,3,4,5].map(i=><div key={i} className="skeleton" style={{ height:56,margin:"8px 16px",borderRadius:"var(--r)" }}/>) :
         !visible.length ? <div style={{ padding:"48px",textAlign:"center",color:"var(--text-4)",fontSize:13 }}>No activity logs yet.</div> :
         visible.map((log:any,i:number) => {
           const meta = TYPE_META[log.action_type] || { label:log.action_type, color:"var(--text-3)", bg:"var(--bg-alt)", icon:Bell };
           const Icon = meta.icon;
           return (
             <div key={i} style={{ padding:"12px 16px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"flex-start", gap:12 }}>
               <div style={{ width:32,height:32,borderRadius:"50%",background:meta.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2 }}>
                 <Icon size={13} style={{ color:meta.color }}/>
               </div>
               <div style={{ flex:1, minWidth:0 }}>
                 <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap", marginBottom:3 }}>
                   <span style={{ fontSize:11,fontWeight:700,color:meta.color,background:meta.bg,padding:"2px 7px",borderRadius:"var(--r-f)" }}>{meta.label}</span>
                   <span style={{ fontSize:10,color:"var(--text-4)" }}>{timeAgo(log.created_at)}</span>
                 </div>
                 <div style={{ fontSize:12,color:"var(--text-2)",marginBottom:log.article_id?3:0 }}>
                   <span style={{ fontFamily:"JetBrains Mono,monospace",fontSize:10,color:"var(--text-4)" }}>{log.actor_address?.slice(0,10)}…</span>
                   {log.target_address && <> → <span style={{ fontFamily:"JetBrains Mono,monospace",fontSize:10,color:"var(--text-4)" }}>{log.target_address.slice(0,10)}…</span></>}
                 </div>
                 {log.articles?.title && (
                   <Link href={`/article/${log.article_id}`} style={{ fontSize:11,color:"var(--brand)",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:3 }}>
                     {log.articles.title.slice(0,60)}{log.articles.title.length>60?"…":""} <ExternalLink size={9}/>
                   </Link>
                 )}
               </div>
             </div>
           );
         })}
      </div>
    </div>
  );
}
