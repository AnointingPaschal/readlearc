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

const QUICK = [
  { key:"summarize", icon:BookOpen,      label:"Summarize",      color:"#059669" },
  { key:"insights",  icon:Lightbulb,     label:"Key Insights",   color:"#d97706" },
  { key:"simplify",  icon:Sparkles,      label:"Simplify",       color:"#7c3aed" },
  { key:"keywords",  icon:Hash,          label:"Keywords",       color:"#0284c7" },
  { key:"questions", icon:MessageSquare, label:"Discussion Qs",  color:"#db2777" },
  { key:"critique",  icon:AlertTriangle, label:"Critique",       color:"#dc2626" },
  { key:"related",   icon:Search,        label:"Related Topics", color:"#0284c7" },
  { key:"sentiment", icon:ThumbsUp,      label:"Tone Analysis",  color:"#059669" },
];

const FREE_MODELS = [
  "anthropic/claude-haiku-4-5",
  "openai/gpt-4o-mini",
  "meta-llama/llama-3.1-8b-instruct:free",
  "google/gemini-flash-1.5",
  "deepseek/deepseek-chat",
  "mistralai/mixtral-8x7b-instruct",
  "qwen/qwen-2.5-72b-instruct",
];

const STORE_KEY = (id:string) => `rl-ai-chat-${id}`;

