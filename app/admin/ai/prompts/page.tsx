"use client";
import { useState } from "react";
import { Save, Play, ChevronDown, ChevronUp } from "lucide-react";

const PROMPTS = [
  {
    key: "SUMMARIZATION_PROMPT",
    label: "Article Summarization",
    desc: "Generates 2-sentence preview blurb for article cards",
    value: "You are a content summarizer for a pay-per-read blog platform. Summarize the following article in exactly 2 sentences for a preview card. Be concise, intriguing, and do not spoil the full content. Make the reader want to pay to read more.",
  },
  {
    key: "MODERATION_PROMPT",
    label: "Content Moderation",
    desc: "Scores content for policy violations before publish",
    value: `You are a content moderator. Analyze the following article for policy violations including misinformation, hate speech, spam, or illegal content. Return a JSON object with: risk_level (LOW/MEDIUM/HIGH), reasons (array of strings), recommendation (APPROVE/REVIEW/REJECT).`,
  },
  {
    key: "RECOMMENDATION_PROMPT",
    label: "Reader Recommendations",
    desc: "Generates personalized next-article suggestions",
    value: "You are a content recommendation engine. Given a reader's on-chain reading history and available articles, suggest the 5 most relevant articles. Return a JSON array of article IDs ordered by relevance. Prioritize diversity of topics.",
  },
  {
    key: "WRITER_INSIGHTS_PROMPT",
    label: "Writer Analytics Insights",
    desc: "Generates natural language analytics summary for writers",
    value: "You are a writing coach and analytics assistant. Given the following earnings and readership data, write a friendly 3-sentence summary highlighting the writer's best performing content, growth trend, and one actionable tip to increase earnings.",
  },
  {
    key: "PRICING_PROMPT",
    label: "Pricing Suggestions",
    desc: "Suggests optimal article price based on engagement data",
    value: `You are a pricing strategist for a pay-per-read platform. Given the article's category, estimated read time, author reputation score, and comparable articles' performance data, suggest an optimal USDC price between $0.01 and $1.00. Return JSON: { suggested_price: number, reasoning: string }.`,
  },
];

export default function AIPromptsPage() {
  const [prompts, setPrompts] = useState(PROMPTS);
  const [expanded, setExpanded] = useState<string[]>([PROMPTS[0].key]);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<string | null>(null);

  function toggle(key: string) {
    setExpanded((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  }

  async function testPrompt(key: string) {
    setTesting(key);
    await new Promise((r) => setTimeout(r, 2000));
    setTesting(null);
    setTestResults({ ...testResults, [key]: "Test response generated successfully · 89ms · 142 tokens · ~$0.00035 est. cost" });
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-heading text-2xl font-bold">System Prompts</h1>
        <p className="text-gray-500 text-sm mt-1">Edit and test the AI prompts used for each platform feature.</p>
      </div>

      <div className="space-y-3">
        {prompts.map((prompt) => {
          const isOpen = expanded.includes(prompt.key);
          return (
            <div key={prompt.key} className={`glass rounded-2xl overflow-hidden transition-all ${isOpen ? "border-arc-500/20" : ""}`}>
              <button
                onClick={() => toggle(prompt.key)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/2 transition-colors"
              >
                <div className="text-left">
                  <div className="text-sm font-semibold text-white">{prompt.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{prompt.desc}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-arc-400 bg-arc-500/10 px-2 py-1 rounded">{prompt.key}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 space-y-4 border-t border-white/5">
                  <textarea
                    value={prompt.value}
                    onChange={(e) => setPrompts(prompts.map((p) => p.key === prompt.key ? { ...p, value: e.target.value } : p))}
                    rows={5}
                    className="w-full mt-4 bg-[#111827] border border-white/10 rounded-xl p-4 text-sm text-gray-300 font-mono focus:outline-none focus:border-arc-500/50 resize-none leading-relaxed"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => testPrompt(prompt.key)}
                      disabled={!!testing}
                      className="flex items-center gap-2 px-4 py-2 glass border border-white/10 rounded-lg text-xs text-gray-400 hover:text-white hover:border-white/20 transition-all"
                    >
                      {testing === prompt.key
                        ? <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> Testing...</>
                        : <><Play className="w-3 h-3" /> Test Prompt</>}
                    </button>
                    <button
                      onClick={() => { setSaved(prompt.key); setTimeout(() => setSaved(null), 2000); }}
                      className="flex items-center gap-2 px-4 py-2 bg-arc-600 hover:bg-arc-500 rounded-lg text-xs font-semibold transition-all"
                    >
                      <Save className="w-3 h-3" />
                      {saved === prompt.key ? "Saved! ✓" : "Save Prompt"}
                    </button>
                  </div>
                  {testResults[prompt.key] && (
                    <div className="p-3 bg-usdc-500/10 border border-usdc-500/20 rounded-xl text-xs text-usdc-300 font-mono">
                      {testResults[prompt.key]}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
