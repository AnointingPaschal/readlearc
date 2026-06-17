"use client";
import { useState } from "react";
import { Plus, Zap, CheckCircle, Play, ChevronDown } from "lucide-react";

const INITIAL_MODELS = [
  { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", status: "ACTIVE", context: "1M tokens", cost: "$0.0025/1k", tasks: ["All tasks"], temp: 0.7, maxTokens: 1000 },
  { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B Instruct", status: "STANDBY", context: "128K tokens", cost: "$0.0009/1k", tasks: ["fallback_only"], temp: 0.7, maxTokens: 1000 },
  { id: "anthropic/claude-sonnet-4-6", name: "Claude Sonnet 4.6", status: "STANDBY", context: "200K tokens", cost: "$0.003/1k", tasks: ["content_moderation"], temp: 0.3, maxTokens: 500 },
];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "status-live",
  STANDBY: "status-draft",
  DISABLED: "status-removed",
};

export default function AIModelsPage() {
  const [models, setModels] = useState(INITIAL_MODELS);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<string | null>(null);

  async function setActive(id: string) {
    setConfirm(null);
    setModels((prev) =>
      prev.map((m) => ({
        ...m,
        status: m.id === id ? "ACTIVE" : m.status === "ACTIVE" ? "STANDBY" : m.status,
      }))
    );
  }

  async function testModel(id: string) {
    setTesting(id);
    await new Promise((r) => setTimeout(r, 2000));
    setTesting(null);
    setTestResult({ ...testResult, [id]: "Response: \"Arc blockchain enables instant USDC micropayments...\" · 142ms · 24 tokens · ~$0.00006" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Model Management</h1>
          <p className="text-gray-500 text-sm mt-1">Only ONE model can be ACTIVE at a time globally.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-arc-600 hover:bg-arc-500 rounded-xl text-sm font-semibold transition-all">
          <Plus className="w-4 h-4" /> Add Model
        </button>
      </div>

      {confirm && (
        <div className="glass-arc rounded-xl p-5 border border-arc-500/40">
          <p className="text-sm font-semibold text-white mb-1">Set as Active Model?</p>
          <p className="text-xs text-gray-400 mb-4">This will immediately affect all AI features across the platform. The current active model will be set to STANDBY.</p>
          <div className="flex gap-3">
            <button onClick={() => setActive(confirm)} className="px-4 py-2 bg-arc-600 hover:bg-arc-500 rounded-lg text-sm font-semibold transition-all">Confirm</button>
            <button onClick={() => setConfirm(null)} className="px-4 py-2 glass border border-white/10 rounded-lg text-sm text-gray-400 hover:text-white transition-all">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {models.map((model) => (
          <div key={model.id} className={`glass rounded-2xl p-6 ${model.status === "ACTIVE" ? "border-arc-500/30" : ""}`}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  {model.status === "ACTIVE" && <Zap className="w-4 h-4 text-arc-400" />}
                  <h3 className="font-semibold text-white">{model.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[model.status]}`}>{model.status}</span>
                </div>
                <p className="text-xs text-gray-500 font-mono">{model.id}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => testModel(model.id)}
                  disabled={!!testing}
                  className="flex items-center gap-1.5 px-3 py-2 glass border border-white/10 rounded-lg text-xs text-gray-400 hover:text-white hover:border-white/20 transition-all"
                >
                  {testing === model.id ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <Play className="w-3 h-3" />}
                  Test
                </button>
                {model.status !== "ACTIVE" && (
                  <button onClick={() => setConfirm(model.id)}
                    className="px-3 py-2 bg-arc-600 hover:bg-arc-500 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all">
                    <CheckCircle className="w-3 h-3" /> Set Active
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 text-xs mb-4">
              <div className="glass rounded-lg p-3">
                <div className="text-gray-600 mb-0.5">Context</div>
                <div className="font-semibold text-gray-300">{model.context}</div>
              </div>
              <div className="glass rounded-lg p-3">
                <div className="text-gray-600 mb-0.5">Cost</div>
                <div className="font-semibold text-gray-300">{model.cost}</div>
              </div>
              <div className="glass rounded-lg p-3">
                <div className="text-gray-600 mb-0.5">Temperature</div>
                <div className="font-semibold text-gray-300">{model.temp}</div>
              </div>
              <div className="glass rounded-lg p-3">
                <div className="text-gray-600 mb-0.5">Max Tokens</div>
                <div className="font-semibold text-gray-300">{model.maxTokens}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {model.tasks.map((t) => (
                <span key={t} className="text-xs px-2.5 py-1 bg-arc-500/15 text-arc-300 border border-arc-500/20 rounded-full">{t}</span>
              ))}
            </div>

            {testResult[model.id] && (
              <div className="mt-4 p-3 bg-usdc-500/10 border border-usdc-500/20 rounded-xl text-xs text-usdc-300 font-mono">
                {testResult[model.id]}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
