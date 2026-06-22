"use client";
import { useState, useRef, useEffect } from "react";
import {
  Sparkles, X, Send, Bot, Lightbulb, FileText, Search,
  RefreshCw, ChevronDown, BookOpen, PenLine, CheckCircle2,
  Wand2, Quote, List, ClipboardList,
} from "lucide-react";

interface Msg { role: "user" | "ai"; text: string; }

const ACTIONS = [
  { key: "improve",   icon: Wand2,        label: "Improve Writing",     color: "#7c3aed" },
  { key: "expand",    icon: PenLine,      label: "Expand This",         color: "#0284c7" },
  { key: "outline",   icon: List,         label: "Generate Outline",    color: "#059669" },
  { key: "citations", icon: Quote,        label: "Suggest Citations",   color: "#d97706" },
  { key: "methodology",icon: ClipboardList,label:"Check Methodology",   color: "#dc2626" },
  { key: "keywords",  icon: Search,       label: "Extract Keywords",    color: "#db2777" },
  { key: "simplify",  icon: Sparkles,     label: "Simplify Text",       color: "#0891b2" },
  { key: "related",   icon: BookOpen,     label: "Related Literature",  color: "#16a34a" },
];

const RESEARCH_PROMPTS: Record<string, string> = {
  improve:     "Improve the writing quality of the following text while preserving its academic tone and meaning. Fix grammar, enhance clarity, and strengthen sentence structure:",
  expand:      "Expand the following academic text with more detail, supporting arguments, and deeper analysis. Maintain scholarly language:",
  outline:     "Based on the paper title and section content provided, generate a detailed academic outline for this research paper with all major sections and subsections:",
  citations:   "Suggest 5 relevant academic citations or reference types that would support the arguments in this text. Format as: Author (Year) - Title - Why it supports the argument:",
  methodology: "Review the following methodology text and provide feedback on: research design appropriateness, potential biases, data collection validity, and suggestions for improvement:",
  keywords:    "Extract 8–10 academic keywords from this text that would be used for database indexing. Format as a comma-separated list with brief explanations:",
  simplify:    "Rewrite the following academic text in clearer, more accessible language suitable for a broader audience, while keeping the core findings intact:",
  related:     "Based on this research content, suggest 5 related fields of study, theories, or research areas the author should explore and reference:",
};

