"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Copy, Check,
  ExternalLink, Zap, AlertCircle, Send, RefreshCw, X, Info,
} from "lucide-react";
import { motion } from "framer-motion";
import { useWallet } from "../../lib/web3Context";
import { fetchWalletHistory, USDC_ADDRESS, USDC_ABI, ARC_EXPLORER } from "../../lib/web3";
import Navbar from "../../components/ui/Navbar";

function ConnectGate() {
  const { connect, isConnecting, error } = useWallet();
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 64px)", padding: 20 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ maxWidth: 420, width: "100%", padding: "48px 28px", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--brand-muted)", border: "2px solid var(--border-brand)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Wallet size={28} style={{ color: "var(--brand)" }} />
          </div>
          <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", marginBottom: 10 }}>My Wallet</h1>
          <p style={{ color: "var(--text-3)", fontSize: 14, lineHeight: 1.65, marginBottom: 24 }}>
            Connect your MetaMask or EIP-1193 wallet to view your Circle USDC balance and transaction history.
          </p>
          {error && (
            <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-sm)", display: "flex", gap: 8, alignItems: "center", textAlign: "left" }}>
              <AlertCircle size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#ef4444" }}>{error}</span>
            </div>
          )}
          <button onClick={connect} disabled={isConnecting} className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center" }}>
            {isConnecting ? <><div className="rl-spinner" /> Connecting…</> : <><Wallet size={17} /> Connect Wallet</>}
          </button>
          <style>{`@keyframes rl-spin{to{transform:rotate(360deg)}} .rl-spinner{width:15px;height:15px;border:2px solid rgba(255,255,255,.3);border-top-color:white;border-radius:50%;animation:rl-spin .7s linear infinite;flex-shrink:0}`}</style>
        </motion.div>
      </div>
    </div>
  );
}

