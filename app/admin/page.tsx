"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, DollarSign, Users, Zap, TrendingUp, Shield, RefreshCw, CheckCircle2, Clock, Brain, Star, ArrowRight, AlertTriangle } from "lucide-react";

interface Stats {
  totalArticles: number; pendingArticles: number; approvedArticles: number; featuredArticles: number;
  totalUsers: number; totalReads: number;
  pendingEarnings: number; totalEarnings: number;
  recentArticles: any[];
}

export default function AdminDashboard() {
  const [stats,   setStats]   = useState<Stats|null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const [artRes, earnRes] = await Promise.all([
        fetch("/api/admin/articles?limit=200"),
        fetch("/api/admin/earnings").catch(() => ({ json: () => ({}) })),
      ]);
      const arts:any[]  = await artRes.json().catch(() => []);
      const earn:any    = await (earnRes as any).json().catch(() => ({}));

      if (!Array.isArray(arts)) { setError("Failed to load articles"); setLoading(false); return; }

      const writers = new Set(arts.map((a:any) => a.authorAddress));
      const totalReads = arts.reduce((s:number, a:any) => s + (a.reads||0), 0);

      setStats({
        totalArticles:    arts.length,
        pendingArticles:  arts.filter((a:any) => a.status === "pending").length,
        approvedArticles: arts.filter((a:any) => a.status === "approved").length,
        featuredArticles: arts.filter((a:any) => a.status === "featured").length,
        totalUsers:       writers.size,
        totalReads,
        pendingEarnings:  earn.totalPending || 0,
        totalEarnings:    (earn.totalPending||0) + (earn.totalPaid||0),
        recentArticles:   arts.slice(0, 6),
      });
    } catch(e:any) { setError(e.message); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const KPI = stats ? [
    { label:"Total Articles",  value:stats.totalArticles,               icon:BookOpen,   color:"var(--brand)",  href:"/admin/content/moderation" },
    { label:"Pending Review",  value:stats.pendingArticles,             icon:Clock,      color:"#d97706",       href:"/admin/content/moderation" },
    { label:"Total Writers",   value:stats.totalUsers,                  icon:Users,      color:"#0284c7",       href:"/admin/users/writers" },
    { label:"Total Reads",     value:stats.totalReads.toLocaleString(), icon:TrendingUp, color:"#7c3aed",       href:"/admin/content/moderation" },
    { label:"Pending Payouts", value:`$${stats.pendingEarnings.toFixed(4)}`, icon:DollarSign, color:"#d97706", href:"/admin/earnings" },
    { label:"Total Earned",    value:`$${stats.totalEarnings.toFixed(4)}`,   icon:Zap,    color:"var(--accent)",href:"/admin/earnings" },
  ] : [];

  const STATUS_ICON: Record<string,any> = {
    pending:  { icon:Clock,        color:"#d97706" },
    approved: { icon:CheckCircle2, color:"var(--accent)" },
    featured: { icon:Star,         color:"#ca8a04" },
    rejected: { icon:AlertTriangle,color:"#dc2626" },
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div>
          <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--text)", letterSpacing:"-.02em" }}>Dashboard</h1>
          <p style={{ fontSize:12, color:"var(--text-4)", marginTop:2 }}>Readlearc admin overview</p>
        </div>
        <button onClick={load} disabled={loading} style={{ display:"flex",alignItems:"center",gap:5,padding:"7px 13px",border:"1.5px solid var(--border)",background:"var(--bg-alt)",borderRadius:"var(--r-f)",cursor:"pointer",fontSize:12,fontWeight:600,color:"var(--text-3)" }}>
          <RefreshCw size={12} className={loading?"spin":""}/>Refresh
        </button>
      </div>

      {error && (
        <div style={{ padding:"12px 14px",background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.2)",borderRadius:"var(--r-md)",fontSize:13,color:"#dc2626",display:"flex",gap:8 }}>
          <AlertTriangle size={14} style={{ flexShrink:0,marginTop:1 }}/>{error}
          {error.includes("table") && <span> — Run <code>db/schema-all.sql</code> in Supabase SQL Editor.</span>}
        </div>
      )}

      {/* KPI grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:12 }}>
        {loading ? [1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height:88, borderRadius:"var(--r-lg)" }}/>) :
         KPI.map(k => (
          <Link key={k.label} href={k.href} style={{ textDecoration:"none" }}>
            <div className="card card-hover" style={{ padding:"16px 14px" }}>
              <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:8 }}>
                <div style={{ width:28,height:28,borderRadius:8,background:`${k.color}14`,display:"flex",alignItems:"center",justifyContent:"center" }}>
                  <k.icon size={13} style={{ color:k.color }}/>
                </div>
                <span style={{ fontSize:10,fontWeight:700,color:"var(--text-4)",textTransform:"uppercase",letterSpacing:".07em",fontFamily:"Outfit,sans-serif" }}>{k.label}</span>
              </div>
              <div style={{ fontFamily:"Outfit,sans-serif",fontSize:24,fontWeight:900,color:k.color,lineHeight:1 }}>{k.value}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Content overview + Quick actions */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>

        {/* Recent articles */}
        <div className="card" style={{ overflow:"hidden", padding:0 }}>
          <div style={{ padding:"13px 16px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
            <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:700,color:"var(--text)" }}>Recent Articles</h3>
            <Link href="/admin/content/moderation" style={{ fontSize:11,color:"var(--brand)",textDecoration:"none",display:"flex",alignItems:"center",gap:3 }}>
              View all <ArrowRight size={10}/>
            </Link>
          </div>
          {loading ? [1,2,3].map(i=><div key={i} className="skeleton" style={{ height:50,margin:"8px 16px",borderRadius:"var(--r)" }}/>) :
           !stats?.recentArticles.length ? <div style={{ padding:"24px",textAlign:"center",color:"var(--text-4)",fontSize:12 }}>No articles yet.</div> :
           stats.recentArticles.map((a:any) => {
             const S = STATUS_ICON[a.status] || STATUS_ICON.pending;
             return (
               <div key={a.id} style={{ padding:"10px 16px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:10 }}>
                 <S.icon size={13} style={{ color:S.color,flexShrink:0 }}/>
                 <div style={{ flex:1,minWidth:0 }}>
                   <div style={{ fontSize:12,fontWeight:600,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{a.title}</div>
                   <div style={{ fontSize:10,color:"var(--text-4)",marginTop:1 }}>{a.authorShort} · {a.reads} reads</div>
                 </div>
                 <span style={{ fontSize:10,fontWeight:700,color:S.color,flexShrink:0,textTransform:"capitalize" }}>{a.status}</span>
               </div>
             );
           })}
        </div>

        {/* Quick actions */}
        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:700,color:"var(--text)",marginBottom:2 }}>Quick Actions</h3>
          {[
            { href:"/admin/content/moderation", icon:Clock,   label:"Review Pending Articles",  desc:`${stats?.pendingArticles||0} waiting for review`,            color:"#d97706" },
            { href:"/admin/earnings",           icon:DollarSign,label:"Process Payouts",         desc:`$${stats?.pendingEarnings?.toFixed(4)||"0.0000"} pending`,    color:"var(--accent)" },
            { href:"/admin/settings",           icon:Brain,   label:"AI & Settings",             desc:"Configure AI model, treasury, prices",                       color:"var(--brand)" },
            { href:"/admin/settings/branding",  icon:Zap,     label:"Brand & Colors",            desc:"Customize site appearance",                                  color:"#7c3aed" },
            { href:"/admin/users/roles",        icon:Shield,  label:"Manage Admin Roles",        desc:"Grant/revoke admin access",                                  color:"#0284c7" },
          ].map(a => (
            <Link key={a.href} href={a.href} style={{ textDecoration:"none" }}>
              <div className="card card-hover" style={{ padding:"12px 14px",display:"flex",alignItems:"center",gap:12 }}>
                <div style={{ width:34,height:34,borderRadius:10,background:`${a.color}12`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  <a.icon size={15} style={{ color:a.color }}/>
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:13,fontWeight:700,color:"var(--text)" }}>{a.label}</div>
                  <div style={{ fontSize:11,color:"var(--text-4)",marginTop:1 }}>{a.desc}</div>
                </div>
                <ArrowRight size={12} style={{ color:"var(--text-4)",flexShrink:0 }}/>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Status breakdown */}
      {stats && (
        <div className="card" style={{ padding:"16px" }}>
          <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:700,color:"var(--text)",marginBottom:14 }}>Article Status Breakdown</h3>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:10 }}>
            {[
              { label:"Approved",  v:stats.approvedArticles,  c:"var(--accent)", status:"approved" },
              { label:"Featured",  v:stats.featuredArticles,  c:"#ca8a04",       status:"featured" },
              { label:"Pending",   v:stats.pendingArticles,   c:"#d97706",       status:"pending"  },
              { label:"Total",     v:stats.totalArticles,     c:"var(--brand)",  status:"all"      },
            ].map(s => (
              <Link key={s.label} href={`/admin/content/moderation?status=${s.status}`} style={{ textDecoration:"none" }}>
                <div style={{ padding:"12px",background:"var(--bg-alt)",borderRadius:"var(--r-lg)",border:"1.5px solid var(--border)",textAlign:"center",cursor:"pointer",transition:"border-color .15s" }}
                  onMouseEnter={e=>(e.currentTarget as any).style.borderColor=s.c}
                  onMouseLeave={e=>(e.currentTarget as any).style.borderColor="var(--border)"}>
                  <div style={{ fontFamily:"Outfit,sans-serif",fontSize:24,fontWeight:900,color:s.c,marginBottom:3 }}>{s.v}</div>
                  <div style={{ fontSize:11,fontWeight:600,color:"var(--text-4)" }}>{s.label}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
