"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "../../../components/ui/Navbar";
import WordEditor from "../../../components/ui/WordEditor";
import { useAuth } from "../../../lib/auth";
import { Plus, Save, CheckCircle2, Trash2, Edit3, ChevronDown, ChevronUp, GripVertical, BookOpen, Clock, Send, AlertCircle } from "lucide-react";

const SECTION_TYPES = [
  "Abstract","Introduction","Literature Review","Methodology","Results",
  "Discussion","Conclusion","Recommendations","References","Appendix",
  "Acknowledgements","Custom",
];

interface Section {
  id: string;
  type: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function ResearchPage() {
  const { address, isAuth, requireAuth } = useAuth();

  const [draftId,      setDraftId]      = useState<string|null>(null);
  const [paperTitle,   setPaperTitle]   = useState("");
  const [keywords,     setKeywords]     = useState("");
  const [sections,     setSections]     = useState<Section[]>([]);
  const [activeType,   setActiveType]   = useState("Abstract");
  const [customTitle,  setCustomTitle]  = useState("");
  const [editorHtml,   setEditorHtml]   = useState("");
  const [editingId,    setEditingId]    = useState<string|null>(null);
  const [editHtml,     setEditHtml]     = useState("");
  const [expanded,     setExpanded]     = useState<string|null>(null);
  const [saving,       setSaving]       = useState(false);
  const [autoSaved,    setAutoSaved]    = useState<Date|null>(null);
  const [publishing,   setPublishing]   = useState(false);
  const [published,    setPublished]    = useState(false);
  const [error,        setError]        = useState("");
  const autoTimer = useRef<ReturnType<typeof setTimeout>|null>(null);

  // Load or create draft
  useEffect(() => {
    if (!address) return;
    fetch(`/api/drafts?author=${address.toLowerCase()}`).then(r=>r.json()).then(d => {
      const existing = Array.isArray(d) ? d[0] : null;
      if (existing) {
        setDraftId(String(existing.id));
        setPaperTitle(existing.title || "");
        setKeywords((existing.keywords||[]).join(", "));
        setSections(existing.sections || []);
      }
    });
  }, [address]);

  // Auto-save after every period (with 1.5s debounce)
  useEffect(() => {
    const hasPeriod = editorHtml.includes(".");
    if (!hasPeriod || !draftId) return;
    if (autoTimer.current) clearTimeout(autoTimer.current);
    autoTimer.current = setTimeout(() => { saveDraft(true); }, 1500);
    return () => { if (autoTimer.current) clearTimeout(autoTimer.current); };
  }, [editorHtml]);

  const saveDraft = useCallback(async (silent=false) => {
    if (!address) return;
    if (!silent) setSaving(true);
    const body = {
      authorAddress: address.toLowerCase(),
      title:   paperTitle,
      sections,
      keywords: keywords.split(",").map(k=>k.trim()).filter(Boolean),
      status: "draft",
    };
    const url    = draftId ? `/api/drafts/${draftId}` : "/api/drafts";
    const method = draftId ? "PUT" : "POST";
    const r = await fetch(url,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const d = await r.json();
    if (!draftId && d.id) setDraftId(String(d.id));
    if (!silent) setSaving(false);
    setAutoSaved(new Date());
  }, [address, paperTitle, sections, keywords, draftId]);

  // Auto-save when sections change
  useEffect(() => {
    if (!draftId || !address || !sections.length) return;
    if (autoTimer.current) clearTimeout(autoTimer.current);
    autoTimer.current = setTimeout(() => saveDraft(true), 2000);
  }, [sections]);

  function addSection() {
    if (!editorHtml.trim() || editorHtml === "<br>" || editorHtml === "<p><br></p>") {
      setError("Write some content before adding the section."); return;
    }
    setError("");
    const title = activeType === "Custom" ? (customTitle || "Custom Section") : activeType;
    const newSection: Section = {
      id:        Date.now().toString(),
      type:      activeType,
      title,
      content:   editorHtml,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Replace if same type already exists, else append
    setSections(prev => {
      const exists = prev.find(s => s.type === activeType && activeType !== "Custom");
      if (exists) return prev.map(s => s.id===exists.id ? {...newSection,id:exists.id} : s);
      return [...prev, newSection];
    });

    setEditorHtml("");
    // Move to next logical section
    const idx = SECTION_TYPES.indexOf(activeType);
    if (idx < SECTION_TYPES.length - 2) setActiveType(SECTION_TYPES[idx+1]);
  }

  function startEdit(s: Section) {
    setEditingId(s.id); setEditHtml(s.content);
    setExpanded(s.id);
  }

  function saveEdit(id: string) {
    setSections(prev => prev.map(s => s.id===id ? {...s,content:editHtml,updatedAt:new Date().toISOString()} : s));
    setEditingId(null); setEditHtml("");
  }

  function deleteSection(id: string) {
    if (!confirm("Remove this section?")) return;
    setSections(prev => prev.filter(s=>s.id!==id));
  }

  async function publishAsArticle() {
    if (!address || !sections.length) return;
    setPublishing(true); setError("");
    // Combine all sections into article content
    const fullContent = sections.map(s => `<h2>${s.title}</h2>\n${s.content}`).join("\n\n");
    const r = await fetch("/api/articles",{
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        title:         paperTitle || "Untitled Research",
        blurb:         sections.find(s=>s.type==="Abstract")?.content?.replace(/<[^>]+>/g,"").slice(0,200)||"",
        content:       fullContent,
        authorAddress: address.toLowerCase(),
        isResearch:    true,
        category:      "Research",
        status:        "pending",
      }),
    });
    const d = await r.json();
    if (r.ok && d.id) { setPublished(true); }
    else setError(d.error || "Publish failed");
    setPublishing(false);
  }

  if (!isAuth) return (
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>
      <Navbar/>
      <div style={{maxWidth:600,margin:"0 auto",padding:"calc(var(--header-h) + 60px) 16px",textAlign:"center"}}>
        <BookOpen size={40} style={{color:"var(--text-4)",marginBottom:14}}/>
        <h2 style={{fontFamily:"Outfit,sans-serif",fontSize:20,fontWeight:800,color:"var(--text)",marginBottom:8}}>Research Writing Studio</h2>
        <p style={{fontSize:14,color:"var(--text-3)",marginBottom:20}}>Sign in to start writing your research paper.</p>
        <button onClick={()=>requireAuth()} className="btn btn-primary btn-lg">Sign In to Write</button>
      </div>
    </div>
  );

  const sectionTitle = activeType==="Custom" ? customTitle||"Custom" : activeType;
  const alreadyAdded = sections.find(s=>s.type===activeType&&activeType!=="Custom");

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>
      <Navbar/>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"calc(var(--header-h) + 16px) 12px 60px"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
          <div>
            <h1 style={{fontFamily:"Outfit,sans-serif",fontSize:20,fontWeight:900,color:"var(--text)",letterSpacing:"-.02em"}}>Research Writing Studio</h1>
            <p style={{fontSize:11,color:"var(--text-4)",marginTop:2,display:"flex",alignItems:"center",gap:6}}>
              {autoSaved&&<><Clock size={9}/> Auto-saved {autoSaved.toLocaleTimeString()}</>}
              {!autoSaved&&<span>Type a sentence and it auto-saves</span>}
            </p>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>saveDraft(false)} disabled={saving} className="btn btn-secondary btn-sm">
              {saving?<><div style={{width:11,height:11,border:"1.5px solid var(--border)",borderTopColor:"var(--brand)",borderRadius:"50%"}} className="spin"/>Saving…</>:<><Save size={11}/>Save Draft</>}
            </button>
            {sections.length>0&&!published&&(
              <button onClick={publishAsArticle} disabled={publishing} className="btn btn-primary btn-sm">
                {publishing?"Publishing…":<><Send size={11}/>Submit for Review</>}
              </button>
            )}
          </div>
        </div>