export default function ResearchAI({
  paperTitle, sectionTitle, sectionContent,
}: {
  paperTitle: string; sectionTitle: string; sectionContent: string;
}) {
  const [open,    setOpen]    = useState(false);
  const [msgs,    setMsgs]    = useState<Msg[]>([]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [model,   setModel]   = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/openrouter/models").then(r => r.json()).then(d => {
      if (d.activeModel) setModel(d.activeModel);
      else if (d.models?.[0]) setModel(d.models[0].id || d.models[0]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  async function ask(action?: string, question?: string) {
    const label = action ? ACTIONS.find(a => a.key === action)?.label || action : (question || "");
    setMsgs(p => [...p, { role: "user", text: label }]);
    setLoading(true); setInput("");

    const context = [
      paperTitle ? `Paper Title: "${paperTitle}"` : "",
      sectionTitle ? `Current Section: ${sectionTitle}` : "",
      sectionContent ? `Section Content:\n${sectionContent.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 3000)}` : "No content written yet.",
    ].filter(Boolean).join("\n\n");

    const actionPrompt = action && RESEARCH_PROMPTS[action]
      ? `${RESEARCH_PROMPTS[action]}\n\n${context}`
      : `Answer this research writing question:\n\nQuestion: ${question}\n\n${context}`;

    try {
      const r = await fetch("/api/ai/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId: "research-studio",
          question: actionPrompt,
          articleContent: context,
          articleTitle: paperTitle || "Research Paper",
          model,
        }),
      });
      const d = await r.json();
      setMsgs(p => [...p, { role: "ai", text: d.response || d.error || "No response." }]);
    } catch {
      setMsgs(p => [...p, { role: "ai", text: "Connection error. Check your AI settings." }]);
    }
    setLoading(false);
  }

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: "fixed", bottom: "calc(var(--bottom-nav-h, 0px) + 16px)", right: 16, zIndex: 200,
          width: 48, height: 48, borderRadius: "50%",
          background: "var(--brand)", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(109,40,217,.4)",
          transition: "transform .2s, box-shadow .2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
        title="AI Research Assistant"
      >
        {open ? <X size={20} color="white" /> : <Bot size={20} color="white" />}
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: "fixed",
          bottom: "calc(var(--bottom-nav-h, 0px) + 72px)", right: 12, zIndex: 200,
          width: "min(380px, calc(100vw - 24px))",
          height: "min(560px, calc(100vh - 140px))",
          background: "var(--bg-card)", border: "1.5px solid var(--border)",
          borderRadius: "var(--r-xl)", boxShadow: "0 8px 40px rgba(0,0,0,.18)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{ padding: "12px 14px", background: "var(--brand)", display: "flex", alignItems: "center", gap: 8 }}>
            <Bot size={16} color="white" />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "Outfit,sans-serif", fontSize: 13, fontWeight: 800, color: "white" }}>Research AI Assistant</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.7)" }}>{sectionTitle || "No section selected"}</div>
            </div>
            {msgs.length > 0 && (
              <button onClick={() => setMsgs([])} title="Clear chat"
                style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: 6, cursor: "pointer", padding: 5, color: "white", display: "flex" }}>
                <RefreshCw size={11} />
              </button>
            )}
          </div>

          {/* Quick action chips */}
          <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", display: "flex", gap: 5, flexWrap: "wrap" }}>
            {ACTIONS.map(a => (
              <button key={a.key} onClick={() => ask(a.key)} disabled={loading}
                style={{
                  display: "flex", alignItems: "center", gap: 4, padding: "4px 9px",
                  fontSize: 10, fontWeight: 700, borderRadius: "var(--r-f)", cursor: "pointer", border: "1px solid",
                  background: `${a.color}12`, color: a.color, borderColor: `${a.color}30`,
                  opacity: loading ? .5 : 1, transition: "opacity .15s",
                }}>
                <a.icon size={10} />{a.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
            {!msgs.length && (
              <div style={{ textAlign: "center", padding: "24px 16px", color: "var(--text-4)" }}>
                <Sparkles size={28} style={{ margin: "0 auto 10px", color: "var(--brand)", opacity: .5 }} />
                <p style={{ fontSize: 12, lineHeight: 1.6 }}>Select a quick action above or ask a question about your current section.</p>
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 8, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                {m.role === "ai" && (
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--brand-muted)", border: "1px solid var(--brand-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Bot size={11} style={{ color: "var(--brand)" }} />
                  </div>
                )}
                <div style={{
                  maxWidth: "85%", padding: "8px 11px", borderRadius: "var(--r-lg)",
                  fontSize: 12, lineHeight: 1.65,
                  background: m.role === "user" ? "var(--brand)" : "var(--bg-alt)",
                  color: m.role === "user" ? "white" : "var(--text)",
                  border: m.role === "ai" ? "1px solid var(--border)" : "none",
                  whiteSpace: "pre-wrap",
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--brand-muted)", border: "1px solid var(--brand-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Bot size={11} style={{ color: "var(--brand)" }} />
                </div>
                <div style={{ padding: "8px 12px", background: "var(--bg-alt)", borderRadius: "var(--r-lg)", border: "1px solid var(--border)", display: "flex", gap: 4, alignItems: "center" }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--brand)", opacity: .5, animation: `bounce .8s ${i*0.15}s infinite alternate` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "10px 12px", borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
            <input
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && input.trim()) { e.preventDefault(); ask(undefined, input.trim()); } }}
              placeholder="Ask anything about your research…"
              style={{ flex: 1, padding: "8px 11px", background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--r-lg)", fontSize: 12, color: "var(--text)", outline: "none" }}
            />
            <button onClick={() => input.trim() && ask(undefined, input.trim())} disabled={loading || !input.trim()}
              style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--brand)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: (!input.trim() || loading) ? .4 : 1, flexShrink: 0 }}>
              <Send size={13} color="white" />
            </button>
          </div>
        </div>
      )}
      <style>{`@keyframes bounce{from{transform:translateY(0)}to{transform:translateY(-5px)}}`}</style>
    </>
  );
}
