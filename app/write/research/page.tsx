"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "../../../components/ui/Navbar";
import WordEditor from "../../../components/ui/WordEditor";
import { useAuth } from "../../../lib/auth";
import {
  Plus, Save, CheckCircle2, Trash2, Edit3, ChevronDown, ChevronUp,
  BookOpen, Clock, Send, AlertCircle, PenLine, List,
} from "lucide-react";

const SECTION_TYPES = [
  "Abstract","Introduction","Literature Review","Methodology",
  "Results","Discussion","Conclusion","Recommendations",
  "References","Appendix","Acknowledgements","Custom",
];

interface Section {
  id: string; type: string; title: string;
  content: string; createdAt: string; updatedAt: string;
}

export default function ResearchPage() {
  const { address, isAuth, requireAuth } = useAuth();

  const [draftId,     setDraftId]     = useState<string|null>(null);
  const [paperTitle,  setPaperTitle]  = useState("");
  const [keywords,    setKeywords]    = useState("");
  const [sections,    setSections]    = useState<Section[]>([]);
  const [activeType,  setActiveType]  = useState("Abstract");
  const [customTitle, setCustomTitle] = useState("");
  const [editorHtml,  setEditorHtml]  = useState("");
  const [editingId,   setEditingId]   = useState<string|null>(null);
  const [editHtml,    setEditHtml]    = useState("");
  const [expanded,    setExpanded]    = useState<string|null>(null);
  const [saving,      setSaving]      = useState(false);
  const [autoSaved,   setAutoSaved]   = useState<Date|null>(null);
  const [publishing,  setPublishing]  = useState(false);
  const [published,   setPublished]   = useState(false);
  const [error,       setError]       = useState("");
  // Mobile tab: "write" | "sections"
  const [mobileTab,   setMobileTab]   = useState<"write"|"sections">("write");
  const autoTimer = useRef<ReturnType<typeof setTimeout>|null>(null);

  // Load existing draft
  useEffect(() => {
    if (!address) return;
    fetch(`/api/drafts?author=${address.toLowerCase()}`).then(r=>r.json()).then(d=>{
      const ex = Array.isArray(d) ? d[0] : null;
      if (ex) {
        setDraftId(String(ex.id));
        setPaperTitle(ex.title||"");
        setKeywords((ex.keywords||[]).join(", "));
        setSections(ex.sections||[]);
      }
    });
  },[address]);

  // Auto-save after period (1.5s debounce)
  useEffect(()=>{
    if (!editorHtml.includes(".")||!address) return;
    if (autoTimer.current) clearTimeout(autoTimer.current);
    autoTimer.current = setTimeout(()=>saveDraft(true), 1500);
    return ()=>{ if(autoTimer.current) clearTimeout(autoTimer.current); };
  },[editorHtml]);

  // Auto-save on section change
  useEffect(()=>{
    if (!sections.length||!address) return;
    if (autoTimer.current) clearTimeout(autoTimer.current);
    autoTimer.current = setTimeout(()=>saveDraft(true), 2000);
  },[sections, paperTitle, keywords]);

  const saveDraft = useCallback(async (silent=false)=>{
    if (!address) return;
    if (!silent) setSaving(true);
    const body = {
      authorAddress: address.toLowerCase(),
      title: paperTitle,
      sections,
      refs: [],
      keywords: keywords.split(",").map(k=>k.trim()).filter(Boolean),
      status: "draft",
    };
    const url    = draftId ? `/api/drafts/${draftId}` : "/api/drafts";
    const method = draftId ? "PUT" : "POST";
    const r = await fetch(url,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const d = await r.json();
    if (!draftId && d.id) setDraftId(String(d.id));
    setAutoSaved(new Date());
    if (!silent) setSaving(false);
  },[address, paperTitle, sections, keywords, draftId]);

  function addSection() {
    const text = editorHtml.replace(/<[^>]+>/g,"").trim();
    if (!text) { setError("Write some content before adding the section."); return; }
    setError("");
    const title = activeType==="Custom" ? (customTitle||"Custom Section") : activeType;
    const newSec: Section = {
      id: Date.now().toString(), type: activeType, title,
      content: editorHtml, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    setSections(prev=>{
      const exists = prev.find(s=>s.type===activeType&&activeType!=="Custom");
      if (exists) return prev.map(s=>s.id===exists.id?{...newSec,id:exists.id}:s);
      return [...prev, newSec];
    });
    setEditorHtml("");
    // Advance to next section type
    const idx = SECTION_TYPES.indexOf(activeType);
    if (idx>=0 && idx<SECTION_TYPES.length-2) setActiveType(SECTION_TYPES[idx+1]);
    // Switch to sections tab on mobile after adding
    setMobileTab("sections");
  }

  function startEdit(s:Section){ setEditingId(s.id); setEditHtml(s.content); setExpanded(s.id); }
  function saveEdit(id:string){
    setSections(prev=>prev.map(s=>s.id===id?{...s,content:editHtml,updatedAt:new Date().toISOString()}:s));
    setEditingId(null); setEditHtml("");
  }
  function delSection(id:string){ if(!confirm("Remove this section?"))return; setSections(prev=>prev.filter(s=>s.id!==id)); }

  async function publish() {
    if (!address||!sections.length) return;
    setPublishing(true); setError("");
    const fullContent = sections.map(s=>`<h2>${s.title}</h2>\n${s.content}`).join("\n\n");
    const abstract    = sections.find(s=>s.type==="Abstract");
    const blurb       = abstract ? abstract.content.replace(/<[^>]+>/g,"").slice(0,200) : "";
    const r = await fetch("/api/articles",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({title:paperTitle||"Untitled Research",blurb,content:fullContent,authorAddress:address.toLowerCase(),isResearch:true,category:"Research",status:"pending"}),
    });
    const d = await r.json();
    if (r.ok&&d.id) setPublished(true);
    else setError(d.error||"Publish failed");
    setPublishing(false);
  }

  const alreadyAdded = sections.find(s=>s.type===activeType&&activeType!=="Custom");

  if (!isAuth) return (
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>
      <Navbar/>
      <div style={{maxWidth:500,margin:"0 auto",padding:"calc(var(--header-h) + 60px) 20px",textAlign:"center"}}>
        <BookOpen size={40} style={{color:"var(--text-4)",marginBottom:14}}/>
        <h2 style={{fontFamily:"Outfit,sans-serif",fontSize:20,fontWeight:800,color:"var(--text)",marginBottom:8}}>Research Writing Studio</h2>
        <p style={{fontSize:14,color:"var(--text-3)",marginBottom:20}}>Sign in to start writing your research paper.</p>
        <button onClick={()=>requireAuth()} className="btn btn-primary btn-lg" style={{width:"100%",justifyContent:"center"}}>Sign In to Write</button>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>
      <Navbar/>

      <div style={{maxWidth:1100,margin:"0 auto",padding:"calc(var(--header-h) + 12px) 12px 80px"}}>

        {/* ── Top header ── */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12,gap:10,flexWrap:"wrap"}}>
          <div style={{minWidth:0}}>
            <h1 style={{fontFamily:"Outfit,sans-serif",fontSize:"clamp(16px,4vw,22px)",fontWeight:900,color:"var(--text)",letterSpacing:"-.02em",margin:0}}>
              Research Writing Studio
            </h1>
            <p style={{fontSize:11,color:"var(--text-4)",marginTop:3,display:"flex",alignItems:"center",gap:5}}>
              <Clock size={9}/>
              {autoSaved ? `Auto-saved ${autoSaved.toLocaleTimeString()}` : "Auto-saves after each sentence"}
            </p>
          </div>
          <div style={{display:"flex",gap:8,flexShrink:0}}>
            <button onClick={()=>saveDraft(false)} disabled={saving} className="btn btn-secondary btn-sm">
              {saving ? <><div style={{width:11,height:11,border:"1.5px solid var(--border)",borderTopColor:"var(--brand)",borderRadius:"50%"}} className="spin"/>Saving…</> : <><Save size={11}/>Save</>}
            </button>
            {sections.length>0&&!published&&(
              <button onClick={publish} disabled={publishing} className="btn btn-primary btn-sm">
                {publishing?"Publishing…":<><Send size={11}/>Submit</>}
              </button>
            )}
          </div>
        </div>

        {published&&(
          <div style={{padding:"11px 14px",background:"rgba(5,150,105,.07)",border:"1px solid rgba(5,150,105,.2)",borderRadius:"var(--r-md)",marginBottom:12,display:"flex",gap:8,alignItems:"center",fontSize:13,fontWeight:600,color:"var(--accent)"}}>
            <CheckCircle2 size={15}/>Submitted for review! Appears on site once approved.
          </div>
        )}
        {error&&(
          <div style={{padding:"10px 14px",background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.2)",borderRadius:"var(--r-md)",marginBottom:12,fontSize:13,color:"#dc2626",display:"flex",gap:7,alignItems:"flex-start"}}>
            <AlertCircle size={13} style={{flexShrink:0,marginTop:1}}/>{error}
          </div>
        )}

        {/* ── Mobile tabs ── */}
        <div className="mobile-only" style={{display:"flex",borderRadius:"var(--r-lg)",overflow:"hidden",border:"1.5px solid var(--border)",marginBottom:12}}>
          {(["write","sections"] as const).map(t=>(
            <button key={t} onClick={()=>setMobileTab(t)} style={{flex:1,padding:"10px 8px",border:"none",cursor:"pointer",fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:700,transition:"all .15s",background:mobileTab===t?"var(--brand)":"var(--bg-alt)",color:mobileTab===t?"white":"var(--text-4)"}}>
              {t==="write"?<><PenLine size={13} style={{verticalAlign:"middle",marginRight:5}}/>Write</>:<><List size={13} style={{verticalAlign:"middle",marginRight:5}}/>Sections ({sections.length})</>}
            </button>
          ))}
        </div>

        {/* ── Layout: side-by-side on desktop, stacked on mobile ── */}
        <div className="research-layout">

          {/* ── LEFT: Write panel ── */}
          <div className={`research-write-col${mobileTab==="write"?"":" mobile-hidden"}`}>

            {/* Paper title */}
            <div className="card" style={{padding:"14px 16px",marginBottom:12}}>
              <input
                value={paperTitle} onChange={e=>setPaperTitle(e.target.value)}
                placeholder="Research paper title…"
                style={{width:"100%",border:"none",outline:"none",background:"transparent",fontFamily:"Outfit,sans-serif",fontSize:"clamp(15px,3vw,20px)",fontWeight:800,color:"var(--text)",boxSizing:"border-box"}}
              />
              <div style={{borderTop:"1px solid var(--border)",marginTop:10,paddingTop:10}}>
                <input
                  value={keywords} onChange={e=>setKeywords(e.target.value)}
                  placeholder="Keywords (comma-separated)"
                  style={{width:"100%",border:"none",outline:"none",background:"transparent",fontSize:12,color:"var(--text-3)",boxSizing:"border-box"}}
                />
              </div>
            </div>

            {/* Section selector */}
            <div className="card" style={{padding:"12px 14px",marginBottom:8}}>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",marginBottom:10}}>
                <label style={{fontSize:11,fontWeight:700,color:"var(--text-3)",whiteSpace:"nowrap"}}>Section:</label>
                <select value={activeType} onChange={e=>setActiveType(e.target.value)}
                  style={{flex:1,minWidth:140,padding:"7px 10px",background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",fontSize:13,fontWeight:600,color:"var(--text)",outline:"none",cursor:"pointer"}}>
                  {SECTION_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
                {activeType==="Custom"&&(
                  <input value={customTitle} onChange={e=>setCustomTitle(e.target.value)} placeholder="Section name…"
                    style={{flex:1,minWidth:120,padding:"7px 10px",background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",fontSize:12,color:"var(--text)",outline:"none"}}/>
                )}
                <button onClick={addSection} className="btn btn-primary btn-sm" style={{flexShrink:0,gap:5}}>
                  <Plus size={13}/>{alreadyAdded?"Update":"Add"}
                </button>
              </div>
              {alreadyAdded&&(
                <div style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:"var(--accent)",fontWeight:600}}>
                  <CheckCircle2 size={9}/>Already added — clicking Update will replace it.
                </div>
              )}
            </div>

            {/* Word editor */}
            <WordEditor
              value={editorHtml}
              onChange={setEditorHtml}
              placeholder={`Write your ${activeType==="Custom"?customTitle||"section":activeType} here…`}
            />
          </div>

          {/* ── RIGHT: Sections panel ── */}
          <div className={`research-sections-col${mobileTab==="sections"?"":" mobile-hidden"}`}>

            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <h3 style={{fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:700,color:"var(--text)",margin:0}}>
                Sections ({sections.length})
              </h3>
              {sections.length>0&&<span style={{fontSize:9,color:"var(--text-4)"}}>Saved · visible on profile</span>}
            </div>

            {!sections.length ? (
              <div style={{padding:"32px 16px",textAlign:"center",background:"var(--bg-card)",border:"1.5px dashed var(--border)",borderRadius:"var(--r-lg)"}}>
                <BookOpen size={28} style={{color:"var(--text-4)",marginBottom:8}}/>
                <p style={{fontSize:12,color:"var(--text-4)",lineHeight:1.7}}>
                  Add your first section.<br/>
                  Start with the <strong>Abstract</strong>.
                </p>
              </div>
            ) : sections.map((s,i)=>(
              <div key={s.id} className="card" style={{overflow:"hidden",padding:0,marginBottom:8}}>
                {/* Section header */}
                <div style={{padding:"9px 12px",background:"var(--bg-alt)",display:"flex",alignItems:"center",gap:8,borderBottom:expanded===s.id?"1px solid var(--border)":"none"}}>
                  <div style={{width:20,height:20,borderRadius:"50%",background:"var(--brand-muted)",border:"1px solid var(--brand-border)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <span style={{fontFamily:"Outfit,sans-serif",fontSize:9,fontWeight:700,color:"var(--brand)"}}>{i+1}</span>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:"Outfit,sans-serif",fontSize:12,fontWeight:700,color:"var(--brand)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.title}</div>
                    <div style={{fontSize:9,color:"var(--text-4)",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.content.replace(/<[^>]+>/g,"").slice(0,55)}…</div>
                  </div>
                  <div style={{display:"flex",gap:2,flexShrink:0}}>
                    <button onClick={()=>startEdit(s)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--brand)",padding:4,display:"flex"}}><Edit3 size={12}/></button>
                    <button onClick={()=>delSection(s.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#dc2626",padding:4,display:"flex"}}><Trash2 size={12}/></button>
                    <button onClick={()=>setExpanded(expanded===s.id?null:s.id)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-4)",padding:4,display:"flex"}}>
                      {expanded===s.id?<ChevronUp size={12}/>:<ChevronDown size={12}/>}
                    </button>
                  </div>
                </div>

                {/* Section body */}
                {expanded===s.id&&(
                  <div style={{padding:"10px 12px"}}>
                    {editingId===s.id ? (
                      <>
                        <WordEditor value={editHtml} onChange={setEditHtml} placeholder="Edit content…"/>
                        <div style={{display:"flex",gap:6,marginTop:8,justifyContent:"flex-end"}}>
                          <button onClick={()=>saveEdit(s.id)} className="btn btn-primary btn-xs"><CheckCircle2 size={10}/>Save</button>
                          <button onClick={()=>setEditingId(null)} className="btn btn-ghost btn-xs">Cancel</button>
                        </div>
                      </>
                    ):(
                      <div style={{fontSize:12,color:"var(--text-2)",lineHeight:1.75}} dangerouslySetInnerHTML={{__html:s.content}}/>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Outline */}
            {sections.length>0&&(
              <div className="card" style={{padding:"12px 14px",marginTop:4}}>
                <div style={{fontSize:10,fontWeight:700,color:"var(--text-4)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:8,fontFamily:"Outfit,sans-serif"}}>Paper Outline</div>
                {sections.map((s,i)=>(
                  <div key={s.id} style={{display:"flex",gap:8,padding:"4px 0",borderBottom:"1px solid var(--border)"}}>
                    <span style={{fontSize:10,color:"var(--text-4)",width:18,flexShrink:0}}>{i+1}.</span>
                    <button onClick={()=>{ setActiveType(s.type); setEditorHtml(s.content); setMobileTab("write"); }}
                      style={{fontSize:11,fontWeight:600,color:"var(--brand)",background:"none",border:"none",cursor:"pointer",textAlign:"left",padding:0}}>
                      {s.title}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add missing sections hint */}
            {sections.length>0&&sections.length<SECTION_TYPES.length-1&&(
              <div style={{marginTop:8}}>
                <p style={{fontSize:10,color:"var(--text-4)",marginBottom:6}}>Suggested next sections:</p>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {SECTION_TYPES.filter(t=>t!=="Custom"&&!sections.find(s=>s.type===t)).slice(0,4).map(t=>(
                    <button key={t} onClick={()=>{setActiveType(t);setMobileTab("write");}}
                      style={{padding:"3px 9px",fontSize:10,fontWeight:600,color:"var(--brand)",background:"var(--brand-muted)",border:"1px solid var(--brand-border)",borderRadius:"var(--r-f)",cursor:"pointer"}}>
                      + {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .research-layout {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 14px;
          align-items: start;
        }
        .research-write-col { min-width: 0; }
        .research-sections-col { min-width: 0; }
        .mobile-only { display: none; }
        @media (max-width: 768px) {
          .research-layout {
            display: block;
          }
          .mobile-only { display: flex !important; }
          .mobile-hidden { display: none !important; }
          .research-write-col,
          .research-sections-col { display: block; }
        }
      `}</style>
    </div>
  );
}
