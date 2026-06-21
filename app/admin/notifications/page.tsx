"use client";
import { useState, useEffect } from "react";
import { RefreshCw, Bell, CheckCheck, DollarSign, BookOpen, Users, Zap } from "lucide-react";
import Link from "next/link";

const NOTIF_META: Record<string,{icon:any;color:string}> = {
  sale:             { icon:DollarSign, color:"var(--accent)" },
  payout:           { icon:Zap,        color:"#0284c7"        },
  article_approved: { icon:BookOpen,   color:"var(--brand)"   },
  follow:           { icon:Users,      color:"#7c3aed"        },
  comment:          { icon:Bell,       color:"#d97706"        },
};

export default function NotificationsPage() {
  const [notifs,  setNotifs]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    // Load all recent notifications from DB
    const r = await fetch("/api/admin/notifications").catch(()=>null);
    const d = r ? await r.json().catch(()=>[]) : [];
    setNotifs(Array.isArray(d) ? d : []);
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  function timeAgo(ts:string) {
    const s=(Date.now()-new Date(ts).getTime())/1000;
    if(s<60)return "just now"; if(s<3600)return `${Math.floor(s/60)}m ago`;
    if(s<86400)return `${Math.floor(s/3600)}h ago`; return `${Math.floor(s/86400)}d ago`;
  }

  const unread = notifs.filter(n=>!n.read).length;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10 }}>
        <div>
          <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--text)", letterSpacing:"-.02em" }}>Notifications</h1>
          <p style={{ fontSize:12, color:"var(--text-4)", marginTop:2 }}>{unread} unread · {notifs.length} total</p>
        </div>
        <button onClick={load} disabled={loading} style={{ display:"flex",alignItems:"center",gap:5,padding:"7px 12px",border:"1.5px solid var(--border)",background:"var(--bg-alt)",borderRadius:"var(--r-f)",cursor:"pointer",fontSize:12,fontWeight:600,color:"var(--text-3)" }}>
          <RefreshCw size={12} className={loading?"spin":""}/>Refresh
        </button>
      </div>

      <div className="card" style={{ overflow:"hidden", padding:0 }}>
        {loading ? [1,2,3].map(i=><div key={i} className="skeleton" style={{ height:64,margin:"8px 16px",borderRadius:"var(--r)" }}/>) :
         !notifs.length ? (
           <div style={{ padding:"48px",textAlign:"center" }}>
             <Bell size={32} style={{ color:"var(--text-4)",marginBottom:10 }}/>
             <p style={{ fontSize:14,color:"var(--text-3)" }}>No notifications yet.</p>
             <p style={{ fontSize:12,color:"var(--text-4)",marginTop:4 }}>Notifications appear when articles are sold, comments posted, or payouts processed.</p>
           </div>
         ) : notifs.map((n:any) => {
           const meta = NOTIF_META[n.type] || { icon:Bell, color:"var(--text-4)" };
           const Icon = meta.icon;
           return (
             <div key={n.id} style={{ padding:"13px 16px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"flex-start",gap:12,background:n.read?"transparent":"rgba(109,40,217,.02)" }}>
               {!n.read && <div style={{ width:6,height:6,borderRadius:"50%",background:"var(--brand)",flexShrink:0,marginTop:6 }}/>}
               {n.read  && <div style={{ width:6,height:6,flexShrink:0 }}/>}
               <div style={{ width:32,height:32,borderRadius:"50%",background:"var(--bg-alt)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                 <Icon size={13} style={{ color:meta.color }}/>
               </div>
               <div style={{ flex:1,minWidth:0 }}>
                 <div style={{ fontSize:13,fontWeight:n.read?400:600,color:"var(--text)",marginBottom:2 }}>{n.title}</div>
                 <div style={{ fontSize:12,color:"var(--text-3)",marginBottom:3,lineHeight:1.5 }}>{n.body}</div>
                 <div style={{ display:"flex",gap:10,alignItems:"center" }}>
                   <span style={{ fontSize:10,color:"var(--text-4)" }}>{timeAgo(n.created_at)}</span>
                   {n.link && <Link href={n.link} style={{ fontSize:10,color:"var(--brand)",textDecoration:"none",fontWeight:600 }}>View →</Link>}
                 </div>
               </div>
             </div>
           );
         })}
      </div>
    </div>
  );
}