export default function ArticleAI({ articleId, articleTitle, articleContent, isUnlocked }: Props) {
  const [open,      setOpen]      = useState(false);
  const [msgs,      setMsgs]      = useState<Msg[]>([]);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [model,     setModel]     = useState("");
  const [models,    setModels]    = useState<string[]>(FREE_MODELS);
  const [showModel, setShowModel] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  // Load saved chat + model config
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORE_KEY(articleId));
      if (saved) setMsgs(JSON.parse(saved));
    } catch {}
    // Load model from admin settings
    fetch("/api/openrouter/models").then(r=>r.json()).then(d => {
      const m = d.activeModel || FREE_MODELS[0];
      setModel(m);
      if (d.models?.length) setModels(d.models.map((x:any)=>x.id||x).filter(Boolean));
    }).catch(()=>{ setModel(FREE_MODELS[0]); });
  }, [articleId]);

  // Save chat to localStorage when messages change
  useEffect(() => {
    if (!msgs.length) return;
    try { localStorage.setItem(STORE_KEY(articleId), JSON.stringify(msgs.slice(-30))); } catch {}
  }, [msgs, articleId]);

  useEffect(() => {
    if (open) { setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:"smooth"}),100); }
  }, [msgs, open]);

  useEffect(() => { if (open) setTimeout(()=>inputRef.current?.focus(),200); }, [open]);

  async function ask(action?:string, question?:string) {
    const displayText = action ? (QUICK.find(a=>a.key===action)?.label||action) : (question||"");
    setMsgs(p=>[...p,{role:"user",text:displayText}]);
    setLoading(true); setInput("");
    const plain = articleContent.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim().slice(0,4000);
    const r = await fetch("/api/ai/chat",{
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({articleId,action,question,articleContent:plain,articleTitle,model}),
    });
    const d = await r.json();
    setMsgs(p=>[...p,{role:"ai",text:d.error?`⚠️ ${d.error}`:d.response}]);
    setLoading(false);
  }

  function clearChat() {
    setMsgs([]); localStorage.removeItem(STORE_KEY(articleId));
  }

  function handleSend() { if(!input.trim()||loading)return; ask(undefined,input.trim()); }

  const shortModel = model.split("/").pop()?.slice(0,22)||model;

  return (
    <>
      {/* Trigger */}
      <button onClick={()=>setOpen(true)} title="AI Reading Assistant"
        style={{ position:"fixed",bottom:20,right:14,zIndex:200,width:50,height:50,borderRadius:"50%",background:"linear-gradient(135deg,var(--brand),var(--accent))",border:"2.5px solid white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 18px rgba(109,40,217,.45)",transition:"transform .15s" }}
        onMouseEnter={e=>(e.currentTarget.style.transform="scale(1.1)")}
        onMouseLeave={e=>(e.currentTarget.style.transform="scale(1)")}>
        <Bot size={20} color="white"/>
        <span style={{position:"absolute",top:-4,right:-4,width:17,height:17,borderRadius:"50%",background:"var(--accent)",border:"2px solid white",fontSize:8,fontWeight:900,color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Outfit,sans-serif"}}>AI</span>
      </button>

      {open && (
        <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",justifyContent:"flex-end"}}
          onClick={e=>{if(e.target===e.currentTarget)setOpen(false);}}>
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.4)",backdropFilter:"blur(3px)"}}/>
          <div style={{position:"relative",width:"min(400px,100vw)",height:"100%",background:"var(--bg-card)",display:"flex",flexDirection:"column",boxShadow:"-4px 0 32px rgba(0,0,0,.2)"}}>

            {/* Header */}
            <div style={{padding:"12px 14px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:10,flexShrink:0,background:"linear-gradient(135deg,var(--brand),var(--accent))"}}>
              <Bot size={17} color="white"/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:800,color:"white"}}>AI Reading Assistant</div>
                {/* Model selector */}
                <div style={{position:"relative"}}>
                  <button onClick={()=>setShowModel(v=>!v)}
                    style={{display:"flex",alignItems:"center",gap:3,background:"rgba(255,255,255,.18)",border:"none",borderRadius:4,padding:"2px 7px",cursor:"pointer",marginTop:2}}>
                    <span style={{fontSize:9,color:"rgba(255,255,255,.9)",fontFamily:"JetBrains Mono,monospace",whiteSpace:"nowrap",overflow:"hidden",maxWidth:180,textOverflow:"ellipsis"}}>{shortModel}</span>
                    <ChevronDown size={9} color="rgba(255,255,255,.8)"/>
                  </button>
                  {showModel && (
                    <div style={{position:"absolute",top:"110%",left:0,background:"var(--bg-card)",border:"1.5px solid var(--border)",borderRadius:"var(--r-lg)",boxShadow:"var(--shadow-lg)",zIndex:10,minWidth:240,maxHeight:260,overflowY:"auto"}}>
                      {models.map(m=>(
                        <button key={m} onClick={()=>{setModel(m);setShowModel(false);}}
                          style={{width:"100%",textAlign:"left",padding:"8px 12px",border:"none",background:m===model?"var(--brand-muted)":"transparent",cursor:"pointer",fontSize:11,color:m===model?"var(--brand)":"var(--text-2)",fontFamily:"JetBrains Mono,monospace",borderBottom:"1px solid var(--border)",display:"block"}}
                          onMouseEnter={e=>{if(m!==model)(e.currentTarget as HTMLElement).style.background="var(--bg-alt)";}}
                          onMouseLeave={e=>{if(m!==model)(e.currentTarget as HTMLElement).style.background="transparent";}}>
                          {m}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button onClick={()=>setOpen(false)} style={{background:"rgba(255,255,255,.2)",border:"none",cursor:"pointer",color:"white",width:26,height:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <X size={12}/>
              </button>
            </div>

            {/* Quick actions — only when no chat yet */}
            {msgs.length===0 && (
              <div style={{padding:"12px 12px 8px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
                <p style={{fontSize:10,fontWeight:700,color:"var(--text-4)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:9,fontFamily:"Outfit,sans-serif"}}>Quick Actions</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                  {QUICK.map(a=>(
                    <button key={a.key} onClick={()=>ask(a.key)} disabled={loading}
                      style={{display:"flex",alignItems:"center",gap:6,padding:"7px 9px",background:"var(--bg-alt)",border:`1.5px solid ${a.color}22`,borderRadius:"var(--r)",cursor:"pointer",textAlign:"left",transition:"all .12s"}}
                      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background=`${a.color}10`;(e.currentTarget as HTMLElement).style.borderColor=`${a.color}44`;}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="var(--bg-alt)";(e.currentTarget as HTMLElement).style.borderColor=`${a.color}22`;}}>
                      <a.icon size={11} style={{color:a.color,flexShrink:0}}/>
                      <span style={{fontSize:11,fontWeight:600,color:"var(--text-2)"}}>{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div style={{flex:1,overflowY:"auto",padding:"12px 12px 4px"}}>
              {msgs.length===0 && (
                <div style={{textAlign:"center",padding:"28px 12px",color:"var(--text-4)"}}>
                  <div style={{width:48,height:48,borderRadius:"50%",background:"var(--brand-muted)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>
                    <Bot size={22} color="var(--brand)"/>
                  </div>
                  <p style={{fontSize:13,fontWeight:600,color:"var(--text-3)",marginBottom:4}}>Ask me anything</p>
                  <p style={{fontSize:11,lineHeight:1.6}}>Pick a quick action or type your question below.</p>
                </div>
              )}
              {msgs.map((m,i)=>(
                <div key={i} style={{marginBottom:12,display:"flex",flexDirection:"column",alignItems:m.role==="user"?"flex-end":"flex-start"}}>
                  {m.role==="user" ? (
                    <div style={{background:"linear-gradient(135deg,var(--brand),var(--accent))",color:"white",padding:"8px 12px",borderRadius:"var(--r-lg) var(--r-lg) 4px var(--r-lg)",fontSize:12,maxWidth:"85%",fontWeight:600,fontFamily:"Outfit,sans-serif"}}>
                      {m.text}
                    </div>
                  ) : (
                    <div style={{background:"var(--bg-alt)",border:"1px solid var(--border)",borderRadius:"4px var(--r-lg) var(--r-lg) var(--r-lg)",padding:"10px 12px",fontSize:12,maxWidth:"100%",lineHeight:1.7,color:"var(--text)"}}>
                      <div style={{whiteSpace:"pre-wrap"}}>{m.text}</div>
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div style={{display:"flex",gap:5,padding:"6px 0",alignItems:"center"}}>
                  {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:"var(--brand)",animation:`aidot 1.2s ${i*.2}s infinite ease-in-out`}}/>)}
                </div>
              )}
              <div ref={bottomRef}/>
            </div>

            {/* Input */}
            <div style={{padding:"8px 10px",borderTop:"1px solid var(--border)",display:"flex",gap:7,flexShrink:0,background:"var(--bg-alt)"}}>
              {msgs.length>0 && (
                <button onClick={clearChat} title="Clear chat"
                  style={{width:32,height:32,borderRadius:"50%",border:"1.5px solid var(--border)",background:"var(--bg-card)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-4)",flexShrink:0}}>
                  <RefreshCw size={11}/>
                </button>
              )}
              <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSend();}}}
                placeholder="Ask about this article…"
                style={{flex:1,padding:"7px 11px",border:"1.5px solid var(--border)",borderRadius:"var(--r-f)",fontSize:12,color:"var(--text)",background:"var(--bg-card)",outline:"none"}}/>
              <button onClick={handleSend} disabled={!input.trim()||loading}
                style={{width:32,height:32,borderRadius:"50%",background:"var(--brand)",border:"none",cursor:!input.trim()||loading?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:!input.trim()||loading?.4:1,flexShrink:0}}>
                <Send size={12} color="white"/>
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes aidot{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
    </>
  );
}

function Bot({size,color}:{size:number;color?:string}){
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color||"currentColor"} strokeWidth={2}><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="9" cy="16" r="1" fill={color||"currentColor"}/><circle cx="15" cy="16" r="1" fill={color||"currentColor"}/><path d="M12 2v3m-4 0h8M8 5a2 2 0 0 0-2 2v4m12-4a2 2 0 0 0-2-2M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" strokeLinecap="round"/></svg>;
}
