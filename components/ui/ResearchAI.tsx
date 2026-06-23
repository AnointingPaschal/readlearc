"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  X, Send, Bot, Wand2, PenLine, List, Quote, Search,
  RefreshCw, ClipboardList, BookOpen, Sparkles, ChevronDown,
  FilePen, MessageSquare, CornerDownLeft,
} from "lucide-react";

interface Msg { role:"user"|"ai"; text:string; }

// Strip markdown formatting from AI responses
function clean(text: string): string {
  return text
    .replace(/#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_{2}([^_]+)_{2}/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```\w*\n?/g,"").trim())
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/^\s*>\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Parse natural-language formatting prompts → FormatSpec
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
  { key:"improve",  icon:Wand2,         label:"Improve",     color:"#7c3aed", prompt:"Improve the writing quality, clarity and academic tone:" },
  { key:"expand",   icon:PenLine,       label:"Expand",      color:"#0284c7", prompt:"Expand with more detail and supporting arguments:" },
  { key:"outline",  icon:List,          label:"Outline",     color:"#059669", prompt:"Generate a detailed academic outline for this paper:" },
  { key:"citations",icon:Quote,         label:"Citations",   color:"#d97706", prompt:"Suggest 5 relevant academic citations with brief justification:" },
  { key:"method",   icon:ClipboardList, label:"Check Method",color:"#dc2626", prompt:"Review the methodology and suggest improvements:" },
  { key:"keywords", icon:Search,        label:"Keywords",    color:"#db2777", prompt:"Extract 8-10 academic keywords, comma-separated:" },
  { key:"shorter",  icon:RefreshCw,     label:"Shorter",     color:"#0891b2", prompt:"Condense this text to about half its length, keeping key points:" },
  { key:"related",  icon:BookOpen,      label:"Related Lit", color:"#16a34a", prompt:"Suggest 5 related research areas or theories to explore:" },
];

const FORMAT_PROMPTS = [
  { label:"Formal Academic", prompt:"Rewrite in a formal academic tone with proper scholarly language" },
  { label:"Add Introduction", prompt:"Write a compelling introduction paragraph for this section" },
  { label:"Fix Grammar", prompt:"Fix all grammar, punctuation and spelling errors" },
  { label:"More Concise", prompt:"Make this more concise, removing redundancy" },
  { label:"Add Transitions", prompt:"Improve flow by adding better transitional phrases between paragraphs" },
  { label:"Passive → Active", prompt:"Convert passive voice sentences to active voice" },
];

export default function ResearchAI({
  paperTitle, sectionTitle, sectionContent, onApplyFormat, onInsertText,
}: {
  paperTitle: string;
  sectionTitle: string;
  sectionContent: string;
  onApplyFormat?: (spec: any) => void;
  onInsertText?: (text: string) => void;
}) {
  const [open,       setOpen]       = useState(false);
  const [msgs,       setMsgs]       = useState<Msg[]>([]);
  const [input,      setInput]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [model,      setModel]      = useState("");
  const [models,     setModels]     = useState<string[]>([]);
  const [writeMode,  setWriteMode]  = useState(false);
  const [showModels, setShowModels] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/openrouter/models").then(r=>r.json()).then(d=>{
      const all: string[] = [];
      if (d.activeModel) { setModel(d.activeModel); all.push(d.activeModel); }
      if (Array.isArray(d.models)) {
        d.models.forEach((m: any) => {
          const id = typeof m==="string" ? m : m.id || m.name || "";
          if (id && !all.includes(id)) all.push(id);
        });
      }
      setModels(all);
    }).catch(()=>{});
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:"smooth"}); }, [msgs]);

  const getContext = useCallback(() => [
    paperTitle     ? `Paper: "${paperTitle}"`       : "",
    sectionTitle   ? `Section: ${sectionTitle}`     : "",
    sectionContent ? `Content:\n${sectionContent.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim().slice(0,3000)}` : "",
  ].filter(Boolean).join("\n\n"), [paperTitle, sectionTitle, sectionContent]);

  async function ask(prompt: string, userLabel: string) {
    setMsgs(p=>[...p,{role:"user",text:userLabel}]);
    setLoading(true); setInput("");

    // Formatting prompt — apply instantly
    if (onApplyFormat) {
      const fmt = parseFormatting(userLabel);
      if (fmt) {
        onApplyFormat(fmt);
        const applied = Object.entries(fmt).map(([k,v]) => `${k}: ${v}`).join(", ");
        setMsgs(p=>[...p.slice(0,-1),{role:"user",text:userLabel},{role:"ai",text:`✅ Applied: ${applied}`}]);
        setLoading(false); return;
      }
    }

    try {
      const r = await fetch("/api/ai/chat", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ articleId:"research-studio", question:`${prompt}\n\n${getContext()}`, articleContent:getContext(), articleTitle:paperTitle||"Research Paper", model }),
      });
      const d = await r.json();
      const text = clean(d.response || d.error || "No response.");
      if (writeMode && onInsertText) {
        onInsertText(text);
        setMsgs(p=>[...p.slice(0,-1),{role:"user",text:userLabel},{role:"ai",text:"✅ Written directly into your document at the cursor position."}]);
      } else {
        setMsgs(p=>[...p.slice(0,-1),{role:"user",text:userLabel},{role:"ai",text}]);
      }
    } catch {
      setMsgs(p=>[...p.slice(0,-1),{role:"user",text:userLabel},{role:"ai",text:"Connection error. Check AI settings."}]);
    }
    setLoading(false);
  }

  const modelShort = model ? model.split("/").pop()?.split(":")[0] || model : "Select model";

  return (
    <>
      {/* Floating button */}
      <button onClick={()=>setOpen(o=>!o)}
        style={{ position:"fixed", bottom:"calc(var(--bottom-nav-h,0px) + 80px)", right:16, zIndex:200, width:48, height:48, borderRadius:"50%", background:"#4f46e5", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 20px rgba(79,70,229,.45)", transition:"transform .2s" }}
        onMouseEnter={e=>(e.currentTarget.style.transform="scale(1.08)")}
        onMouseLeave={e=>(e.currentTarget.style.transform="scale(1)")}
        title="AI Research Assistant">
        {open ? <X size={20} color="white"/> : <Bot size={20} color="white"/>}
      </button>

      {/* Panel */}
      {open && (
        <div style={{ position:"fixed", bottom:"calc(var(--bottom-nav-h,0px) + 136px)", right:12, zIndex:200, width:"min(400px,calc(100vw - 24px))", height:"min(600px,calc(100vh - 160px))", background:"var(--bg-card)", border:"1.5px solid var(--border)", borderRadius:"var(--r-xl)", boxShadow:"0 8px 40px rgba(0,0,0,.18)", display:"flex", flexDirection:"column", overflow:"hidden" }}>

          {/* Header */}
          <div style={{ padding:"10px 14px", background:"#4f46e5", display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
            <Bot size={15} color="white"/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:800,color:"white"}}>Research AI</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,.7)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sectionTitle||"No section"}</div>
            </div>

            {/* Model selector */}
            <div style={{position:"relative"}}>
              <button onClick={()=>setShowModels(o=>!o)}
                style={{display:"flex",alignItems:"center",gap:4,padding:"4px 8px",background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.2)",borderRadius:6,cursor:"pointer",color:"white",fontSize:10,fontWeight:600,maxWidth:100,overflow:"hidden"}}>
                <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{modelShort}</span>
                <ChevronDown size={9} style={{flexShrink:0}}/>
              </button>
              {showModels && models.length>0 && (
                <div style={{position:"absolute",top:"calc(100% + 4px)",right:0,background:"var(--bg-card)",border:"1.5px solid var(--border)",borderRadius:"var(--r-lg)",boxShadow:"0 8px 24px rgba(0,0,0,.15)",zIndex:300,minWidth:200,maxHeight:200,overflowY:"auto",padding:"4px 0"}}>
                  {models.map(m=>(
                    <button key={m} onClick={()=>{setModel(m);setShowModels(false);}}
                      style={{width:"100%",padding:"8px 12px",background:m===model?"var(--brand-muted)":"none",border:"none",cursor:"pointer",textAlign:"left",fontSize:11,fontWeight:m===model?700:400,color:m===model?"var(--brand)":"var(--text)",display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {m.split("/").pop()?.split(":")[0]||m}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {msgs.length>0 && <button onClick={()=>setMsgs([])} title="Clear" style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:6,cursor:"pointer",padding:4,color:"white",display:"flex"}}><RefreshCw size={11}/></button>}
          </div>

          {/* Write mode toggle */}
          <div style={{padding:"7px 12px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:8,flexShrink:0,background:"var(--bg-alt)"}}>
            <button onClick={()=>setWriteMode(false)}
              style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:"var(--r-f)",border:`1.5px solid ${!writeMode?"#4f46e5":"var(--border)"}`,background:!writeMode?"rgba(79,70,229,.1)":"transparent",cursor:"pointer",fontSize:10,fontWeight:700,color:!writeMode?"#4f46e5":"var(--text-4)"}}>
              <MessageSquare size={10}/>Chat
            </button>
            <button onClick={()=>setWriteMode(true)}
              style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:"var(--r-f)",border:`1.5px solid ${writeMode?"#059669":"var(--border)"}`,background:writeMode?"rgba(5,150,105,.1)":"transparent",cursor:"pointer",fontSize:10,fontWeight:700,color:writeMode?"#059669":"var(--text-4)"}}>
              <FilePen size={10}/>Write to Editor
            </button>
            {writeMode && <span style={{fontSize:9,color:"#059669",marginLeft:"auto"}}>AI types directly at your cursor</span>}
          </div>

          {/* Quick actions */}
          <div style={{padding:"8px 10px",borderBottom:"1px solid var(--border)",display:"flex",gap:4,flexWrap:"wrap",flexShrink:0}}>
            {ACTIONS.map(a=>(
              <button key={a.key} onClick={()=>ask(a.prompt,a.label)} disabled={loading}
                style={{display:"flex",alignItems:"center",gap:3,padding:"3px 8px",fontSize:9,fontWeight:700,borderRadius:"var(--r-f)",cursor:"pointer",border:"1px solid",background:`${a.color}10`,color:a.color,borderColor:`${a.color}28`,opacity:loading?.5:1}}>
                <a.icon size={9}/>{a.label}
              </button>
            ))}
          </div>

          {/* Format pre-prompts */}
          <div style={{padding:"6px 10px",borderBottom:"1px solid var(--border)",display:"flex",gap:4,flexWrap:"wrap",flexShrink:0,background:"var(--bg-alt)"}}>
            <span style={{fontSize:9,fontWeight:700,color:"var(--text-4)",alignSelf:"center",marginRight:2}}>FORMAT:</span>
            {FORMAT_PROMPTS.map(f=>(
              <button key={f.label} onClick={()=>ask(f.prompt,f.label)} disabled={loading}
                style={{fontSize:9,fontWeight:600,padding:"3px 8px",borderRadius:99,border:"1px solid var(--border)",background:"var(--bg-card)",cursor:"pointer",color:"var(--text-3)",opacity:loading?.5:1}}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div style={{flex:1,overflowY:"auto",padding:"10px 12px",display:"flex",flexDirection:"column",gap:10}}>
            {!msgs.length && (
              <div style={{textAlign:"center",padding:"20px 12px",color:"var(--text-4)"}}>
                <Sparkles size={24} style={{margin:"0 auto 8px",color:"#4f46e5",opacity:.5}}/>
                <p style={{fontSize:11,lineHeight:1.6}}>{writeMode?"AI will write directly into your document at the cursor.":"Ask anything or use the quick actions above."}</p>
              </div>
            )}
            {msgs.map((m,i)=>(
              <div key={i} style={{display:"flex",gap:6,justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                {m.role==="ai" && <div style={{width:22,height:22,borderRadius:"50%",background:"rgba(79,70,229,.12)",border:"1px solid rgba(79,70,229,.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Bot size={11} style={{color:"#4f46e5"}}/></div>}
                <div style={{maxWidth:"85%",position:"relative"}}>
                  <div style={{padding:"8px 11px",borderRadius:"var(--r-lg)",fontSize:12,lineHeight:1.65,whiteSpace:"pre-wrap",background:m.role==="user"?"#4f46e5":"var(--bg-alt)",color:m.role==="user"?"white":"var(--text)",border:m.role==="ai"?"1px solid var(--border)":"none"}}>
                    {m.text}
                  </div>
                  {/* Insert button — only on AI messages, only in chat mode */}
                  {m.role==="ai" && !writeMode && onInsertText && !m.text.startsWith("✅") && (
                    <button onClick={()=>onInsertText(m.text)}
                      style={{display:"flex",alignItems:"center",gap:4,marginTop:4,padding:"3px 8px",background:"rgba(79,70,229,.08)",border:"1px solid rgba(79,70,229,.2)",borderRadius:99,cursor:"pointer",fontSize:10,fontWeight:700,color:"#4f46e5"}}>
                      <CornerDownLeft size={10}/>Insert at cursor
                    </button>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{display:"flex",gap:6}}>
                <div style={{width:22,height:22,borderRadius:"50%",background:"rgba(79,70,229,.12)",border:"1px solid rgba(79,70,229,.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Bot size={11} style={{color:"#4f46e5"}}/></div>
                <div style={{padding:"8px 12px",background:"var(--bg-alt)",borderRadius:"var(--r-lg)",border:"1px solid var(--border)",display:"flex",gap:4,alignItems:"center"}}>
                  {[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:"#4f46e5",opacity:.5,animation:`bounce .8s ${i*.15}s infinite alternate`}}/>)}
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Input */}
          <div style={{padding:"9px 10px",borderTop:"1px solid var(--border)",display:"flex",gap:7,flexShrink:0}}>
            <input value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey&&input.trim()){e.preventDefault();ask(input.trim(),input.trim());}}}
              placeholder={writeMode?"Describe what to write in the editor…":"Ask about your research…"}
              style={{flex:1,padding:"8px 11px",background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r-lg)",fontSize:12,color:"var(--text)",outline:"none"}}/>
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
