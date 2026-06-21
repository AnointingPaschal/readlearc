"use client";
import { useState, useRef, useEffect } from "react";
import { X, Send, RefreshCw, Sparkles, BookOpen, Lightbulb, MessageSquare, Search, ThumbsUp, AlertTriangle, Hash, ChevronDown, Bot } from "lucide-react";

interface Props {
  articleId:      string;
  articleTitle:   string;
  articleContent: string;
  isUnlocked:     boolean;
}
interface Msg { role:"user"|"ai"; text:string; }

const ACTIONS = [
  { key:"summarize", icon:BookOpen,      label:"Summarize",      color:"#059669" },
  { key:"insights",  icon:Lightbulb,     label:"Key Insights",   color:"#d97706" },
  { key:"simplify",  icon:Sparkles,      label:"Simplify",       color:"#7c3aed" },
  { key:"keywords",  icon:Hash,          label:"Keywords",       color:"#0284c7" },
  { key:"questions", icon:MessageSquare, label:"Discussion Qs",  color:"#db2777" },
  { key:"critique",  icon:AlertTriangle, label:"Critique",       color:"#dc2626" },
  { key:"related",   icon:Search,        label:"Related Topics", color:"#0284c7" },
  { key:"sentiment", icon:ThumbsUp,      label:"Tone Analysis",  color:"#059669" },
];

const STORAGE_KEY = (id: string) => `rl-ai-chat-${id}`;
const MODEL_KEY   = "rl-ai-model-pref";

