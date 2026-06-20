"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { RefreshCw, ExternalLink, Info } from "lucide-react";
import { CONTRACT_ADDRESS, CONTRACT_ABI, EXPLORER_URL, readProvider } from "../../../../lib/chain";
import { useAccount as useWallet } from "wagmi";

export default function FeesConfigPage() {
  const { isConnected } = useWallet();
  const [onChain,  setOnChain]  = useState<any>(null);
  const [loading,  setLoading]  = useState(true);

  async function fetchFees() {
    setLoading(true);
    try {
      if (!CONTRACT_ADDRESS) return;
      const prov = readProvider();
      const c    = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, prov);

      const [
        defaultWriterBps, defaultPlatformBps, defaultReferrerBps,
        verifiedWriterBps, verifiedPlatformBps, verifiedReferrerBps,
      ] = await Promise.all([
        c.defaultWriterBps(),
        c.defaultPlatformBps(),
        c.defaultReferrerBps(),
        c.verifiedWriterBps(),
        c.verifiedPlatformBps(),
        c.verifiedReferrerBps(),
      ]);

      setOnChain({
        defaultWriterBps:    Number(defaultWriterBps),
        defaultPlatformBps:  Number(defaultPlatformBps),
        defaultReferrerBps:  Number(defaultReferrerBps),
        verifiedWriterBps:   Number(verifiedWriterBps),
        verifiedPlatformBps: Number(verifiedPlatformBps),
        verifiedReferrerBps: Number(verifiedReferrerBps),
      });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchFees(); }, []);

  function bpsToPercent(bps: number) { return (bps / 100).toFixed(1) + "%"; }

  const SplitBar = ({ writer, platform, referrer }: { writer: number; platform: number; referrer: number }) => (
    <div style={{ height: 10, borderRadius: "var(--radius-full)", overflow: "hidden", display: "flex", background: "var(--bg-alt)", border: "1px solid var(--border)", marginTop: 10 }}>
      <div style={{ width: `${writer / 100}%`,   background: "#059669", transition: "width .3s" }} title={`Writer: ${bpsToPercent(writer)}`} />
      <div style={{ width: `${platform / 100}%`, background: "var(--brand)", transition: "width .3s" }} title={`Platform: ${bpsToPercent(platform)}`} />
      <div style={{ width: `${referrer / 100}%`, background: "#0284c7", transition: "width .3s" }} title={`Referrer: ${bpsToPercent(referrer)}`} />
    </div>
  );

  const SplitRow = ({ label, color, value }: { label: string; color: string; value: number }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--bg-alt)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>{label}</span>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: "Outfit, sans-serif", fontSize: 18, fontWeight: 900, color }}>{bpsToPercent(value)}</div>
        <div style={{ fontSize: 10, color: "var(--text-4)", fontFamily: "JetBrains Mono, monospace" }}>{value} bps</div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 600 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>Fee Configuration</h1>
          <p style={{ color: "var(--text-4)", fontSize: 12, marginTop: 3 }}>Live on-chain payment splits from Readlearc.sol</p>
        </div>
        <button onClick={fetchFees} disabled={loading} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", border: "1.5px solid var(--border)", background: "var(--bg-alt)", borderRadius: "var(--radius)", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--text-3)" }}>
          <RefreshCw size={13} style={loading ? { animation: "rl-spin 1s linear infinite" } : {}} /> Refresh
        </button>
      </div>

      {/* Info banner */}
      <div style={{ display: "flex", gap: 10, padding: "12px 14px", background: "var(--brand-muted)", border: "1px solid var(--border-brand)", borderRadius: "var(--radius)" }}>
        <Info size={14} style={{ color: "var(--brand)", flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.6 }}>
          These values are read directly from the deployed <code style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>Readlearc.sol</code> contract.
          To change fee splits you need to redeploy the contract with updated <code style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>defaultWriterBps</code> values, or upgrade to the new contract version that includes <code style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>updateDefaultSplits()</code>.
        </div>
      </div>

      {loading ? (
        <div>{[1,2].map(i => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 14, marginBottom: 12 }} />)}</div>
      ) : !onChain ? (
        <div className="card" style={{ padding: "32px 20px", textAlign: "center", fontSize: 13, color: "var(--text-4)" }}>
          Could not read contract. Make sure <code style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>NEXT_PUBLIC_CONTRACT_ADDRESS</code> is set in Vercel.
        </div>
      ) : (<>
        {/* Default splits */}
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Default Split <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-4)" }}>(unverified writers)</span></h2>
            <span style={{ fontSize: 12, fontWeight: 700, color: onChain.defaultWriterBps + onChain.defaultPlatformBps + onChain.defaultReferrerBps === 10000 ? "#059669" : "#dc2626" }}>
              Total: {((onChain.defaultWriterBps + onChain.defaultPlatformBps + onChain.defaultReferrerBps) / 100).toFixed(0)}%
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <SplitRow label="Writer"   color="#059669"    value={onChain.defaultWriterBps} />
            <SplitRow label="Platform" color="var(--brand)" value={onChain.defaultPlatformBps} />
            <SplitRow label="Referrer" color="#0284c7"    value={onChain.defaultReferrerBps} />
          </div>
          <SplitBar writer={onChain.defaultWriterBps} platform={onChain.defaultPlatformBps} referrer={onChain.defaultReferrerBps} />
          <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
            {[{ label: "Writer", c: "#059669" }, { label: "Platform", c: "var(--brand)" }, { label: "Referrer", c: "#0284c7" }].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-4)" }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: l.c }} /> {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* Verified splits */}
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Verified Writer Split</h2>
            <span style={{ fontSize: 12, fontWeight: 700, color: onChain.verifiedWriterBps + onChain.verifiedPlatformBps + onChain.verifiedReferrerBps === 10000 ? "#059669" : "#dc2626" }}>
              Total: {((onChain.verifiedWriterBps + onChain.verifiedPlatformBps + onChain.verifiedReferrerBps) / 100).toFixed(0)}%
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <SplitRow label="Writer"   color="#059669"    value={onChain.verifiedWriterBps} />
            <SplitRow label="Platform" color="var(--brand)" value={onChain.verifiedPlatformBps} />
            <SplitRow label="Referrer" color="#0284c7"    value={onChain.verifiedReferrerBps} />
          </div>
          <SplitBar writer={onChain.verifiedWriterBps} platform={onChain.verifiedPlatformBps} referrer={onChain.verifiedReferrerBps} />
        </div>

        {/* Contract link */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <a href={`${EXPLORER_URL}/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--brand)", textDecoration: "none", fontWeight: 600 }}>
            <ExternalLink size={13} /> View contract on Arc Explorer
          </a>
        </div>
      </>)}
      <style>{`@keyframes rl-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