        {published&&(
          <div style={{padding:"12px 16px",background:"rgba(5,150,105,.07)",border:"1px solid rgba(5,150,105,.2)",borderRadius:"var(--r-md)",marginBottom:14,display:"flex",gap:8,alignItems:"center"}}>
            <CheckCircle2 size={16} style={{color:"var(--accent)"}}/>
            <span style={{fontSize:13,fontWeight:600,color:"var(--accent)"}}>Submitted for admin review! It will appear on the site once approved.</span>
          </div>
        )}

        {error&&<div style={{padding:"10px 14px",background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.2)",borderRadius:"var(--r-md)",marginBottom:12,fontSize:13,color:"#dc2626",display:"flex",gap:7}}><AlertCircle size={14} style={{flexShrink:0,marginTop:1}}/>{error}</div>}

        <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:14}}>

          {/* Left: editor */}
          <div style={{display:"flex",flexDirection:"column",gap:12}}>

            {/* Paper title */}
            <div className="card" style={{padding:"14px 16px"}}>
              <label style={{fontSize:10,fontWeight:700,color:"var(--text-4)",textTransform:"uppercase",letterSpacing:".08em",display:"block",marginBottom:6,fontFamily:"Outfit,sans-serif"}}>Paper Title</label>
              <input value={paperTitle} onChange={e=>setPaperTitle(e.target.value)} placeholder="Enter your research paper title…"
                style={{width:"100%",border:"none",outline:"none",background:"transparent",fontFamily:"Outfit,sans-serif",fontSize:18,fontWeight:800,color:"var(--text)",boxSizing:"border-box"}}/>
              <div style={{marginTop:10,display:"flex",gap:10}}>
                <input value={keywords} onChange={e=>setKeywords(e.target.value)} placeholder="Keywords (comma-separated)…"
                  style={{flex:1,border:"none",borderTop:"1px solid var(--border)",outline:"none",background:"transparent",fontSize:12,color:"var(--text-3)",paddingTop:8}}/>
              </div>
            </div>

