"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Wallet, ArrowUpRight, AlertCircle, ExternalLink, Send } from "lucide-react";
import { useWallet } from "../../../../lib/web3Context";
import { USDC_ADDRESS, USDC_ABI, ARC_EXPLORER } from "../../../../lib/web3";

export default function PayoutsPage() {
  const { address, isConnected, signer, provider } = useWallet();
  const [balance,      setBalance]      = useState("0.00");
  const [toAddress,    setToAddress]    = useState("");
  const [amount,       setAmount]       = useState("");
  const [withdrawing,  setWithdrawing]  = useState(false);
  const [txHash,       setTxHash]       = useState("");
  const [error,        setError]        = useState("");

  useEffect(() => {
    if (!provider || !USDC_ADDRESS || !address) return;
    const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);
    usdc.balanceOf(address).then(async (bal: bigint) => {
      const dec = await usdc.decimals();
      setBalance(parseFloat(ethers.formatUnits(bal, dec)).toFixed(4));
    }).catch(() => {});
  }, [provider, address]);

  async function handleWithdraw() {
    if (!signer || !USDC_ADDRESS || !toAddress || !amount) return;
    setWithdrawing(true); setError(""); setTxHash("");
    try {
      if (!ethers.isAddress(toAddress)) throw new Error("Invalid address");
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const dec  = await usdc.decimals();
      const tx   = await usdc.transfer(toAddress, ethers.parseUnits(amount, dec));
      await tx.wait();
      setTxHash(tx.hash);
      setToAddress(""); setAmount("");
    } catch (err: any) { setError(err.reason || err.message); }
    finally { setWithdrawing(false); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 560 }}>
      <div>
        <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>Platform Payouts</h1>
        <p style={{ color: "var(--text-4)", fontSize: 12, marginTop: 3 }}>Manage USDC balance and withdraw platform fees</p>
      </div>

      {/* Balance card */}
      <div style={{ borderRadius: 20, padding: "28px", background: "linear-gradient(135deg, var(--brand) 0%, var(--accent) 100%)", boxShadow: "0 10px 32px rgba(109,40,217,0.3)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
            Connected Wallet · USDC Balance
          </div>
          <div style={{ fontFamily: "Outfit, sans-serif", fontSize: 44, fontWeight: 900, color: "white", lineHeight: 1, letterSpacing: "-0.03em" }}>
            ${balance} <span style={{ fontSize: "0.45em", opacity: 0.75 }}>USDC</span>
          </div>
          {address && (
            <div style={{ marginTop: 12, fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
              {address.slice(0,14)}…{address.slice(-6)}
            </div>
          )}
        </div>
      </div>

      {!isConnected ? (
        <div style={{ padding: "14px 16px", background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)", borderRadius: "var(--radius)", display: "flex", gap: 10 }}>
          <AlertCircle size={14} style={{ color: "#dc2626", flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 13, color: "#dc2626" }}>Connect owner wallet to withdraw platform USDC.</span>
        </div>
      ) : (
        <div className="card" style={{ padding: "22px" }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>Send / Withdraw USDC</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Recipient Address</label>
              <input type="text" placeholder="0x…" value={toAddress} onChange={e => setToAddress(e.target.value)} className="admin-input" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Amount (USDC)</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--radius)", padding: "10px 14px" }}>
                <span style={{ fontWeight: 700, color: "var(--text-4)" }}>$</span>
                <input type="number" min="0" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)}
                  style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 900, color: "var(--brand)" }} />
                <button onClick={() => setAmount(balance)} style={{ fontSize: 11, fontWeight: 700, color: "var(--brand)", background: "var(--brand-muted)", border: "1px solid var(--border-brand)", borderRadius: "var(--radius-sm)", padding: "3px 8px", cursor: "pointer" }}>MAX</button>
              </div>
            </div>
            {error && <div style={{ fontSize: 12, color: "#dc2626" }}>{error}</div>}
            {txHash && (
              <a href={`${ARC_EXPLORER}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#059669", fontFamily: "JetBrains Mono, monospace", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                <ExternalLink size={10} /> Tx: {txHash.slice(0,16)}…
              </a>
            )}
            <button onClick={handleWithdraw} disabled={withdrawing || !toAddress || !amount} className="btn btn-primary" style={{ justifyContent: "center", fontWeight: 700 }}>
              {withdrawing ? "Processing…" : <><Send size={14} /> Send USDC</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
