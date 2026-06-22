"use client";
import { useState, useEffect } from "react";
import {
  Database, Play, RotateCcw, CheckCircle2, AlertCircle, Loader,
  BookOpen, Users, MessageSquare, Heart, FileText, UserCheck,
  Link, FlaskConical, Zap, ChevronDown, ChevronUp, Info,
} from "lucide-react";

interface Counts { articles:number; groups:number; group_posts:number; comments:number; reactions:number; read_receipts:number; follows:number; profiles:number; }
interface Result  { inserted?:number; error?:string; skipped?:string; }

const TABLES = [
  { key:"articles",    icon:BookOpen,      label:"Articles",       desc:"14 articles across 7 disciplines: Web3, AI, DeFi, Medicine, Biology, Environment, Neuroscience", color:"#7c3aed" },
  { key:"groups",      icon:Users,         label:"Contribute Spaces", desc:"8 spaces (public & private) + 30 posts across ML, Health, DeFi, Environment, Neuro, Law, Genomics, Urban", color:"#0284c7" },
  { key:"follows",     icon:UserCheck,     label:"Follows",        desc:"8 follow relationships between seed authors", color:"#059669" },
];

const ICONS: Record<string, any> = {
  articles: BookOpen, groups: Users, group_posts: MessageSquare,
  comments: MessageSquare, reactions: Heart, read_receipts: FileText,
  follows: UserCheck, profiles: UserCheck,
};

function CountBadge({ n, label }: { n: number; label: string }) {
  return (
    <div style={{ padding:"10px 14px", background:"var(--bg-alt)", borderRadius:"var(--r)", border:"1px solid var(--border)", display:"flex", flexDirection:"column", gap:2 }}>
      <span style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--text)", lineHeight:1 }}>{n.toLocaleString()}</span>
      <span style={{ fontSize:10, color:"var(--text-4)", fontWeight:600, textTransform:"uppercase", letterSpacing:".06em" }}>{label}</span>
    </div>
  );
}

