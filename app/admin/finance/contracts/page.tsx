"use client";
import { useState } from "react";
import { Copy, Check, ExternalLink, ShieldCheck, AlertCircle, FileCode } from "lucide-react";
import { READLEARC_ADDRESS, USDC_ADDRESS, ARC_EXPLORER } from "../../../../lib/web3";

const CONTRACTS = [
  { name: "Readlearc",         address: READLEARC_ADDRESS, status: "ACTIVE", version: "v1.0", desc: "Core: article registry, payments, fee splits, verified writers" },
  { name: "USDC (Circle)",     address: USDC_ADDRESS,      status: "ACTIVE", version: "ERC-20", desc: "Circle's USDC token contract on Arc Testnet" },
  { name: "PaymentSplitter",   address: "",                status: "INTEGRATED", version: "built-in", desc: "Fee splitting handled in-contract via Readlearc.sol" },
];

export default function ContractsPage() {
  const [copied, setCopied] = useState<string>("");

  function copy(addr: string) {
    navigator.clipboard.writeText(addr);
    setCopied(addr);
    setTimeout(() => setCopied(""), 2000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>Contract Registry</h1>
          <p style={{ color: "var(--text-4)", fontSize: 12, marginTop: 3 }}>Core smart contracts deployed on Arc Testnet</p>
        </div>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#059669", background: "rgba(5,150,105,0.08)", border: "1px solid rgba(5,150,105,0.2)", padding: "5px 12px", borderRadius: "var(--radius-full)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#059669", display: "inline-block", animation: "rl-pulse 2s infinite" }} />
          Arc Testnet · Live
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {CONTRACTS.map(c => (
          <div key={c.name} className="card" style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <FileCode size={14} style={{ color: "var(--brand)", flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{c.name}</span>
                  <span style={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace", color: "var(--text-4)" }}>{c.version}</span>
                  <span className={c.status === "ACTIVE" ? "pill-live" : c.status === "INTEGRATED" ? "pill-verified" : "pill-draft"} style={{ fontSize: 10, padding: "2px 8px" }}>
                    {c.status}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "var(--text-4)", marginBottom: 8 }}>{c.desc}</p>
                {c.address ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "var(--text-3)" }}>{c.address}</span>
                    <button onClick={() => copy(c.address)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-4)", display: "flex", alignItems: "center" }}>
                      {copied === c.address ? <Check size={12} style={{ color: "#059669" }} /> : <Copy size={12} />}
                    </button>
                  </div>
                ) : (
                  <span style={{ fontSize: 11, color: "var(--text-4)", fontStyle: "italic" }}>No separate contract address</span>
                )}
              </div>
              {c.address && (
                <a href={`${ARC_EXPLORER}/address/${c.address}`} target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--brand)", textDecoration: "none", fontWeight: 600, flexShrink: 0 }}>
                  View <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {(!READLEARC_ADDRESS || !USDC_ADDRESS) && (
        <div style={{ padding: "14px 16px", background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)", borderRadius: "var(--radius)", display: "flex", gap: 10 }}>
          <AlertCircle size={15} style={{ color: "#dc2626", flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12, color: "var(--text-3)" }}>
            Some contracts are missing. Set <code style={{ fontFamily: "JetBrains Mono, monospace" }}>NEXT_PUBLIC_CONTRACT_ADDRESS</code> and <code style={{ fontFamily: "JetBrains Mono, monospace" }}>NEXT_PUBLIC_USDC_ADDRESS</code> in <code style={{ fontFamily: "JetBrains Mono, monospace" }}>.env.local</code>.
          </div>
        </div>
      )}
      <style>{`@keyframes rl-pulse{0%,100%{opacity:1}50%{opacity:.35}}`}</style>
    </div>
  );
}
