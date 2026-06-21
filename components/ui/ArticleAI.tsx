"use client";
import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, RefreshCw, Sparkles, BookOpen, Lightbulb, MessageSquare, Search, Key, ThumbsUp, AlertTriangle, Hash } from "lucide-react";

interface Props {
  articleId:   string;
  articleTitle:string;
  articleContent: string;
  isUnlocked:  boolean;
}

interface Msg { role:"user"|"ai"; text:string; action?:string; }

const QUICK_ACTIONS = [
  { key:"summarize",  icon:BookOpen,       label:"Summarize",     color:"#059669" },
  { key:"insights",   icon:Lightbulb,      label:"Key Insights",  color:"#d97706" },
  { key:"simplify",   icon:Sparkles,       label:"Simplify",      color:"#7c3aed" },
  { key:"keywords",   icon:Hash,           label:"Keywords",      color:"#0284c7" },
  { key:"questions",  icon:MessageSquare,  label:"Discuss",       color:"#db2777" },
  { key:"critique",   icon:AlertTriangle,  label:"Critique",      color:"#dc2626" },
  { key:"related",    icon:Search,         label:"Related Topics",color:"#0284c7" },
  { key:"sentiment",  icon:ThumbsUp,       label:"Tone Analysis", color:"#059669" },
];

