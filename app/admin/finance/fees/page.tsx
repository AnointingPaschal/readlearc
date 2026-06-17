"use client";
import { useState } from "react";
import { Save, AlertTriangle, PenTool, Zap, Users, ExternalLink } from "lucide-react";

export default function FeesConfigPage() {
  const [splits, setSplits] = useState({
    default_writer: 85, default_platform: 10, default_referrer: 5,
    verified_writer: 90, verified_platform: 7, verified_referrer: 3,
    min_price: 0.01, max_price: 1.00, min_tip: 0.01,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 2000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const defaultTotal = splits.default_writer + splits.default_platform + splits.default_referrer;
  const verifiedTotal = splits.verified_writer + splits.verified_platform + splits.verified_referrer;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Fee Configuration</h1>
        <p className="text-gray-500 text-sm mt-1">Configure global pricing limits and on-chain payment splits via PaymentSplitter.sol.</p>
      </div>

      <div className="bg-arc-900/40 border border-arc-500/30 rounded-xl p-4 flex items-start gap-3">
        <Zap className="w-5 h-5 text-arc-400 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-white">Requires On-Chain Deployment</h3>
          <p className="text-xs text-gray-400 mt-1">Saving these changes will deploy a new PaymentSplitter.sol contract to Arc and incur a small gas fee. All new payments will route to the new contract.</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex justify-between">
          <span>Default Payment Split</span>
          <span className={defaultTotal === 100 ? "text-usdc-400" : "text-red-400"}>Total: {defaultTotal}%</span>
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block flex items-center gap-1"><PenTool className="w-3 h-3" /> Writer %</label>
            <input type="number" value={splits.default_writer} onChange={(e) => setSplits({ ...splits, default_writer: +e.target.value })}
              className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-arc-500/50 text-center font-bold" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block flex items-center gap-1"><Zap className="w-3 h-3" /> Platform %</label>
            <input type="number" value={splits.default_platform} onChange={(e) => setSplits({ ...splits, default_platform: +e.target.value })}
              className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-arc-500/50 text-center font-bold" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block flex items-center gap-1"><Users className="w-3 h-3" /> Referrer %</label>
            <input type="number" value={splits.default_referrer} onChange={(e) => setSplits({ ...splits, default_referrer: +e.target.value })}
              className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-arc-500/50 text-center font-bold" />
          </div>
        </div>

        <div className="h-2 rounded-full overflow-hidden flex bg-gray-900 mt-2">
          <div className="bg-usdc-500 transition-all" style={{ width: `${splits.default_writer}%` }} />
          <div className="bg-arc-500 transition-all" style={{ width: `${splits.default_platform}%` }} />
          <div className="bg-blue-500 transition-all" style={{ width: `${splits.default_referrer}%` }} />
        </div>
      </div>

      <div className="glass rounded-2xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex justify-between">
          <span>Verified Writer Split</span>
          <span className={verifiedTotal === 100 ? "text-usdc-400" : "text-red-400"}>Total: {verifiedTotal}%</span>
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <input type="number" value={splits.verified_writer} onChange={(e) => setSplits({ ...splits, verified_writer: +e.target.value })}
              className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-arc-500/50 text-center font-bold" />
          </div>
          <div>
            <input type="number" value={splits.verified_platform} onChange={(e) => setSplits({ ...splits, verified_platform: +e.target.value })}
              className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-arc-500/50 text-center font-bold" />
          </div>
          <div>
            <input type="number" value={splits.verified_referrer} onChange={(e) => setSplits({ ...splits, verified_referrer: +e.target.value })}
              className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-arc-500/50 text-center font-bold" />
          </div>
        </div>
        <div className="h-2 rounded-full overflow-hidden flex bg-gray-900 mt-2">
          <div className="bg-usdc-500 transition-all" style={{ width: `${splits.verified_writer}%` }} />
          <div className="bg-arc-500 transition-all" style={{ width: `${splits.verified_platform}%` }} />
          <div className="bg-blue-500 transition-all" style={{ width: `${splits.verified_referrer}%` }} />
        </div>
      </div>

      <div className="glass rounded-2xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Pricing Limits (USDC)</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Min Article Price</label>
            <input type="number" step="0.01" value={splits.min_price} onChange={(e) => setSplits({ ...splits, min_price: +e.target.value })}
              className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-arc-500/50" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Max Article Price</label>
            <input type="number" step="0.01" value={splits.max_price} onChange={(e) => setSplits({ ...splits, max_price: +e.target.value })}
              className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-arc-500/50" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Min Tip Amount</label>
            <input type="number" step="0.01" value={splits.min_tip} onChange={(e) => setSplits({ ...splits, min_tip: +e.target.value })}
              className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-arc-500/50" />
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={defaultTotal !== 100 || verifiedTotal !== 100 || saving}
        className="flex items-center gap-2 px-6 py-3 bg-arc-600 hover:bg-arc-500 disabled:bg-gray-800 disabled:text-gray-500 rounded-xl font-semibold text-sm transition-all"
      >
        {saving ? (
          <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Deploying Contract...</>
        ) : saved ? (
          "New Splitter Deployed! ✓"
        ) : (
          <><Save className="w-4 h-4" /> Save & Deploy Splitter</>
        )}
      </button>
    </div>
  );
}