            {/* Section adder */}
            <div className="card" style={{padding:"14px 16px"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap"}}>
                <div style={{display:"flex",alignItems:"center",gap:7,flex:1,minWidth:200}}>
                  <label style={{fontSize:11,fontWeight:700,color:"var(--text-3)",whiteSpace:"nowrap"}}>Section:</label>
                  <select value={activeType} onChange={e=>setActiveType(e.target.value)}
                    style={{flex:1,padding:"6px 10px",background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",fontSize:13,fontWeight:600,color:"var(--text)",outline:"none",cursor:"pointer"}}>
                    {SECTION_TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                  {activeType==="Custom"&&(
                    <input value={customTitle} onChange={e=>setCustomTitle(e.target.value)} placeholder="Section name…"
                      style={{width:140,padding:"6px 10px",background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",fontSize:12,color:"var(--text)",outline:"none"}}/>
                  )}
                </div>
                {alreadyAdded&&<span style={{fontSize:10,color:"var(--accent)",fontWeight:600,display:"flex",alignItems:"center",gap:3}}><CheckCircle2 size={10}/>Already added · editing will replace</span>}
                <button onClick={addSection} className="btn btn-primary btn-sm" style={{gap:5,flexShrink:0}}>
                  <Plus size={13}/>{alreadyAdded?"Update":"Add"} {sectionTitle}
                </button>
              </div>
              <WordEditor value={editorHtml} onChange={setEditorHtml} placeholder={`Write your ${sectionTitle} here…`}/>
            </div>
          </div>

          {/* Right: sections list */}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <h3 style={{fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:700,color:"var(--text)"}}>
                Sections ({sections.length})
              </h3>
              <span style={{fontSize:10,color:"var(--text-4)"}}>Saved to DB · visible on your profile</span>
            </div>

            {!sections.length&&(
              <div style={{padding:"28px 16px",textAlign:"center",background:"var(--bg-card)",border:"1.5px dashed var(--border)",borderRadius:"var(--r-lg)"}}>
                <BookOpen size={24} style={{color:"var(--text-4)",marginBottom:8}}/>
                <p style={{fontSize:12,color:"var(--text-4)",lineHeight:1.6}}>Add your first section.<br/>Start with the Abstract.</p>
              </div>
            )}

            {sections.map((s,i)=>(
              <div key={s.id} className="card" style={{overflow:"hidden",padding:0}}>
                <div style={{padding:"10px 12px",background:"var(--bg-alt)",display:"flex",alignItems:"center",gap:8,borderBottom:expanded===s.id?"1px solid var(--border)":"none"}}>
                  <GripVertical size={12} style={{color:"var(--text-4)",flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:"Outfit,sans-serif",fontSize:12,fontWeight:700,color:"var(--brand)"}}>{s.title}</div>
                    <div style={{fontSize:9,color:"var(--text-4)",marginTop:1}}>{s.content.replace(/<[^>]+>/g,"").slice(0,50)}…</div>
                  </div>
                  <div style={{display:"flex",gap:4,flexShrink:0}}>
                    <button onClick={()=>startEdit(s)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--brand)",padding:3,display:"flex"}}><Edit3 size={11}/></button>
                    <button onClick={()=>deleteSection(s.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#dc2626",padding:3,display:"flex"}}><Trash2 size={11}/></button>
                    <button onClick={()=>setExpanded(expanded===s.id?null:s.id)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-4)",padding:3,display:"flex"}}>
                      {expanded===s.id?<ChevronUp size={11}/>:<ChevronDown size={11}/>}
                    </button>
                  </div>
                </div>
                {expanded===s.id&&(
                  <div style={{padding:"10px 12px"}}>
                    {editingId===s.id?(
                      <>
                        <WordEditor value={editHtml} onChange={setEditHtml} placeholder="Edit section content…"/>
                        <div style={{display:"flex",gap:6,marginTop:8,justifyContent:"flex-end"}}>
                          <button onClick={()=>saveEdit(s.id)} className="btn btn-primary btn-xs"><CheckCircle2 size={10}/>Save</button>
                          <button onClick={()=>setEditingId(null)} className="btn btn-ghost btn-xs">Cancel</button>
                        </div>
                      </>
                    ):(
                      <div style={{fontSize:12,color:"var(--text-2)",lineHeight:1.7}} dangerouslySetInnerHTML={{__html:s.content}}/>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Outline */}
            {sections.length>0&&(
              <div className="card" style={{padding:"12px 14px"}}>
                <div style={{fontSize:10,fontWeight:700,color:"var(--text-4)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:8,fontFamily:"Outfit,sans-serif"}}>Paper Outline</div>
                {sections.map((s,i)=>(
                  <div key={s.id} style={{display:"flex",gap:7,padding:"4px 0",borderBottom:"1px solid var(--border)"}}>
                    <span style={{fontSize:10,color:"var(--text-4)",width:16,flexShrink:0}}>{i+1}.</span>
                    <span style={{fontSize:11,fontWeight:600,color:"var(--text-2)"}}>{s.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