export default function ArticleAI({ articleId, articleTitle, articleContent, isUnlocked }: Props) {
  const [open,     setOpen]     = useState(false);
  const [msgs,     setMsgs]     = useState<Msg[]>([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs]);

  async function ask(action?: string, question?: string) {
    if (!isUnlocked && !action?.includes("summarize")) {
      setMsgs(p=>[...p,{role:"ai",text:"🔒 Unlock the article first to use AI features on the full content. You can still ask for a summary of the preview."}]);
      return;
    }
    const displayText = action ? QUICK_ACTIONS.find(a=>a.key===action)?.label || action : question || "";
    setMsgs(p => [...p, { role:"user", text:displayText, action }]);
    setLoading(true); setError(""); setInput("");

    const plainContent = articleContent.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();

    const r = await fetch("/api/ai/chat", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ articleId, action, question, articleContent:plainContent, articleTitle }),
    });
    const d = await r.json();

    if (!r.ok || d.error) {
      setError(d.error || "AI request failed");
      setMsgs(p => [...p, { role:"ai", text:`Error: ${d.error || "AI request failed"}` }]);
    } else {
      setMsgs(p => [...p, { role:"ai", text:d.response }]);
    }
    setLoading(false);
  }

  function handleSend() {
    if (!input.trim() || loading) return;
    ask(undefined, input.trim());
  }

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position:"fixed", bottom:24, right:16, zIndex:200,
          width:52, height:52, borderRadius:"50%",
          background:"linear-gradient(135deg,var(--brand),var(--accent))",
          border:"2px solid white", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:"0 4px 20px rgba(109,40,217,.4)",
          transition:"transform .15s",
        }}
        title="AI Reading Assistant"
        onMouseEnter={e=>(e.currentTarget.style.transform="scale(1.08)")}
        onMouseLeave={e=>(e.currentTarget.style.transform="scale(1)")}
      >
        <Bot size={22} color="white"/>
        <span style={{
          position:"absolute", top:-4, right:-4,
          width:16, height:16, borderRadius:"50%",
          background:"var(--accent)", border:"2px solid white",
          fontSize:8, fontWeight:900, color:"white",
          display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Outfit,sans-serif",
        }}>AI</span>
      </button>

      {/* Drawer */}
      {open && (
        <div style={{ position:"fixed", inset:0, zIndex:300, display:"flex", justifyContent:"flex-end" }}
          onClick={e=>{ if(e.target===e.currentTarget) setOpen(false); }}>
          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.4)", backdropFilter:"blur(3px)" }}/>
          <div style={{
            position:"relative", width:"min(420px,100vw)", height:"100%",
            background:"var(--bg-card)", display:"flex", flexDirection:"column",
            boxShadow:"-4px 0 32px rgba(0,0,0,.2)",
          }}>
            {/* Header */}
            <div style={{ padding:"14px 16px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:10, flexShrink:0, background:"linear-gradient(135deg,var(--brand),var(--accent))" }}>
              <Bot size={18} color="white"/>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"Outfit,sans-serif", fontSize:14, fontWeight:800, color:"white", letterSpacing:"-.01em" }}>AI Reading Assistant</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,.75)", marginTop:1 }}>Powered by OpenRouter</div>
              </div>
              <button onClick={()=>setOpen(false)} style={{ background:"rgba(255,255,255,.2)", border:"none", cursor:"pointer", color:"white", width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <X size={13}/>
              </button>
            </div>

            {/* Quick actions */}
            {msgs.length === 0 && (
              <div style={{ padding:"14px", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
                <p style={{ fontSize:11, fontWeight:700, color:"var(--text-4)", textTransform:"uppercase", letterSpacing:".08em", marginBottom:10, fontFamily:"Outfit,sans-serif" }}>Quick Actions</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
                  {QUICK_ACTIONS.map(a => (
                    <button key={a.key} onClick={()=>ask(a.key)} disabled={loading}
                      style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 10px", background:"var(--bg-alt)", border:`1.5px solid ${a.color}22`, borderRadius:"var(--r)", cursor:"pointer", textAlign:"left", transition:"all .12s" }}
                      onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.background=`${a.color}10`; (e.currentTarget as HTMLElement).style.borderColor=`${a.color}44`; }}
                      onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.background="var(--bg-alt)"; (e.currentTarget as HTMLElement).style.borderColor=`${a.color}22`; }}>
                      <a.icon size={12} style={{ color:a.color, flexShrink:0 }}/>
                      <span style={{ fontSize:11, fontWeight:600, color:"var(--text-2)" }}>{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat messages */}
            <div style={{ flex:1, overflowY:"auto", padding:"12px 14px" }}>
              {msgs.length === 0 && (
                <div style={{ textAlign:"center", padding:"24px 12px", color:"var(--text-4)" }}>
                  <Bot size={36} style={{ marginBottom:10, opacity:.4 }}/>
                  <p style={{ fontSize:13, fontWeight:600, color:"var(--text-3)", marginBottom:4 }}>Ask me anything about this article</p>
                  <p style={{ fontSize:11, lineHeight:1.6 }}>Pick a quick action above or type your own question below.</p>
                </div>
              )}
              {msgs.map((m, i) => (
                <div key={i} style={{ marginBottom:14, display:"flex", flexDirection:"column", alignItems:m.role==="user"?"flex-end":"flex-start" }}>
                  {m.role === "user" ? (
                    <div style={{ background:"linear-gradient(135deg,var(--brand),var(--accent))", color:"white", padding:"8px 13px", borderRadius:"var(--r-lg) var(--r-lg) 4px var(--r-lg)", fontSize:13, maxWidth:"85%", fontWeight:600, fontFamily:"Outfit,sans-serif" }}>
                      {m.text}
                    </div>
                  ) : (
                    <div style={{ background:"var(--bg-alt)", border:"1px solid var(--border)", borderRadius:"4px var(--r-lg) var(--r-lg) var(--r-lg)", padding:"10px 13px", fontSize:13, maxWidth:"100%", lineHeight:1.65, color:"var(--text)" }}>
                      <div style={{ whiteSpace:"pre-wrap" }}>{m.text}</div>
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div style={{ display:"flex", gap:6, padding:"6px 0", alignItems:"center" }}>
                  {[0,1,2].map(i=>(
                    <div key={i} style={{ width:7, height:7, borderRadius:"50%", background:"var(--brand)", opacity:.6, animation:`bounce 1.2s ${i*0.2}s infinite` }}/>
                  ))}
                </div>
              )}
              <div ref={bottomRef}/>
            </div>

            {/* Input */}
            <div style={{ padding:"10px 12px", borderTop:"1px solid var(--border)", display:"flex", gap:8, flexShrink:0, background:"var(--bg-alt)" }}>
              {msgs.length > 0 && (
                <button onClick={()=>setMsgs([])} title="Clear chat"
                  style={{ width:34, height:34, borderRadius:"50%", border:"1.5px solid var(--border)", background:"var(--bg-card)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-4)", flexShrink:0 }}>
                  <RefreshCw size={12}/>
                </button>
              )}
              <input
                value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSend();} }}
                placeholder="Ask a question about this article…"
                style={{ flex:1, padding:"8px 12px", border:"1.5px solid var(--border)", borderRadius:"var(--r-f)", fontSize:13, color:"var(--text)", background:"var(--bg-card)", outline:"none" }}
              />
              <button onClick={handleSend} disabled={!input.trim()||loading}
                style={{ width:34, height:34, borderRadius:"50%", background:"var(--brand)", border:"none", cursor:!input.trim()||loading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", opacity:!input.trim()||loading?.5:1, flexShrink:0 }}>
                <Send size={13} color="white"/>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce { 0%,60%,100% { transform:translateY(0) } 30% { transform:translateY(-6px) } }
      `}</style>
    </>
  );
}
