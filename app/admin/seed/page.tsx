"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Database, Play, RotateCcw, CheckCircle2, AlertCircle, Loader,
  BookOpen, Users, MessageSquare, Heart, FileText, UserCheck,
  Zap, ChevronDown, ChevronUp, Info, Copy, Terminal, Table,
} from "lucide-react";

interface Counts { articles:number; groups:number; group_posts:number; comments:number; reactions:number; read_receipts:number; follows:number; profiles:number; }
interface TableCheck { exists:boolean; error?:string; }

const GROUPS_SQL = `-- Run this in Supabase → SQL Editor

CREATE TABLE IF NOT EXISTS groups (
  id               BIGSERIAL PRIMARY KEY,
  name             TEXT        NOT NULL,
  description      TEXT        DEFAULT '',
  type             TEXT        NOT NULL DEFAULT 'public',
  category         TEXT        NOT NULL DEFAULT 'General',
  owner_address    TEXT        NOT NULL,
  banner_image     TEXT,
  member_addresses TEXT[]      NOT NULL DEFAULT '{}',
  member_count     INTEGER     NOT NULL DEFAULT 1,
  post_count       INTEGER     NOT NULL DEFAULT 0,
  rules            TEXT        DEFAULT '',
  tags             TEXT[]      DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_posts (
  id             BIGSERIAL PRIMARY KEY,
  group_id       BIGINT      NOT NULL,
  author_address TEXT        NOT NULL,
  content        TEXT        NOT NULL,
  article_id     BIGINT,
  type           TEXT        NOT NULL DEFAULT 'discussion',
  likes          INTEGER     NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  address        TEXT PRIMARY KEY,
  display_name   TEXT,
  bio            TEXT,
  avatar         TEXT,
  website        TEXT,
  twitter        TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`;

const SEED_TABLES = [
  { key:"articles",    icon:BookOpen,   label:"Articles",     color:"#7c3aed", desc:"14 research + general articles across 7 disciplines" },
  { key:"groups",      icon:Users,      label:"Contribute Spaces", color:"#0284c7", desc:"8 spaces (5 public, 3 private) + 30 posts across ML, Health, DeFi, Law, Neuro" },
  { key:"follows",     icon:UserCheck,  label:"Follows",      color:"#059669", desc:"8 follow relationships between seed authors" },
];