export default function SeedPage() {
  const [counts,   setCounts]   = useState<Counts|null>(null);
  const [results,  setResults]  = useState<Record<string,Result>>({});
  const [running,  setRunning]  = useState<string|null>(null);
  const [reset,    setReset]    = useState(false);
  const [expand,   setExpand]   = useState<string|null>(null);
  const [log,      setLog]      = useState<string[]>([]);
  const [seeded,   setSeeded]   = useState(false);

  async function loadCounts() {
    const r = await fetch("/api/seed").then(r => r.json()).catch(() => ({}));
    if (r.counts) setCounts(r.counts);
  }
  useEffect(() => { loadCounts(); }, []);

  function addLog(msg: string) {
    setLog(p => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...p.slice(0,99)]);
  }

  async function seedTable(tableKey: string) {
    setRunning(tableKey);
    addLog(`Starting seed: ${tableKey}${reset ? " (with reset)" : ""}`);
    try {
      const r = await fetch("/api/seed", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ tables:[tableKey], reset }),
      });
      const d = await r.json();
      const tableResults = d.results || {};
      setResults(p => ({ ...p, ...tableResults }));
      Object.entries(tableResults).forEach(([k, v]: any) => {
        if (v?.error) addLog(`❌ ${k}: ${v.error}`);
        else addLog(`✅ ${k}: inserted ${v?.inserted ?? 0} rows`);
      });
    } catch (e: any) {
      addLog(`❌ Error: ${e.message}`);
    }
    setRunning(null);
    await loadCounts();
  }

  async function seedAll() {
    setRunning("all");
    setLog([]);
    addLog(`Seeding all tables${reset ? " (full reset first)" : " (append mode)"}…`);
    try {
      const r = await fetch("/api/seed", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ tables:"all", reset }),
      });
      const d = await r.json();
      const tableResults = d.results || {};
      setResults(tableResults);
      Object.entries(tableResults).forEach(([k, v]: any) => {
        if (v?.error) addLog(`❌ ${k}: ${v.error}`);
        else addLog(`✅ ${k}: ${v?.inserted ?? 0} rows`);
      });
      setSeeded(true);
      addLog("🎉 All done!");
    } catch (e: any) {
      addLog(`❌ Fatal error: ${e.message}`);
    }
    setRunning(null);
    await loadCounts();
  }

  const totalRows = counts ? Object.values(counts).reduce((s,n) => s+n, 0) : 0;
  const isRunning = running !== null;

  return (
    <div style={{ padding:"24px", maxWidth:900, margin:"0 auto" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:5 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"var(--brand-muted)", border:"1.5px solid var(--brand-border)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Database size={20} style={{ color:"var(--brand)" }} />
            </div>
            <div>
              <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--text)", letterSpacing:"-.02em" }}>Seed Data</h1>
              <p style={{ fontSize:12, color:"var(--text-4)" }}>Populate the database with realistic test data</p>
            </div>
          </div>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
          {/* Reset toggle */}
          <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", padding:"8px 12px", background:"var(--bg-alt)", border:`1.5px solid ${reset?"#dc2626":"var(--border)"}`, borderRadius:"var(--r)", transition:"all .15s" }}>
            <div style={{ width:36, height:20, borderRadius:99, background:reset?"#dc2626":"var(--bg-card)", border:"1.5px solid var(--border)", position:"relative", transition:"background .2s", cursor:"pointer" }}
              onClick={() => setReset(v => !v)}>
              <div style={{ width:14, height:14, borderRadius:"50%", background:"white", position:"absolute", top:2, left:reset?18:2, transition:"left .2s", boxShadow:"0 1px 3px rgba(0,0,0,.3)" }} />
            </div>
            <span style={{ fontSize:12, fontWeight:700, color:reset?"#dc2626":"var(--text-3)" }}>
              {reset ? "Reset mode — clears first" : "Append mode"}
            </span>
          </label>

          <button onClick={seedAll} disabled={isRunning !== null}
            style={{ display:"flex", alignItems:"center", gap:7, padding:"10px 20px", background:"var(--brand)", border:"none", borderRadius:"var(--r-lg)", cursor:isRunning !== null?"not-allowed":"pointer", color:"white", fontFamily:"Outfit,sans-serif", fontWeight:800, fontSize:13, opacity:isRunning !== null ? .6 : 1 }}>
            {running==="all" ? <><Loader size={14} style={{ animation:"spin 1s linear infinite" }}/> Seeding…</> : <><Zap size={14}/>Seed Everything</>}
          </button>
        </div>
      </div>

      {seeded && (
        <div style={{ padding:"12px 16px", background:"rgba(5,150,105,.07)", border:"1px solid rgba(5,150,105,.2)", borderRadius:"var(--r-md)", marginBottom:20, display:"flex", gap:8, alignItems:"center", fontSize:13, fontWeight:600, color:"var(--accent)" }}>
          <CheckCircle2 size={15} />Database seeded successfully! Visit <a href="/" style={{ color:"var(--brand)", textDecoration:"none" }}>homepage</a> or <a href="/explore" style={{ color:"var(--brand)", textDecoration:"none" }}>explore</a> to see the data.
        </div>
      )}

      {/* Current counts */}
      <div className="card" style={{ padding:"16px 20px", marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:14 }}>
          <Info size={13} style={{ color:"var(--brand)" }} />
          <span style={{ fontFamily:"Outfit,sans-serif", fontSize:11, fontWeight:800, color:"var(--text)", textTransform:"uppercase", letterSpacing:".07em" }}>Current Database State</span>
          <button onClick={loadCounts} style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", color:"var(--text-4)", display:"flex", padding:3 }}><RotateCcw size={13} /></button>
        </div>
        {counts ? (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))", gap:8 }}>
            {(Object.entries(counts) as [string, number][]).map(([k, n]) => {
              const Icon = ICONS[k] || Database;
              return (
                <div key={k} style={{ padding:"10px 12px", background:"var(--bg-alt)", borderRadius:"var(--r)", border:"1px solid var(--border)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:4 }}>
                    <Icon size={11} style={{ color:"var(--brand)", flexShrink:0 }} />
                    <span style={{ fontFamily:"Outfit,sans-serif", fontSize:18, fontWeight:900, color:"var(--text)" }}>{n}</span>
                  </div>
                  <div style={{ fontSize:9, color:"var(--text-4)", fontWeight:600, textTransform:"uppercase", letterSpacing:".05em" }}>{k.replace(/_/g," ")}</div>
                </div>
              );
            })}
            <div style={{ padding:"10px 12px", background:"var(--brand-muted)", borderRadius:"var(--r)", border:"1px solid var(--brand-border)" }}>
              <div style={{ fontFamily:"Outfit,sans-serif", fontSize:18, fontWeight:900, color:"var(--brand)", marginBottom:4 }}>{totalRows}</div>
              <div style={{ fontSize:9, color:"var(--brand)", fontWeight:700, textTransform:"uppercase", letterSpacing:".05em" }}>Total rows</div>
            </div>
          </div>
        ) : (
          <div style={{ display:"flex", gap:8 }}>{[...Array(6)].map((_,i) => <div key={i} className="skeleton" style={{ height:60, flex:1, borderRadius:"var(--r)" }} />)}</div>
        )}
      </div>

      {/* Seed cards */}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {TABLES.map(t => {
          const res = results[t.key];
          const sub: Record<string,Result> = {};
          Object.entries(results).forEach(([k,v]) => { if (k !== t.key && (k.startsWith(t.key.replace("groups","group"))||k==="receipts"||k==="comments"||k==="reactions")) sub[k] = v as Result; });
          const isThis = running === t.key;
          const hasResult = res || Object.keys(sub).length > 0;
          const allOk = hasResult && !res?.error && Object.values(sub).every(v => !v?.error);

          return (
            <div key={t.key} className="card" style={{ overflow:"hidden", border:`1.5px solid ${allOk?"rgba(5,150,105,.3)":hasResult&&!allOk?"rgba(220,38,38,.2)":"var(--border)"}` }}>
              <div style={{ padding:"14px 16px", display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:38, height:38, borderRadius:10, background:`${t.color}15`, border:`1.5px solid ${t.color}30`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <t.icon size={18} style={{ color:t.color }} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
                    <h3 style={{ fontFamily:"Outfit,sans-serif", fontSize:14, fontWeight:800, color:"var(--text)" }}>{t.label}</h3>
                    {allOk && <CheckCircle2 size={13} style={{ color:"var(--accent)" }} />}
                    {hasResult && !allOk && <AlertCircle size={13} style={{ color:"#dc2626" }} />}
                  </div>
                  <p style={{ fontSize:11, color:"var(--text-4)", lineHeight:1.4 }}>{t.desc}</p>
                </div>
                <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                  {hasResult && (
                    <button onClick={() => setExpand(expand === t.key ? null : t.key)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-4)", padding:6, display:"flex" }}>
                      {expand === t.key ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  )}
                  <button onClick={() => seedTable(t.key)} disabled={isRunning !== null || isThis}
                    style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", background:isThis?"var(--bg-alt)":t.color, border:`1.5px solid ${t.color}`, borderRadius:"var(--r-lg)", cursor:isRunning||isThis?"not-allowed":"pointer", color:isThis?"var(--text-3)":"white", fontSize:11, fontWeight:700, fontFamily:"Outfit,sans-serif", whiteSpace:"nowrap" }}>
                    {isThis ? <><Loader size={11} style={{ animation:"spin 1s linear infinite" }}/>Seeding…</> : <><Play size={11}/>Seed</>}
                  </button>
                </div>
              </div>

              {/* Result details */}
              {expand === t.key && hasResult && (
                <div style={{ borderTop:"1px solid var(--border)", padding:"12px 16px", background:"var(--bg-alt)", display:"flex", flexWrap:"wrap", gap:8 }}>
                  {[["articles", res], ...Object.entries(sub)].filter(([,v])=>v).map(([k, v]: any) => (
                    <div key={k} style={{ padding:"6px 10px", borderRadius:"var(--r)", background:v?.error?"rgba(220,38,38,.08)":"rgba(5,150,105,.08)", border:`1px solid ${v?.error?"rgba(220,38,38,.2)":"rgba(5,150,105,.2)"}` }}>
                      <span style={{ fontSize:10, fontWeight:700, color:v?.error?"#dc2626":"var(--accent)" }}>
                        {v?.error ? `❌ ${k}: ${v.error}` : `✅ ${k}: ${v?.inserted ?? 0} inserted`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div className="card" style={{ marginTop:20, padding:"14px 16px" }}>
          <div style={{ fontFamily:"Outfit,sans-serif", fontSize:11, fontWeight:800, color:"var(--text)", textTransform:"uppercase", letterSpacing:".07em", marginBottom:10 }}>Activity Log</div>
          <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:10, color:"var(--text-3)", lineHeight:1.8, maxHeight:220, overflowY:"auto" }}>
            {log.map((l,i) => <div key={i} style={{ color:l.includes("❌")?"#dc2626":l.includes("✅")||l.includes("🎉")?"var(--accent)":"var(--text-4)" }}>{l}</div>)}
          </div>
        </div>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