export default function WalletPage() {
  const { address, shortAddress, isConnected, usdcBalance, provider, signer } = useWallet();

  const [copied,      setCopied]      = useState(false);
  const [txHistory,   setTxHistory]   = useState<any[]>([]);
  const [loadingTx,   setLoadingTx]   = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);

  // Send USDC modal
  const [sendOpen,    setSendOpen]    = useState(false);
  const [sendTo,      setSendTo]      = useState("");
  const [sendAmount,  setSendAmount]  = useState("");
  const [sending,     setSending]     = useState(false);
  const [sendStep,    setSendStep]    = useState("");
  const [sendErr,     setSendErr]     = useState("");
  const [sendTxHash,  setSendTxHash]  = useState("");

  const loadTxHistory = useCallback(async () => {
    if (!isConnected || !provider) return;
    try {
      const hist = await fetchWalletHistory(address, provider);
      setTxHistory(hist);
    } catch { setTxHistory([]); }
    finally { setLoadingTx(false); setRefreshing(false); }
  }, [isConnected, address, provider]);

  useEffect(() => { loadTxHistory(); }, [loadTxHistory]);

  function copyAddress() {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSend() {
    if (!signer || !sendTo || !sendAmount || !USDC_ADDRESS) return;
    setSending(true);
    setSendErr("");
    setSendTxHash("");
    try {
      if (!ethers.isAddress(sendTo)) throw new Error("Invalid recipient address");
      const amount = parseFloat(sendAmount);
      if (isNaN(amount) || amount <= 0) throw new Error("Invalid amount");

      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const decimals = await usdc.decimals();
      const amountBig = ethers.parseUnits(sendAmount, decimals);

      setSendStep("Confirm in wallet…");
      const tx = await usdc.transfer(sendTo, amountBig);

      setSendStep("Confirming on Arc…");
      await tx.wait();
      setSendTxHash(tx.hash);
      setSendStep("Sent!");
      setSendTo("");
      setSendAmount("");
      // Refresh balance
      setTimeout(() => { setRefreshing(true); loadTxHistory(); }, 1500);
    } catch (err: any) {
      setSendErr(err.reason || err.message || "Transaction failed");
    } finally {
      setSending(false);
      if (!sendTxHash) setSendStep("");
    }
  }

  if (!isConnected) return <ConnectGate />;

  const inflows  = txHistory.filter(t => t.type === "earn").reduce((s, t) => s + t.amount, 0);
  const outflows = txHistory.filter(t => t.type === "read").reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <style>{`
        @keyframes rl-spin{to{transform:rotate(360deg)}}
        .rl-spinner{width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:white;border-radius:50%;animation:rl-spin .7s linear infinite;flex-shrink:0}
      `}</style>

      {/* Send USDC modal */}
      {sendOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card" style={{ width: "100%", maxWidth: 420, padding: "28px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: 18, fontWeight: 800, color: "var(--text)" }}>Send USDC</h2>
              <button onClick={() => { setSendOpen(false); setSendErr(""); setSendStep(""); setSendTxHash(""); }} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--border)", background: "var(--bg-alt)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)" }}>
                <X size={14} />
              </button>
            </div>

            {sendTxHash ? (
              <div style={{ textAlign: "center", padding: "8px 0" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(5,150,105,0.08)", border: "1px solid rgba(5,150,105,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <Zap size={24} style={{ color: "#059669" }} />
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>USDC Sent!</p>
                <a href={`${ARC_EXPLORER}/tx/${sendTxHash}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "var(--brand)", fontFamily: "JetBrains Mono, monospace", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  {sendTxHash.slice(0,18)}… <ExternalLink size={10} />
                </a>
                <button onClick={() => { setSendOpen(false); setSendErr(""); setSendStep(""); setSendTxHash(""); }} className="btn btn-primary btn-sm" style={{ marginTop: 18 }}>Done</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>Recipient Address</label>
                  <input
                    type="text"
                    placeholder="0x…"
                    value={sendTo}
                    onChange={e => setSendTo(e.target.value)}
                    style={{ width: "100%", background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--radius)", padding: "10px 14px", outline: "none", fontSize: 14, color: "var(--text)", fontFamily: "JetBrains Mono, monospace" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>Amount (USDC)</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--radius)", padding: "10px 14px" }}>
                    <span style={{ fontWeight: 700, color: "var(--text-4)" }}>$</span>
                    <input
                      type="number"
                      min="0.000001"
                      step="0.01"
                      placeholder="0.00"
                      value={sendAmount}
                      onChange={e => setSendAmount(e.target.value)}
                      style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 20, fontWeight: 900, fontFamily: "Outfit, sans-serif", color: "#059669" }}
                    />
                    <button onClick={() => setSendAmount(usdcBalance)} style={{ fontSize: 11, fontWeight: 700, color: "var(--brand)", background: "var(--brand-muted)", border: "1px solid var(--border-brand)", borderRadius: "var(--radius-sm)", padding: "3px 8px", cursor: "pointer" }}>MAX</button>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 4 }}>Available: ${usdcBalance} USDC</div>
                </div>

                {sendErr && (
                  <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: "var(--radius-sm)", display: "flex", gap: 8, alignItems: "center" }}>
                    <AlertCircle size={13} style={{ color: "#ef4444", flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "#ef4444" }}>{sendErr}</span>
                  </div>
                )}

                <button onClick={handleSend} disabled={sending || !sendTo || !sendAmount} className="btn btn-primary" style={{ width: "100%", justifyContent: "center", fontWeight: 700 }}>
                  {sending
                    ? <><div className="rl-spinner" /> {sendStep || "Processing…"}</>
                    : <><Send size={15} /> Send {sendAmount ? `$${sendAmount}` : ""} USDC</>
                  }
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      <div style={{ maxWidth: 660, margin: "0 auto", padding: "80px 16px 60px" }}>

        <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(22px,4vw,30px)", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 24 }}>
          My Wallet
        </motion.h1>

        {/* Balance hero */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{ borderRadius: 20, padding: "clamp(24px,4vw,36px)", marginBottom: 16, position: "relative", overflow: "hidden", background: "linear-gradient(135deg, var(--brand) 0%, var(--accent) 100%)", boxShadow: "0 12px 40px rgba(109,40,217,0.3)" }}
        >
          <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
              Circle USDC Balance · Arc Testnet
            </div>
            <div style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(36px,7vw,56px)", fontWeight: 900, color: "white", lineHeight: 1, marginBottom: 6, letterSpacing: "-0.03em" }}>
              ${usdcBalance} <span style={{ fontSize: "0.4em", fontWeight: 600, opacity: 0.75 }}>USDC</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
                {address.slice(0,14)}…{address.slice(-6)}
              </span>
              <button onClick={copyAddress} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: "white", fontSize: 11, fontWeight: 600 }}>
                {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}
        >
          <div className="card" style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Earned (writer)</div>
            <div style={{ fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 900, color: "#059669" }}>${inflows.toFixed(4)}</div>
            <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 2 }}>from article reads</div>
          </div>
          <div className="card" style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Spent (reader)</div>
            <div style={{ fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text-2)" }}>${outflows.toFixed(4)}</div>
            <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 2 }}>unlocking articles</div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}
        >
          <button onClick={() => setSendOpen(true)} className="card" style={{
            padding: "18px", textAlign: "center", cursor: "pointer", border: "none",
            background: "var(--bg-card)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
          }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--brand-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ArrowUpRight size={18} style={{ color: "var(--brand)" }} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Send USDC</div>
            <div style={{ fontSize: 11, color: "var(--text-4)" }}>Transfer to any address</div>
          </button>

          <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" className="card" style={{
            padding: "18px", textAlign: "center", cursor: "pointer", textDecoration: "none",
            background: "var(--bg-card)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
          }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(5,150,105,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ArrowDownLeft size={18} style={{ color: "#059669" }} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Get Test USDC</div>
            <div style={{ fontSize: 11, color: "var(--text-4)" }}>Circle Faucet ↗</div>
          </a>
        </motion.div>

        {/* Add USDC info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="card-flat" style={{ padding: "14px 16px", marginBottom: 20, display: "flex", gap: 10 }}>
          <Info size={14} style={{ color: "var(--brand)", flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.6 }}>
            <strong style={{ color: "var(--text-2)" }}>Circle USDC on Arc Testnet</strong> — Use the{" "}
            <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--brand)", fontWeight: 600 }}>Circle Faucet</a>{" "}
            to get test USDC. Make sure your wallet is on the Arc Testnet network. USDC payments on Readlearc are atomic and settle in under 1 second.
          </div>
        </motion.div>

        {/* TX History */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="card" style={{ padding: "20px", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: 16, fontWeight: 700, color: "var(--text)" }}>Transaction History</h2>
            <button onClick={() => { setRefreshing(true); setLoadingTx(true); loadTxHistory(); }} disabled={refreshing}
              style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid var(--border)", background: "var(--bg-alt)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)" }}>
              <RefreshCw size={13} style={refreshing ? { animation: "rl-spin 1s linear infinite" } : {}} />
            </button>
          </div>

          {loadingTx ? (
            <div>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 10, marginBottom: 10 }} />)}</div>
          ) : txHistory.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <Zap size={28} style={{ color: "var(--text-4)", marginBottom: 10 }} />
              <p style={{ color: "var(--text-3)", fontSize: 14, fontWeight: 600 }}>No on-chain activity yet</p>
              <p style={{ color: "var(--text-4)", fontSize: 12, marginTop: 4 }}>Read or publish articles to see transactions here.</p>
            </div>
          ) : (
            <div>
              {txHistory.map((tx, i) => (
                <div key={tx.hash + i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 0", borderBottom: i < txHistory.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: tx.amount > 0 ? "rgba(5,150,105,0.08)" : "var(--brand-muted)" }}>
                      {tx.amount > 0
                        ? <ArrowDownLeft size={15} style={{ color: "#059669" }} />
                        : <ArrowUpRight size={15} style={{ color: "var(--brand)" }} />
                      }
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>{tx.label}</p>
                      <a href={`${ARC_EXPLORER}/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "var(--brand)", fontFamily: "JetBrains Mono, monospace", display: "flex", alignItems: "center", gap: 3, textDecoration: "none" }}>
                        {tx.hash?.slice(0,14)}… <ExternalLink size={9} />
                      </a>
                    </div>
                  </div>
                  <span style={{ fontFamily: "Outfit, sans-serif", fontSize: 14, fontWeight: 800, color: tx.amount > 0 ? "#059669" : "var(--text-2)" }}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount.toFixed(4)} <span style={{ fontSize: 10, fontWeight: 500, color: "var(--text-4)" }}>USDC</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
