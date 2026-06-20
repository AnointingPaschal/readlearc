"use client";
import { useWallet } from "../../../lib/wallet";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Shield, AlertTriangle, CheckCircle2, RefreshCw, ArrowUpRight, Key, UserCheck, Copy, Check } from "lucide-react";
import { CONTRACT_ADDRESS, CONTRACT_ABI, EXPLORER_URL, readProvider } from "../../../lib/chain";

export default function SecurityPage() {
  const { address, signer, connected } = useWallet();

  const [contractOwner,  setContractOwner]  = useState("");
  const [isOwner,        setIsOwner]        = useState(false);
  const [loading,        setLoading]        = useState(true);
  const [newOwner,       setNewOwner]       = useState("");
  const [transferring,   setTransferring]   = useState(false);
  const [txHash,         setTxHash]         = useState("");
  const [error,          setError]          = useState("");
  const [copied,         setCopied]         = useState(false);

  async function fetchOwner() {
    setLoading(true);
    try {
      if (!CONTRACT_ADDRESS) return;
      const prov = readProvider();
      const c    = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, prov);
      // owner() is a public state variable
      const owner = await c.owner();
      setContractOwner(owner);
      if (connected && address) {
        setIsOwner(address.toLowerCase() === owner.toLowerCase());
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchOwner(); }, [connected, address]);

  async function handleTransfer() {
    if (!signer || !newOwner || !CONTRACT_ADDRESS) return;
    if (!ethers.isAddress(newOwner)) { setError("Invalid address format"); return; }
    setTransferring(true); setError(""); setTxHash("");
    try {
      const c  = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await c.transferOwnership(newOwner);
      await tx.wait();
      setTxHash(tx.hash);
      setContractOwner(newOwner);
      setIsOwner(address.toLowerCase() === newOwner.toLowerCase());
      setNewOwner("");
    } catch (err: any) { setError(err.reason || err.message); }
    finally { setTransferring(false); }
  }

  function copy(val: string) {
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 640 }}>
      <div>
        <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>Security</h1>
        <p style={{ color: "var(--text-4)", fontSize: 12, marginTop: 3 }}>Contract ownership and access control</p>
      </div>

      {/* Wallet status */}
      <div className="card" style={{ padding: "18px 20px" }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>Admin Access</h2>
        {!connected ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)", borderRadius: "var(--radius)" }}>
            <AlertTriangle size={15} style={{ color: "#dc2626", flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "#dc2626" }}>Connect your owner wallet to manage security settings.</span>
          </div>
        ) : isOwner ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "rgba(5,150,105,0.06)", border: "1px solid rgba(5,150,105,0.18)", borderRadius: "var(--radius)" }}>
            <CheckCircle2 size={15} style={{ color: "#059669", flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#059669" }}>Owner wallet connected</div>
              <div style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: "var(--text-4)", marginTop: 2 }}>{address}</div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.18)", borderRadius: "var(--radius)" }}>
            <AlertTriangle size={15} style={{ color: "#d97706", flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#d97706" }}>Read-only — not the owner wallet</div>
              <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 2 }}>Connected: {address?.slice(0,10)}…{address?.slice(-6)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Contract owner */}
      <div className="card" style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Contract Owner</h2>
          <button onClick={fetchOwner} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-4)", display: "flex" }}>
            <RefreshCw size={13} style={loading ? { animation: "rl-spin 1s linear infinite" } : {}} />
          </button>
        </div>

        {loading ? (
          <div className="skeleton" style={{ height: 44, borderRadius: 8 }} />
        ) : contractOwner ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "var(--bg-alt)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
              <Key size={14} style={{ color: "var(--brand)", flexShrink: 0 }} />
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "var(--text)", flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{contractOwner}</span>
              <button onClick={() => copy(contractOwner)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-4)", display: "flex", flexShrink: 0 }}>
                {copied ? <Check size={13} style={{ color: "#059669" }} /> : <Copy size={13} />}
              </button>
              <a href={`${EXPLORER_URL}/address/${contractOwner}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--brand)", display: "flex", flexShrink: 0 }}>
                <ArrowUpRight size={13} />
              </a>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-4)" }}>Contract:</span>
              <a href={`${EXPLORER_URL}/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "var(--brand)", textDecoration: "none", display: "flex", alignItems: "center", gap: 3 }}>
                {CONTRACT_ADDRESS?.slice(0,14)}… <ArrowUpRight size={10} />
              </a>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "var(--text-4)" }}>Contract not deployed or address not configured.</div>
        )}
      </div>

      {/* Transfer ownership */}
      <div className="card" style={{ padding: "18px 20px" }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Transfer Ownership</h2>
        <p style={{ fontSize: 12, color: "var(--text-4)", marginBottom: 16, lineHeight: 1.6 }}>
          Permanently transfers admin rights to a new wallet. This cannot be undone. The new address will control verified writers, fee splits, and treasury.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ padding: "10px 14px", background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.14)", borderRadius: "var(--radius)", display: "flex", gap: 8 }}>
            <AlertTriangle size={13} style={{ color: "#dc2626", flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 11, color: "#dc2626", lineHeight: 1.6 }}>
              Double-check the address. If you enter the wrong address you will permanently lose admin access to this contract.
            </span>
          </div>

          <input
            type="text"
            placeholder="New owner address (0x…)"
            value={newOwner}
            onChange={e => { setNewOwner(e.target.value); setError(""); }}
            className="admin-input"
            style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13 }}
            disabled={!isOwner}
          />

          {error && <div style={{ fontSize: 12, color: "#dc2626" }}>{error}</div>}
          {txHash && (
            <a href={`${EXPLORER_URL}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#059669", fontFamily: "JetBrains Mono, monospace", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
              <CheckCircle2 size={11} /> Ownership transferred · {txHash.slice(0,16)}…
            </a>
          )}

          <button
            onClick={handleTransfer}
            disabled={!isOwner || !newOwner || transferring}
            style={{ padding: "10px 16px", background: "#dc2626", color: "white", border: "none", borderRadius: "var(--radius)", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: (!isOwner || !newOwner || transferring) ? 0.5 : 1, transition: "opacity .15s" }}
          >
            {transferring ? "Transferring ownership…" : "Transfer Ownership"}
          </button>
        </div>
      </div>
      <style>{`@keyframes rl-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