export default function ArticleAI({ articleId, articleTitle, articleContent, isUnlocked }: Props) {
  const [open,    setOpen]    = useState(false);
  const [msgs,    setMsgs]    = useState<Msg[]>([]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [models,  setModels]  = useState<string[]>([]);
  const [model,   setModel]   = useState("");
  const [showModels, setShowModels] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load saved chat + model pref
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY(articleId));
      if (saved) setMsgs(JSON.parse(saved));
    } catch {}
    try {
      const pref = localStorage.getItem(MODEL_KEY);
      if (pref) setModel(pref);
    } catch {}
    // Load available models
    fetch("/api/openrouter/models").then(r=>r.json()).then(d => {
      const ms: string[] = (d.models||[]).map((m:any)=>m.id||m).filter(Boolean);
      if (d.activeModel) { setModels([d.activeModel,...ms.filter((m:string)=>m!==d.activeModel)]); if (!model) setModel(d.activeModel); }
      else { setModels(ms); if (ms.length && !model) setModel(ms[0]); }
    });
  }, [articleId]);

  // Save chat to localStorage on change
  useEffect(() => {
    if (!msgs.length) return;
    try { localStorage.setItem(STORAGE_KEY(articleId), JSON.stringify(msgs.slice(-30))); } catch {}
  }, [msgs, articleId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs, loading]);

  function selectModel(m: string) {
    setModel(m);
    setShowModels(false);
    try { localStorage.setItem(MODEL_KEY, m); } catch {}
  }

  async function ask(action?:string, question?:string) {
    const label = action ? ACTIONS.find(a=>a.key===action)?.label||action : question||"";
    setMsgs(p => [...p, { role:"user", text:label }]);
    setLoading(true); setInput("");

    const plain = articleContent.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
    const r = await fetch("/api/ai/chat", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ articleId, action, question, articleContent:plain, articleTitle, model }),
    });
    const d = await r.json();
    const reply = d.response || d.error || "Something went wrong.";
    setMsgs(p => [...p, { role:"ai", text:reply }]);
    setLoading(false);
  }

  function clearChat() {
    setMsgs([]);
    try { localStorage.removeItem(STORAGE_KEY(articleId)); } catch {}
  }

  return (
    <>
      {/* Floating button */}
      <button onClick={()=>setOpen(true)}
        style={{ position:"fixed",bottom:22,right:14,zIndex:200,width:50,height:50,borderRadius:"50%",background:"linear-gradient(135deg,var(--brand),var(--accent))",border:"2.5px solid white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 18px rgba(109,40,217,.45)",transition:"transform .15s" }}
        title="AI Reading Assistant"
        onMouseEnter={e=>(e.currentTarget.style.transform="scale(1.1)")}
        onMouseLeave={e=>(e.currentTarget.style.transform="scale(1)")}>
        <Bot size={20} color="white"/>
        <span style={{ position:"absolute",top:-4,right:-4,width:16,height:16,borderRadius:"50%",background:"var(--accent)",border:"2px solid white",fontSize:7,fontWeight:900,color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Outfit,sans-serif" }}>AI</span>
      </button>

      {/* Drawer */}
      {open && (
        <div style={{ position:"fixed",inset:0,zIndex:300,display:"flex",justifyContent:"flex-end" }}
          onClick={e=>{ if(e.target===e.currentTarget) setOpen(false); }}>
          <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,.45)",backdropFilter:"blur(3px)" }}/>

          <div style={{ position:"relative",width:"min(400px,100vw)",height:"100%",background:"var(--bg-card)",display:"flex",flexDirection:"column",boxShadow:"-4px 0 32px rgba(0,0,0,.2)" }}>

            {/* Header */}
            <div style={{ padding:"12px 14px",borderBottom:"1px solid var(--border)",background:"linear-gradient(135deg,var(--brand),var(--accent))",flexShrink:0 }}>
              <div style={{ display:"flex",alignItems:"center",gap:9,marginBottom:8 }}>
                <Bot size={16} color="white"/>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:800,color:"white" }}>AI Reading Assistant</div>
                  <div style={{ fontSize:9,color:"rgba(255,255,255,.75)",marginTop:1 }}>Powered by OpenRouter</div>
                </div>
                <div style={{ display:"flex",gap:6 }}>
                  {msgs.length>0&&<button onClick={clearChat} title="Clear chat" style={{ width:26,height:26,borderRadius:"50%",border:"none",background:"rgba(255,255,255,.2)",cursor:"pointer",color:"white",display:"flex",alignItems:"center",justifyContent:"center" }}><RefreshCw size={11}/></button>}
                  <button onClick={()=>setOpen(false)} style={{ width:26,height:26,borderRadius:"50%",border:"none",background:"rgba(255,255,255,.2)",cursor:"pointer",color:"white",display:"flex",alignItems:"center",justifyContent:"center" }}><X size={12}/></button>
                </div>
              </div>

              {/* Model selector */}
              <div style={{ position:"relative" }}>
                <button onClick={()=>setShowModels(v=>!v)}
                  style={{ width:"100%",display:"flex",alignItems:"center",gap:6,padding:"6px 10px",background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.25)",borderRadius:"var(--r)",cursor:"pointer",textAlign:"left" }}>
                  <span style={{ flex:1,fontSize:10,color:"white",fontFamily:"JetBrains Mono,monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                    {model || "Select model…"}
                  </span>
                  <ChevronDown size={10} style={{ color:"rgba(255,255,255,.7)",flexShrink:0,transform:showModels?"rotate(180deg)":"none",transition:"transform .2s" }}/>
                </button>
                {showModels&&models.length>0&&(
                  <div style={{ position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"var(--bg-card)",border:"1.5px solid var(--border)",borderRadius:"var(--r-lg)",boxShadow:"var(--shadow-lg)",zIndex:10,maxHeight:220,overflowY:"auto" }}>
                    {models.map(m=>(
                      <button key={m} onClick={()=>selectModel(m)}
                        style={{ width:"100%",display:"block",padding:"8px 12px",border:"none",borderBottom:"1px solid var(--border)",background:m===model?"var(--brand-muted)":"transparent",cursor:"pointer",textAlign:"left",fontSize:11,color:m===model?"var(--brand)":"var(--text-2)",fontFamily:"JetBrains Mono,monospace",fontWeight:m===model?700:400 }}>
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick actions */}
            {msgs.length===0&&(
              <div style={{ padding:"12px",borderBottom:"1px solid var(--border)",flexShrink:0 }}>
                <p style={{ fontSize:10,fontWeight:700,color:"var(--text-4)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:8,fontFamily:"Outfit,sans-serif" }}>Quick Actions</p>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:6 }}>
                  {ACTIONS.map(a=>(
                    <button key={a.key} onClick={()=>ask(a.key)} disabled={loading}
                      style={{ display:"flex",alignItems:"center",gap:6,padding:"7px 9px",background:"var(--bg-alt)",border:`1.5px solid ${a.color}20`,borderRadius:"var(--r)",cursor:"pointer",textAlign:"left" }}
                      onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.background=`${a.color}12`; }}
                      onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.background="var(--bg-alt)"; }}>
                      <a.icon size={11} style={{ color:a.color,flexShrink:0 }}/>
                      <span style={{ fontSize:11,fontWeight:600,color:"var(--text-2)" }}>{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat */}
            <div style={{ flex:1,overflowY:"auto",padding:"12px 12px" }}>
              {msgs.length===0&&(
                <div style={{ textAlign:"center",padding:"24px 12px",color:"var(--text-4)" }}>
                  <Bot size={32} style={{ marginBottom:10,opacity:.35 }} color="var(--brand)"/>
                  <p style={{ fontSize:13,fontWeight:600,color:"var(--text-3)",marginBottom:4 }}>Ask me anything</p>
                  <p style={{ fontSize:11,lineHeight:1.6 }}>Pick an action above or type your question.</p>
                </div>
              )}
              {msgs.map((m,i)=>(
                <div key={i} style={{ marginBottom:12,display:"flex",flexDirection:"column",alignItems:m.role==="user"?"flex-end":"flex-start" }}>
                  {m.role==="user"?(
                    <div style={{ background:"linear-gradient(135deg,var(--brand),var(--accent))",color:"white",padding:"7px 12px",borderRadius:"var(--r-lg) var(--r-lg) 4px var(--r-lg)",fontSize:12,maxWidth:"85%",fontWeight:600,fontFamily:"Outfit,sans-serif" }}>{m.text}</div>
                  ):(
                    <div style={{ background:"var(--bg-alt)",border:"1px solid var(--border)",borderRadius:"4px var(--r-lg) var(--r-lg) var(--r-lg)",padding:"9px 12px",fontSize:12,maxWidth:"100%",lineHeight:1.62,color:"var(--text)",whiteSpace:"pre-wrap" }}>{m.text}</div>
                  )}
                </div>
              ))}
              {loading&&(
                <div style={{ display:"flex",gap:5,padding:"6px 0",alignItems:"center" }}>
                  {[0,1,2].map(i=><div key={i} style={{ width:6,height:6,borderRadius:"50%",background:"var(--brand)",animation:`aibounce 1.2s ${i*0.2}s infinite` }}/>)}
                </div>
              )}
              <div ref={bottomRef}/>
            </div>

            {/* Input */}
            <div style={{ padding:"10px 10px",borderTop:"1px solid var(--border)",display:"flex",gap:7,flexShrink:0,background:"var(--bg-alt)" }}>
              {msgs.length>0&&(
                <button onClick={()=>{ setShowModels(false); setMsgs([]); }} title="New chat"
                  style={{ width:32,height:32,borderRadius:"50%",border:"1.5px solid var(--border)",background:"var(--bg-card)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-4)",flexShrink:0 }}>
                  <RefreshCw size={11}/>
                </button>
              )}
              <input value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey&&input.trim()){e.preventDefault();ask(undefined,input.trim());} }}
                placeholder="Ask about this article…"
                style={{ flex:1,padding:"7px 11px",border:"1.5px solid var(--border)",borderRadius:"var(--r-f)",fontSize:12,color:"var(--text)",background:"var(--bg-card)",outline:"none" }}/>
              <button onClick={()=>input.trim()&&ask(undefined,input.trim())} disabled={!input.trim()||loading}
                style={{ width:32,height:32,borderRadius:"50%",background:"var(--brand)",border:"none",cursor:!input.trim()||loading?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:!input.trim()||loading?.45:1,flexShrink:0 }}>
                <Send size={12} color="white"/>
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes aibounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
    </>
  );
}