export default function SeedPage() {
  const [counts,     setCounts]     = useState<Counts|null>(null);
  const [tableCheck, setTableCheck] = useState<Record<string,TableCheck>>({});
  const [results,    setResults]    = useState<Record<string,any>>({});
  const [running,    setRunning]    = useState<string|null>(null);
  const [reset,      setReset]      = useState(false);
  const [showSQL,    setShowSQL]    = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [log,        setLog]        = useState<string[]>([]);
  const [done,       setDone]       = useState(false);

  const loadCounts = useCallback(async () => {
    const [cr, tr] = await Promise.all([
      fetch("/api/seed").then(r=>r.json()).catch(()=>({})),
      fetch("/api/admin/migrate").then(r=>r.json()).catch(()=>({})),
    ]);
    if (cr.counts) setCounts(cr.counts);
    if (tr.tables) setTableCheck(tr.tables);
  }, []);

  useEffect(() => { loadCounts(); }, [loadCounts]);

  function addLog(msg:string) { setLog(p=>[`[${new Date().toLocaleTimeString()}] ${msg}`,...p.slice(0,99)]); }

  async function runSeed(tables:string|string[]) {
    const key = Array.isArray(tables) ? tables[0] : tables;
    setRunning(key);
    addLog(`Seeding: ${key}${reset?" (reset mode)":""}`);
    try {
      const r = await fetch("/api/seed",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({tables,reset})});
      const d = await r.json();
      const res = d.results || {};
      setResults(p=>({...p,...res}));
      if (d.error) { addLog(`❌ ${d.error}`); }
      else {
        Object.entries(res).forEach(([k,v]:any)=>{
          if (v?.error) addLog(`❌ ${k}: ${v.error}`);
          else addLog(`✅ ${k}: ${v?.inserted??0} rows inserted`);
        });
      }
    } catch(e:any) { addLog(`❌ ${e.message}`); }
    setRunning(null);
    await loadCounts();
  }

  async function seedAll() {
    setRunning("all"); setLog([]); setDone(false);
    addLog(`Seeding all tables${reset?" (with reset)":""}…`);
    try {
      const r = await fetch("/api/seed",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({tables:"all",reset})});
      const d = await r.json();
      const res = d.results || {};
      setResults(res);
      if (d.error) { addLog(`❌ Fatal: ${d.error}`); }
      else {
        Object.entries(res).forEach(([k,v]:any)=>{
          if (v?.error) addLog(`❌ ${k}: ${v.error}`);
          else addLog(`✅ ${k}: ${v?.inserted??0} rows`);
        });
        setDone(true);
        addLog("🎉 Done!");
      }
    } catch(e:any) { addLog(`❌ ${e.message}`); }
    setRunning(null);
    await loadCounts();
  }

  function copySQL() {
    navigator.clipboard.writeText(GROUPS_SQL);
    setCopied(true); setTimeout(()=>setCopied(false),2000);
  }

  const missingTables = Object.entries(tableCheck).filter(([,v])=>!v.exists).map(([k])=>k);
  const totalRows = counts ? Object.values(counts).reduce((s,n)=>s+n,0) : 0;
  const isRunning = running !== null;

  return (
    <div style={{padding:24,maxWidth:860,margin:"0 auto"}}>

      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:40,height:40,borderRadius:12,background:"var(--brand-muted)",border:"1.5px solid var(--brand-border)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Database size={20} style={{color:"var(--brand)"}}/>
          </div>
          <div>
            <h1 style={{fontFamily:"Outfit,sans-serif",fontSize:22,fontWeight:900,color:"var(--text)",letterSpacing:"-.02em"}}>Seed Data</h1>
            <p style={{fontSize:12,color:"var(--text-4)"}}>Populate the database with realistic test data</p>
          </div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"8px 12px",background:"var(--bg-alt)",border:`1.5px solid ${reset?"#dc2626":"var(--border)"}`,borderRadius:"var(--r)"}}>
            <div style={{width:36,height:20,borderRadius:99,background:reset?"#dc2626":"var(--bg)",border:"1.5px solid var(--border)",position:"relative",cursor:"pointer"}}
              onClick={()=>setReset(v=>!v)}>
              <div style={{width:14,height:14,borderRadius:"50%",background:"white",position:"absolute",top:2,left:reset?18:2,transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.3)"}}/>
            </div>
            <span style={{fontSize:12,fontWeight:700,color:reset?"#dc2626":"var(--text-3)"}}>{reset?"Reset mode":"Append mode"}</span>
          </label>
          <button onClick={seedAll} disabled={isRunning}
            style={{display:"flex",alignItems:"center",gap:7,padding:"10px 20px",background:"var(--brand)",border:"none",borderRadius:"var(--r-lg)",cursor:isRunning?"not-allowed":"pointer",color:"white",fontFamily:"Outfit,sans-serif",fontWeight:800,fontSize:13,opacity:isRunning?.6:1}}>
            {running==="all"?<><Loader size={14} style={{animation:"spin 1s linear infinite"}}/>Seeding…</>:<><Zap size={14}/>Seed Everything</>}
          </button>
        </div>
      </div>

      {done && (
        <div style={{padding:"12px 16px",background:"rgba(5,150,105,.07)",border:"1px solid rgba(5,150,105,.2)",borderRadius:"var(--r-md)",marginBottom:16,display:"flex",gap:8,alignItems:"center",fontSize:13,fontWeight:600,color:"var(--accent)"}}>
          <CheckCircle2 size={15}/>Seeded! Visit <a href="/" style={{color:"var(--brand)",textDecoration:"none",marginLeft:4}}>homepage</a> or <a href="/explore" style={{color:"var(--brand)",textDecoration:"none",marginLeft:4}}>explore</a> to see the data.
        </div>
      )}

      {/* Missing tables warning */}
      {missingTables.length > 0 && (
        <div style={{marginBottom:16,border:"2px solid #d97706",borderRadius:"var(--r-lg)",overflow:"hidden"}}>
          <div style={{padding:"12px 16px",background:"rgba(217,119,6,.08)",display:"flex",alignItems:"center",gap:8,justifyContent:"space-between",flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <AlertCircle size={16} style={{color:"#d97706",flexShrink:0}}/>
              <div>
                <div style={{fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:800,color:"#92400e"}}>
                  Missing DB tables: {missingTables.join(", ")}
                </div>
                <div style={{fontSize:11,color:"#78350f",marginTop:2}}>
                  Run the SQL below in <strong>Supabase → SQL Editor</strong> before seeding groups.
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={copySQL} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",background:"#d97706",border:"none",borderRadius:"var(--r)",cursor:"pointer",color:"white",fontSize:11,fontWeight:700}}>
                <Copy size={11}/>{copied?"Copied!":"Copy SQL"}
              </button>
              <button onClick={()=>setShowSQL(v=>!v)} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",background:"rgba(217,119,6,.15)",border:"1px solid rgba(217,119,6,.3)",borderRadius:"var(--r)",cursor:"pointer",color:"#92400e",fontSize:11,fontWeight:700}}>
                <Terminal size={11}/>{showSQL?"Hide":"Show SQL"}
              </button>
            </div>
          </div>
          {showSQL && (
            <pre style={{margin:0,padding:"14px 16px",background:"#0f172a",color:"#e2e8f0",fontSize:11,fontFamily:"JetBrains Mono,monospace",overflowX:"auto",lineHeight:1.7,whiteSpace:"pre-wrap"}}>
              {GROUPS_SQL}
            </pre>
          )}
        </div>
      )}

      {/* Table status */}
      {Object.keys(tableCheck).length > 0 && (
        <div className="card" style={{padding:"12px 16px",marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
            <Table size={13} style={{color:"var(--brand)"}}/>
            <span style={{fontFamily:"Outfit,sans-serif",fontSize:11,fontWeight:800,color:"var(--text)",textTransform:"uppercase",letterSpacing:".07em"}}>Table Status</span>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {Object.entries(tableCheck).map(([t,v])=>(
              <div key={t} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:"var(--r-f)",background:v.exists?"rgba(5,150,105,.08)":"rgba(220,38,38,.07)",border:`1px solid ${v.exists?"rgba(5,150,105,.2)":"rgba(220,38,38,.2)"}`}}>
                {v.exists?<CheckCircle2 size={10} style={{color:"var(--accent)"}}/>:<AlertCircle size={10} style={{color:"#dc2626"}}/>}
                <span style={{fontSize:10,fontWeight:700,color:v.exists?"var(--accent)":"#dc2626"}}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current counts */}
      <div className="card" style={{padding:"14px 16px",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <Info size={13} style={{color:"var(--brand)"}}/>
            <span style={{fontFamily:"Outfit,sans-serif",fontSize:11,fontWeight:800,color:"var(--text)",textTransform:"uppercase",letterSpacing:".07em"}}>Database State</span>
          </div>
          <button onClick={loadCounts} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-4)",display:"flex",padding:4}}><RotateCcw size={12}/></button>
        </div>
        {counts?(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:7}}>
            {(Object.entries(counts) as [string,number][]).map(([k,n])=>(
              <div key={k} style={{padding:"8px 10px",background:"var(--bg-alt)",borderRadius:"var(--r)",border:"1px solid var(--border)"}}>
                <div style={{fontFamily:"Outfit,sans-serif",fontSize:20,fontWeight:900,color:n>0?"var(--brand)":"var(--text-4)",lineHeight:1}}>{n}</div>
                <div style={{fontSize:9,color:"var(--text-4)",fontWeight:600,textTransform:"uppercase",letterSpacing:".05em",marginTop:3}}>{k.replace(/_/g," ")}</div>
              </div>
            ))}
            <div style={{padding:"8px 10px",background:"var(--brand-muted)",borderRadius:"var(--r)",border:"1px solid var(--brand-border)"}}>
              <div style={{fontFamily:"Outfit,sans-serif",fontSize:20,fontWeight:900,color:"var(--brand)",lineHeight:1}}>{totalRows}</div>
              <div style={{fontSize:9,color:"var(--brand)",fontWeight:700,textTransform:"uppercase",letterSpacing:".05em",marginTop:3}}>total</div>
            </div>
          </div>
        ):(
          <div style={{display:"flex",gap:7}}>{[...Array(6)].map((_,i)=><div key={i} className="skeleton" style={{height:56,flex:1,borderRadius:"var(--r)"}}/>)}</div>
        )}
      </div>

      {/* Seed cards */}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {SEED_TABLES.map(t=>{
          const res = results[t.key];
          const isThis = running===t.key;
          const ok = res && !res.error;
          const tableOk = t.key==="groups" ? tableCheck["groups"]?.exists!==false : true;

          return (
            <div key={t.key} className="card" style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:12,border:`1.5px solid ${ok?"rgba(5,150,105,.3)":res&&!ok?"rgba(220,38,38,.2)":"var(--border)"}`}}>
              <div style={{width:38,height:38,borderRadius:10,background:`${t.color}15`,border:`1.5px solid ${t.color}30`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <t.icon size={18} style={{color:t.color}}/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                  <h3 style={{fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:800,color:"var(--text)"}}>{t.label}</h3>
                  {ok&&<CheckCircle2 size={12} style={{color:"var(--accent)"}}/>}
                  {res&&!ok&&<AlertCircle size={12} style={{color:"#dc2626"}}/>}
                  {!tableOk&&<span style={{fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:99,background:"rgba(217,119,6,.1)",color:"#d97706",border:"1px solid rgba(217,119,6,.2)"}}>Table missing</span>}
                </div>
                <p style={{fontSize:11,color:"var(--text-4)",lineHeight:1.4}}>{t.desc}</p>
                {res?.error&&<p style={{fontSize:10,color:"#dc2626",marginTop:3}}>{res.error}</p>}
                {ok&&<p style={{fontSize:10,color:"var(--accent)",marginTop:3}}>✅ {res.inserted??0} rows inserted</p>}
              </div>
              <button onClick={()=>runSeed([t.key])} disabled={isRunning}
                style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",background:isThis?"var(--bg-alt)":t.color,border:`1.5px solid ${t.color}`,borderRadius:"var(--r-lg)",cursor:isRunning?"not-allowed":"pointer",color:isThis?"var(--text-3)":"white",fontSize:11,fontWeight:700,flexShrink:0,whiteSpace:"nowrap"}}>
                {isThis?<><Loader size={11} style={{animation:"spin 1s linear infinite"}}/>Seeding…</>:<><Play size={11}/>Seed</>}
              </button>
            </div>
          );
        })}
      </div>

      {/* Log */}
      {log.length>0&&(
        <div className="card" style={{marginTop:16,padding:"12px 16px"}}>
          <div style={{fontFamily:"Outfit,sans-serif",fontSize:10,fontWeight:800,color:"var(--text)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:8}}>Log</div>
          <div style={{fontFamily:"JetBrains Mono,monospace",fontSize:10,lineHeight:1.8,maxHeight:200,overflowY:"auto"}}>
            {log.map((l,i)=><div key={i} style={{color:l.includes("❌")?"#dc2626":l.includes("✅")||l.includes("🎉")?"var(--accent)":"var(--text-4)"}}>{l}</div>)}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        .card:hover { border-color: var(--border) !important; }
      `}</style>
    </div>
  );
}


