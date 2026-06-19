"use client";
import Link from "next/link";
import { Bot, Server, Cpu, FileText, ArrowUpRight, CheckCircle2, AlertCircle } from "lucide-react";

function loadAIConfig() {
  try { return JSON.parse(localStorage.getItem("rl-ai-config") || "{}"); }
  catch { return {}; }
}

export default function AIOverviewPage() {
  const cfg = loadAIConfig();
  const hasKey = !!cfg.anthropicKey || !!cfg.openaiKey;

  const sections = [
    { href: "/admin/ai/providers", label: "AI Providers",   icon: Server,   desc: "Configure API keys for Anthropic, OpenAI" },
    { href: "/admin/ai/models",    label: "Models",         icon: Cpu,      desc: "Choose which model for each task"          },
    { href: "/admin/ai/prompts",   label: "Prompts",        icon: FileText, desc: "Edit system prompts for content moderation" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>AI Overview</h1>
        <p style={{ color: "var(--text-4)", fontSize: 12, marginTop: 3 }}>AI-powered content moderation and platform intelligence</p>
      </div>

      {/* Status */}
      <div className="card" style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {hasKey
            ? <><CheckCircle2 size={15} style={{ color: "#059669" }} /><span style={{ fontSize: 13, fontWeight: 600, color: "#059669" }}>AI provider configured</span></>
            : <><AlertCircle size={15} style={{ color: "#d97706" }} /><span style={{ fontSize: 13, fontWeight: 600, color: "#d97706" }}>No AI provider configured</span> <Link href="/admin/ai/providers" style={{ fontSize: 12, color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>Set up →</Link></>
          }
        </div>
      </div>

      {/* Use cases */}
      <div className="card" style={{ padding: "20px" }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>What AI is used for</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: "Content Moderation",     desc: "Analyzes flagged articles for spam, harmful content, violations", status: hasKey },
            { label: "Risk Scoring",           desc: "Assigns HIGH/MEDIUM/LOW risk score to moderation queue items",   status: hasKey },
            { label: "Spam Detection",         desc: "Identifies get-rich-quick schemes, excessive referral links",    status: hasKey },
          ].map(u => (
            <div key={u.label} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: "var(--bg-alt)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: u.status ? "#059669" : "var(--text-4)", marginTop: 5, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{u.label}</div>
                <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 2 }}>{u.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10 }}>
        {sections.map(s => (
          <Link key={s.href} href={s.href} style={{ textDecoration: "none" }}>
            <div className="card" style={{ padding: "16px" }}>
              <s.icon size={16} style={{ color: "var(--brand)", marginBottom: 10 }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: "var(--text-4)" }}>{s.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
