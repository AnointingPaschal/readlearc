"use client";
import { useState } from "react";
import { Save, CheckCircle2, AlertTriangle, Zap, PenTool, Users } from "lucide-react";
import { useWallet } from "../../../../lib/web3Context";

export default function FeesConfigPage() {
  const { isConnected } = useWallet();
  const [splits, setSplits] = useState({
    default_writer: 85, default_platform: 10, default_referrer: 5,
    verified_writer: 90, verified_platform: 7, verified_referrer: 3,
    min_price: 0.01, max_price: 1.00,
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  async function handleSave() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1500));
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const defTotal  = splits.default_writer  + splits.default_platform  + splits.default_referrer;
  const verTotal  = splits.verified_writer + splits.verified_platform + splits.verified_referrer;

  const SplitRow = ({ label, icon: Icon, val, key: k }: any) => (
    <div>
      <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
        <Icon size={11} /> {label}
      </label>
      <input type="number" value={val} min={0} max={100} onChange={e => setSplits(s => ({ ...s, [k]: +e.target.value }))}
        className="admin-input admin-input-num" />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 600 }}>
      <div>
        <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>Fee Configuration</h1>
        <p style={{ color: "var(--text-4)", fontSize: 12, marginTop: 3 }}>Configure on-chain payment splits in Readlearc.sol</p>
      </div>

      {/* Warning */}
      <div style={{ padding: "14px 16px", background: "rgba(109,40,217,0.06)", border: "1px solid var(--border-brand)", borderRadius: "var(--radius)", display: "flex", gap: 10 }}>
        <Zap size={15} style={{ color: "var(--brand)", flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.6 }}>
          <strong style={{ color: "var(--text-2)" }}>Requires on-chain transaction.</strong> Changes must be deployed as a new contract version on Arc Testnet. Current splits are enforced by <code style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>Readlearc.sol</code>.
        </div>
      </div>

      {/* Default splits */}
      <div className="card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Default Split (unverified writers)</h2>
          <span style={{ fontSize: 12, fontWeight: 700, color: defTotal === 100 ? "#059669" : "#dc2626" }}>Total: {defTotal}%</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <SplitRow label="Writer" icon={PenTool} val={splits.default_writer}   k="default_writer"   />
          <SplitRow label="Platform" icon={Zap}   val={splits.default_platform} k="default_platform" />
          <SplitRow label="Referrer" icon={Users} val={splits.default_referrer} k="default_referrer" />
        </div>
        {/* Split bar */}
        <div style={{ marginTop: 14, height: 8, borderRadius: "var(--radius-full)", overflow: "hidden", display: "flex", background: "var(--bg-alt)", border: "1px solid var(--border)" }}>
          <div style={{ width: `${splits.default_writer}%`,   background: "#059669" }} />
          <div style={{ width: `${splits.default_platform}%`, background: "var(--brand)" }} />
          <div style={{ width: `${splits.default_referrer}%`, background: "#0284c7" }} />
        </div>
      </div>

      {/* Verified splits */}
      <div className="card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Verified Writer Split</h2>
          <span style={{ fontSize: 12, fontWeight: 700, color: verTotal === 100 ? "#059669" : "#dc2626" }}>Total: {verTotal}%</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <SplitRow label="Writer" icon={PenTool} val={splits.verified_writer}   k="verified_writer"   />
          <SplitRow label="Platform" icon={Zap}   val={splits.verified_platform} k="verified_platform" />
          <SplitRow label="Referrer" icon={Users} val={splits.verified_referrer} k="verified_referrer" />
        </div>
        <div style={{ marginTop: 14, height: 8, borderRadius: "var(--radius-full)", overflow: "hidden", display: "flex", background: "var(--bg-alt)", border: "1px solid var(--border)" }}>
          <div style={{ width: `${splits.verified_writer}%`,   background: "#059669" }} />
          <div style={{ width: `${splits.verified_platform}%`, background: "var(--brand)" }} />
          <div style={{ width: `${splits.verified_referrer}%`, background: "#0284c7" }} />
        </div>
      </div>

      {/* Limits */}
      <div className="card" style={{ padding: "20px" }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>Price Limits (USDC)</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[{ label: "Min Price", k: "min_price" as const }, { label: "Max Price", k: "max_price" as const }].map(f => (
            <div key={f.k}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, display: "block" }}>{f.label}</label>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--radius)", padding: "10px 12px" }}>
                <span style={{ color: "var(--text-4)", fontWeight: 700 }}>$</span>
                <input type="number" value={(splits as any)[f.k]} step={0.01} onChange={e => setSplits(s => ({ ...s, [f.k]: +e.target.value }))}
                  style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 16, fontWeight: 700, color: "var(--brand)", fontFamily: "Outfit, sans-serif" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        {!isConnected && <span style={{ fontSize: 12, color: "#dc2626", alignSelf: "center" }}>Connect owner wallet to save</span>}
        <button onClick={handleSave} disabled={saving || !isConnected || defTotal !== 100 || verTotal !== 100} className="btn btn-primary" style={{ fontWeight: 700, minWidth: 140 }}>
          {saving ? "Deploying…" : saved ? <><CheckCircle2 size={14} /> Saved!</> : <><Save size={14} /> Save to Chain</>}
        </button>
      </div>
    </div>
  );
}
