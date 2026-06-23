"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  X, Send, Bot, Wand2, PenLine, List, Quote, Search,
  RefreshCw, ClipboardList, BookOpen, Sparkles, ChevronDown,
  FilePen, MessageSquare, CornerDownLeft, GripHorizontal,
} from "lucide-react";

interface Msg { role:"user"|"ai"; text:string; }

function clean(text: string): string {
  return text
    // Strip markdown heading markers but keep the heading text on its own line
    .replace(/^#{1,6}\s+(.+)$/gm, (_, t) => t.toUpperCase())
    // Strip bold/italic markers but keep text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_{2}([^_]+)_{2}/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    // Strip code blocks but keep content
    .replace(/```[\s\S]*?```/g, m => m.replace(/```\w*\n?/g,"").trim())
    .replace(/`([^`]+)`/g, "$1")
    // Strip markdown links but keep label
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Convert bullet points to bullet char
    .replace(/^\s*[-*+]\s+/gm, "• ")
    // Remove blockquote markers
    .replace(/^\s*>\s*/gm, "")
    // Collapse 3+ blank lines to 2 (preserve paragraph structure)
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function parseFormatting(text: string): Record<string,string|number> | null {
  const lower = text.toLowerCase();
  const isFormat = /font|typeface|serif|sans.serif|spacing|line.height|margin|size\s*\d|pt|point|calibri|georgia|arial|times|helvetica|verdana|double.space|single.space/.test(lower);
  if (!isFormat) return null;
  const spec: any = {};
  const fontMap: Record<string,string> = { "sans-serif":"Arial","sans serif":"Arial","arial":"Arial","helvetica":"Helvetica","times new roman":"Times New Roman","times":"Times New Roman","georgia":"Georgia","calibri":"Calibri","verdana":"Verdana","garamond":"Garamond","courier":"Courier New","serif":"Times New Roman" };
  for (const [k,v] of Object.entries(fontMap)) { if (lower.includes(k)) { spec.fontFamily=v; break; } }
  const sizeMatch = lower.match(/(\d+)\s*(?:pt|point)/);
  if (sizeMatch) { const n=parseInt(sizeMatch[1]); if(n>=6&&n<=96) spec.fontSize=n; }
  if (/double\s*spac/i.test(text)) spec.lineSpacing="2";
  else if (/single\s*spac/i.test(text)) spec.lineSpacing="1";
  else if (/triple\s*spac/i.test(text)) spec.lineSpacing="3";
  else { const m=lower.match(/(\d+(?:\.\d+)?)\s*(?:line\s*)?spac/); if(m) spec.lineSpacing=m[1]; }
  const mmMatch=lower.match(/(\d+(?:\.\d+)?)\s*mm\s*(?:margin|padding)/);
  const inMatch=lower.match(/(\d+(?:\.\d+)?)\s*(?:inch|")\s*(?:margin|padding)/);
  if (mmMatch) spec.margin=Math.round(parseFloat(mmMatch[1])*3.7795)+"px";
  else if (inMatch) spec.margin=Math.round(parseFloat(inMatch[1])*96)+"px";
  return Object.keys(spec).length>0 ? spec : null;
}

const ACTIONS = [
  { key:"improve",  icon:Wand2,         label:"Improve",    color:"#7c3aed", prompt:"Improve the writing quality, clarity and academic tone of the following text. Output plain text only, no markdown:" },
  { key:"expand",   icon:PenLine,       label:"Expand",     color:"#0284c7", prompt:"Expand this text with more academic detail, supporting arguments and scholarly references. Plain text only:" },
  { key:"outline",  icon:List,          label:"Outline",    color:"#059669", prompt:"Generate a detailed academic chapter outline with numbered sections and sub-sections. Plain text only:" },
  { key:"citations",icon:Quote,         label:"Citations",  color:"#d97706", prompt:"Suggest 5 relevant academic citations formatted in APA 7th Edition. For each give author, year, title and why it supports this work:" },
  { key:"method",   icon:ClipboardList, label:"Methodology",color:"#dc2626", prompt:"Review this methodology section and suggest improvements for rigor, validity and replicability. Plain text only:" },
  { key:"keywords", icon:Search,        label:"Keywords",   color:"#db2777", prompt:"Extract 8-10 academic keywords suitable for database indexing. Comma-separated with a brief explanation of each:" },
  { key:"shorter",  icon:RefreshCw,     label:"Shorten",    color:"#0891b2", prompt:"Condense this to half its length while keeping all key academic points. Plain text only:" },
  { key:"abstract", icon:BookOpen,      label:"Abstract",   color:"#16a34a", prompt:"Write a complete academic abstract (150-300 words) for this paper. Include: problem, methodology, findings, conclusion, and 5 keywords at the end:" },
];

const FORMAT_PROMPTS = [
  { label:"Write Introduction",    prompt:"Write Chapter One Introduction for this topic including: Background, Statement of Problem, Objectives (broad + 3 specific), Research Questions, Significance and Scope. Plain text, APA citations:" },
  { label:"Write Lit Review",      prompt:"Write a comprehensive Chapter Two Literature Review including Conceptual Framework, Theoretical Framework (2 theories), Empirical Review grouped by theme, and Gap in Literature. Plain text, APA:" },
  { label:"Write Methodology",     prompt:"Write Chapter Three Methodology including: Research Design (justified), Population, Sample Size (Taro Yamane formula), Instrument, Validity/Reliability (Cronbach Alpha), Analysis method. Plain text:" },
  { label:"Formal Academic Tone",  prompt:"Rewrite the following in formal academic third-person passive voice. No contractions, no slang. Plain text only:" },
  { label:"Fix Grammar & Style",   prompt:"Correct all grammar, punctuation, spelling and academic style errors. Plain text output only:" },
  { label:"Add Transitions",       prompt:"Improve paragraph flow by adding smooth academic transitional phrases. Plain text only:" },
  { label:"APA References",        prompt:"Format the following sources into proper APA 7th Edition reference list, alphabetical by surname. Plain text only:" },
  { label:"Passive Voice",         prompt:"Convert all active voice sentences to formal academic passive voice. Plain text only:" },
];

export default function ResearchAI({
  paperTitle, sectionTitle, sectionContent, onApplyFormat, onInsertText,
}: {
  paperTitle:string; sectionTitle:string; sectionContent:string;
  onApplyFormat?: (spec:any)=>void;
  onInsertText?:  (text:string)=>void;
}) {
  const [open,       setOpen]       = useState(false);
  const [msgs,       setMsgs]       = useState<Msg[]>([]);
  const [input,      setInput]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [model,      setModel]      = useState("");
  const [models,     setModels]     = useState<string[]>([]);
  const [writeMode,  setWriteMode]  = useState(false);
  const [showModels, setShowModels] = useState(false);
  const [isMobile,   setIsMobile]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    fetch("/api/openrouter/models").then(r=>r.json()).then(d=>{
      const all: string[] = [];
      if (d.activeModel) { setModel(d.activeModel); all.push(d.activeModel); }
      if (Array.isArray(d.models)) {
        d.models.forEach((m:any) => {
          const id = typeof m==="string"?m:m.id||m.name||"";
          if (id&&!all.includes(id)) all.push(id);
        });
      }
      setModels(all);
    }).catch(()=>{});
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:"smooth"}); }, [msgs]);

  const getContext = useCallback(()=>[
    paperTitle   ? `Paper: "${paperTitle}"`   : "",
    sectionTitle ? `Section: ${sectionTitle}` : "",
    sectionContent ? `Content:\n${sectionContent.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim().slice(0,3000)}` : "",
  ].filter(Boolean).join("\n\n"),[paperTitle,sectionTitle,sectionContent]);

  async function ask(prompt:string, userLabel:string) {
    setMsgs(p=>[...p,{role:"user",text:userLabel}]);
    setLoading(true); setInput("");
    if (onApplyFormat) {
      const fmt = parseFormatting(userLabel);
      if (fmt) {
        onApplyFormat(fmt);
        const applied = Object.entries(fmt).map(([k,v])=>`${k}: ${v}`).join(", ");
        setMsgs(p=>[...p,{role:"ai",text:`Applied: ${applied}`}]);
        setLoading(false); return;
      }
    }
    try {
      const r = await fetch("/api/ai/chat",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({articleId:"research-studio",question:`${prompt}\n\n${getContext()}`,articleContent:getContext(),articleTitle:paperTitle||"Research Paper",model,isResearch:true}),
      });
      const d = await r.json();
      const text = clean(d.response||d.error||"No response.");
      if (writeMode&&onInsertText) {
        onInsertText(text);
        setMsgs(p=>[...p,{role:"ai",text:"Written into your document at the cursor position."}]);
      } else {
        setMsgs(p=>[...p,{role:"ai",text}]);
      }
    } catch {
      setMsgs(p=>[...p,{role:"ai",text:"Connection error. Check AI settings in Admin."}]);
    }
    setLoading(false);
  }

  const modelShort = model?model.split("/").pop()?.split(":")[0]||model:"Select model";

  // ── Panel dimensions ────────────────────────────────────────────
  // Mobile: bottom sheet (not full screen, sits above bottom nav)
  // Desktop: floating panel right side
  const BOTTOM_NAV = 62;
  const panelStyle: React.CSSProperties = isMobile ? {
    position:"fixed", bottom:BOTTOM_NAV, left:0, right:0, zIndex:200,
    background:"var(--bg-card)", borderTop:"1.5px solid var(--border)",
    borderRadius:"16px 16px 0 0",
    boxShadow:"0 -8px 40px rgba(0,0,0,.18)",
    display:"flex", flexDirection:"column",
    height: writeMode ? "42vh" : "68vh",
    maxHeight: writeMode ? "360px" : "580px",
    transition:"height .25s ease",
  } : {
    position:"fixed",
    bottom:"calc(var(--bottom-nav-h,0px) + 80px)", right:12, zIndex:200,
    width:"min(400px,calc(100vw - 24px))",
    height: writeMode ? "360px" : "min(600px,calc(100vh - 160px))",
    background:"var(--bg-card)", border:"1.5px solid var(--border)",
    borderRadius:"var(--r-xl)", boxShadow:"0 8px 40px rgba(0,0,0,.18)",
    display:"flex", flexDirection:"column", overflow:"hidden",
    transition:"height .25s ease",
  };

  return (
    <>
      {/* Floating trigger button */}
      <button onClick={()=>setOpen(o=>!o)}
        style={{
          position:"fixed",
          bottom: isMobile ? BOTTOM_NAV + 12 : "calc(var(--bottom-nav-h,0px) + 80px)",
          right:isMobile ? 14 : 16,
          zIndex:210,
          width:46, height:46, borderRadius:"50%",
          background:"#4f46e5", border:"none", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:"0 4px 20px rgba(79,70,229,.45)",
          transition:"transform .2s",
        }}
        onMouseEnter={e=>(e.currentTarget.style.transform="scale(1.08)")}
        onMouseLeave={e=>(e.currentTarget.style.transform="scale(1)")}
        title="AI Research Assistant">
        {open?<X size={19} color="white"/>:<Bot size={19} color="white"/>}
      </button>

      {/* Panel */}
      {open && (
        <div style={panelStyle}>

          {/* Drag handle (mobile only) */}
          {isMobile && (
            <div style={{display:"flex",justifyContent:"center",padding:"8px 0 4px",flexShrink:0}}>
              <div style={{width:36,height:4,borderRadius:99,background:"var(--border)"}}/>
            </div>
          )}

          {/* Header */}
          <div style={{padding:"9px 12px",background:"#4f46e5",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
            <Bot size={14} color="white"/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:800,color:"white",lineHeight:1}}>Research AI</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,.7)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sectionTitle||"Paper Assistant"}</div>
            </div>
            {/* Model picker */}
            <div style={{position:"relative"}}>
              <button onClick={()=>setShowModels(o=>!o)}
                style={{display:"flex",alignItems:"center",gap:3,padding:"3px 7px",background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.2)",borderRadius:6,cursor:"pointer",color:"white",fontSize:9,fontWeight:600,maxWidth:90}}>
                <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{modelShort}</span>
                <ChevronDown size={8} style={{flexShrink:0}}/>
              </button>
              {showModels&&models.length>0&&(
                <div style={{position:"absolute",top:"calc(100% + 4px)",right:0,background:"var(--bg-card)",border:"1.5px solid var(--border)",borderRadius:"var(--r-lg)",boxShadow:"0 8px 24px rgba(0,0,0,.15)",zIndex:300,minWidth:200,maxHeight:180,overflowY:"auto",padding:"4px 0"}}>
                  {models.map(m=>(
                    <button key={m} onClick={()=>{setModel(m);setShowModels(false);}}
                      style={{width:"100%",padding:"7px 12px",background:m===model?"var(--brand-muted)":"none",border:"none",cursor:"pointer",textAlign:"left",fontSize:11,fontWeight:m===model?700:400,color:m===model?"var(--brand)":"var(--text)",display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {m.split("/").pop()?.split(":")[0]||m}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {msgs.length>0&&<button onClick={()=>setMsgs([])} style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:6,cursor:"pointer",padding:4,color:"white",display:"flex"}}><RefreshCw size={11}/></button>}
            <button onClick={()=>setOpen(false)} style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:6,cursor:"pointer",padding:4,color:"white",display:"flex"}}><X size={13}/></button>
          </div>

          {/* Mode toggle */}
          <div style={{padding:"6px 10px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:6,flexShrink:0,background:"var(--bg-alt)"}}>
            <button onClick={()=>setWriteMode(false)}
              style={{display:"flex",alignItems:"center",gap:4,padding:"4px 9px",borderRadius:"var(--r-f)",border:`1.5px solid ${!writeMode?"#4f46e5":"var(--border)"}`,background:!writeMode?"rgba(79,70,229,.1)":"transparent",cursor:"pointer",fontSize:10,fontWeight:700,color:!writeMode?"#4f46e5":"var(--text-4)"}}>
              <MessageSquare size={9}/>Chat
            </button>
            <button onClick={()=>setWriteMode(true)}
              style={{display:"flex",alignItems:"center",gap:4,padding:"4px 9px",borderRadius:"var(--r-f)",border:`1.5px solid ${writeMode?"#059669":"var(--border)"}`,background:writeMode?"rgba(5,150,105,.1)":"transparent",cursor:"pointer",fontSize:10,fontWeight:700,color:writeMode?"#059669":"var(--text-4)"}}>
              <FilePen size={9}/>Write to Doc
            </button>
            {writeMode&&<span style={{fontSize:9,color:"#059669",marginLeft:"auto"}}>Writes at your cursor</span>}
          </div>

          {/* Quick actions — hidden in write mode to save space */}
          {!writeMode && (
            <div style={{padding:"6px 8px",borderBottom:"1px solid var(--border)",display:"flex",gap:4,flexWrap:"wrap",flexShrink:0}}>
              {ACTIONS.map(a=>(
                <button key={a.key} onClick={()=>ask(a.prompt,a.label)} disabled={loading}
                  style={{display:"flex",alignItems:"center",gap:3,padding:"3px 7px",fontSize:9,fontWeight:700,borderRadius:"var(--r-f)",cursor:"pointer",border:"1px solid",background:`${a.color}10`,color:a.color,borderColor:`${a.color}28`,opacity:loading?.5:1}}>
                  <a.icon size={8}/>{a.label}
                </button>
              ))}
            </div>
          )}

          {/* Writing guide prompts */}
          <div style={{padding:"5px 8px",borderBottom:"1px solid var(--border)",display:"flex",gap:4,flexWrap:"wrap",flexShrink:0,background:"var(--bg-alt)",overflowX:"auto"}}>
            <span style={{fontSize:9,fontWeight:800,color:"var(--text-4)",alignSelf:"center",whiteSpace:"nowrap",marginRight:2}}>WRITE:</span>
            {FORMAT_PROMPTS.map(f=>(
              <button key={f.label} onClick={()=>ask(f.prompt,f.label)} disabled={loading}
                style={{fontSize:9,fontWeight:600,padding:"3px 8px",borderRadius:99,border:"1px solid var(--border)",background:"var(--bg-card)",cursor:"pointer",color:"var(--text-3)",opacity:loading?.5:1,whiteSpace:"nowrap",flexShrink:0}}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div style={{flex:1,overflowY:"auto",padding:"8px 10px",display:"flex",flexDirection:"column",gap:8,minHeight:0}}>
            {!msgs.length&&(
              <div style={{textAlign:"center",padding:"16px 10px",color:"var(--text-4)"}}>
                <Sparkles size={22} style={{margin:"0 auto 7px",color:"#4f46e5",opacity:.5}}/>
                <p style={{fontSize:11,lineHeight:1.6}}>{writeMode?"AI will write directly at your cursor in the document.":"Use the actions above or type your request."}</p>
              </div>
            )}
            {msgs.map((m,i)=>(
              <div key={i} style={{display:"flex",gap:5,justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                {m.role==="ai"&&<div style={{width:20,height:20,borderRadius:"50%",background:"rgba(79,70,229,.12)",border:"1px solid rgba(79,70,229,.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Bot size={10} style={{color:"#4f46e5"}}/></div>}
                <div style={{maxWidth:"88%"}}>
                  <div style={{padding:"7px 10px",borderRadius:"var(--r-lg)",fontSize:12,lineHeight:1.65,whiteSpace:"pre-wrap",background:m.role==="user"?"#4f46e5":"var(--bg-alt)",color:m.role==="user"?"white":"var(--text)",border:m.role==="ai"?"1px solid var(--border)":"none"}}>
                    {m.text}
                  </div>
                  {m.role==="ai"&&!writeMode&&onInsertText&&!m.text.startsWith("Applied")&&!m.text.startsWith("Written")&&(
                    <button onClick={()=>onInsertText(m.text)}
                      style={{display:"flex",alignItems:"center",gap:4,marginTop:4,padding:"3px 8px",background:"rgba(79,70,229,.08)",border:"1px solid rgba(79,70,229,.2)",borderRadius:99,cursor:"pointer",fontSize:10,fontWeight:700,color:"#4f46e5"}}>
                      <CornerDownLeft size={9}/>Insert at cursor
                    </button>
                  )}
                </div>
              </div>
            ))}
            {loading&&(
              <div style={{display:"flex",gap:5}}>
                <div style={{width:20,height:20,borderRadius:"50%",background:"rgba(79,70,229,.12)",border:"1px solid rgba(79,70,229,.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Bot size={10} style={{color:"#4f46e5"}}/></div>
                <div style={{padding:"7px 10px",background:"var(--bg-alt)",borderRadius:"var(--r-lg)",border:"1px solid var(--border)",display:"flex",gap:4,alignItems:"center"}}>
                  {[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:"#4f46e5",opacity:.5,animation:`bounce .8s ${i*.15}s infinite alternate`}}/>)}
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Input */}
          <div style={{padding:"8px 10px",borderTop:"1px solid var(--border)",display:"flex",gap:6,flexShrink:0,background:"var(--bg-card)"}}>
            <input value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey&&input.trim()){e.preventDefault();ask(input.trim(),input.trim());}}}
              placeholder={writeMode?"What to write in the document…":"Ask or give an instruction…"}
              style={{flex:1,padding:"8px 10px",background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r-lg)",fontSize:12,color:"var(--text)",outline:"none"}}/>
            <button onClick={()=>input.trim()&&ask(input.trim(),input.trim())} disabled={loading||!input.trim()}
              style={{width:34,height:34,borderRadius:"50%",background:"#4f46e5",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:(!input.trim()||loading)?.4:1,flexShrink:0}}>
              <Send size={13} color="white"/>
            </button>
          </div>
        </div>
      )}
      <style>{`@keyframes bounce{from{transform:translateY(0)}to{transform:translateY(-5px)}}`}</style>
    </>
  );
}
