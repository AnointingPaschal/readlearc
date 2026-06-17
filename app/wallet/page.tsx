"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Plus, RefreshCw,
  Copy, Check, ExternalLink, Shield, Zap, AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { useWallet } from "../../lib/web3Context";
import { READLEARC_ADDRESS, READLEARC_ABI, USDC_ADDRESS, USDC_ABI } from "../../lib/web3";
import Navbar from "../../components/ui/Navbar";

const fadeUp: any = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } };

const TOP_UP_AMOUNTS = [1, 5, 10, 25];

// ── Connect Gate ───────────────────────────────────────────────
function ConnectGate() {
  const { connect, isConnecting, error } = useWallet();
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 64px)", padding: "24px" }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ maxWidth: 440, width: "100%", padding: "52px 36px", textAlign: "center" }}>
          <div style={{ width: 68, height: 68, borderRadius: "50%", background: "var(--brand-muted)", border: "2px solid var(--border-brand)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px" }}>
            <Wallet size={28} style={{ color: "var(--brand)" }} />
          </div>
          <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 24, fontWeight: 900, color: "var(--text)", marginBottom: 10, letterSpacing: "-0.02em" }}>
            Connect Your Wallet
          </h1>
          <p style={{ color: "var(--text-3)", fontSize: 14, lineHeight: 1.65, marginBottom: 28 }}>
            Connect your MetaMask or EIP-1193 wallet to view your USDC balance, top up, and see your transaction history.
          </p>
          {error && (
            <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-sm)", display: "flex", gap: 8, alignItems: "center", textAlign: "left" }}>
              <AlertCircle size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#ef4444" }}>{error}</span>
            </div>
          )}
          <button onClick={connect} disabled={isConnecting} className="btn btn-primary btn-lg" style={{ width: "100%" }}>
            {isConnecting
              ? <><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "rl-spin 0.7s linear infinite" }} /> Connecting…</>
              : <><Wallet size={17} /> Connect Wallet</>
            }
          </button>
          <style>{`@keyframes rl-spin { to { transform: rotate(360deg); } }`}</style>
        </motion.div>
      </div>
    </div>
  );
}

// ── Main wallet page ────────────────────────────────────────────
export default function WalletPage() {
  const { address, shortAddress, isConnected, usdcBalance, provider, signer } = useWallet();
  const [copied, setCopied] = useState(false);
  const [topupAmount, setTopupAmount] = useState<number | null>(null);
  const [toppingUp, setToppingUp] = useState(false);
  const [topupDone, setTopupDone] = useState(false);
  const [txHistory, setTxHistory] = useState<any[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);

  useEffect(() => {
    if (!isConnected || !provider || !READLEARC_ADDRESS) return;
    setLoadingTx(true);
    async function fetchEvents() {
      try {
        const contract = new ethers.Contract(READLEARC_ADDRESS, READLEARC_ABI, provider!);
        const filter = contract.filters.ArticleRead(null, address);
        const events = await contract.queryFilter(filter, -10000);
        const hist = events.slice(-10).reverse().map((e: any) => ({
          type: "read",
          title: `Article #${e.args.id.toString()}`,
          amount: -(parseFloat(ethers.formatUnits(e.args.price, 6))),
          hash: e.transactionHash,
          blockNum: e.blockNumber,
        }));
        setTxHistory(hist);
      } catch { setTxHistory([]); }
      finally { setLoadingTx(false); }
    }
    fetchEvents();
  }, [isConnected, address, provider]);

  function copyAddress() {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleTopUp() {
    if (!topupAmount) return;
    setToppingUp(true);
    await new Promise(r => setTimeout(r, 1800));
    setToppingUp(false);
    setTopupDone(true);
    setTimeout(() => setTopupDone(false), 3000);
  }

  if (!isConnected) return <ConnectGate />;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <style>{`@keyframes rl-spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "80px 20px 60px" }}>
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ fontFamily: "Outfit, sans-serif", fontSize: 32, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 28 }}>
          My Wallet
        </motion.h1>

        {/* Balance hero card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{
            borderRadius: 20, padding: "36px 32px", marginBottom: 20, position: "relative", overflow: "hidden",
            background: "linear-gradient(135deg, var(--brand) 0%, var(--accent) 100%)",
            boxShadow: "0 12px 40px rgba(109,40,217,0.35)",
          }}
        >
          <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Shield size={14} color="rgba(255,255,255,0.7)" />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>Arc Testnet · USDC Balance</span>
            </div>
            <div style={{ fontSize: "clamp(40px,8vw,60px)", fontWeight: 900, fontFamily: "Outfit, sans-serif", color: "white", lineHeight: 1, marginBottom: 4, letterSpacing: "-0.03em" }}>
              ${usdcBalance} <span style={{ fontSize: "0.45em", fontWeight: 600, opacity: 0.8 }}>USDC</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18 }}>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
                {address.slice(0, 14)}…{address.slice(-6)}
              </span>
              <button onClick={copyAddress} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: "white", fontSize: 12 }}>
                {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Quick actions */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}
        >
          <div className="card" style={{ padding: "18px", textAlign: "center", cursor: "pointer" }}>
            <ArrowDownLeft size={20} style={{ color: "#059669", margin: "0 auto 8px" }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Top Up</div>
            <div style={{ fontSize: 11, color: "var(--text-4)" }}>Add USDC</div>
          </div>
          <div className="card" style={{ padding: "18px", textAlign: "center", cursor: "pointer" }}>
            <ArrowUpRight size={20} style={{ color: "var(--brand)", margin: "0 auto 8px" }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Send</div>
            <div style={{ fontSize: 11, color: "var(--text-4)" }}>Transfer USDC</div>
          </div>
        </motion.div>

        {/* Top-up panel */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card" style={{ padding: "24px 22px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <Plus size={15} style={{ color: "#059669" }} />
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Top Up USDC</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
            {TOP_UP_AMOUNTS.map(amt => (
              <button key={amt} onClick={() => setTopupAmount(amt)} style={{
                padding: "12px 8px", borderRadius: "var(--radius)",
                border: `1.5px solid ${topupAmount === amt ? "var(--brand)" : "var(--border)"}`,
                background: topupAmount === amt ? "var(--brand-muted)" : "var(--bg-alt)",
                color: topupAmount === amt ? "var(--brand)" : "var(--text-3)",
                fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all 0.15s",
              }}>
                ${amt}
              </button>
            ))}
          </div>
          <button onClick={handleTopUp} disabled={!topupAmount || toppingUp} className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
            {toppingUp
              ? <><RefreshCw size={14} style={{ animation: "rl-spin 1s linear infinite" }} /> Processing via Circle…</>
              : topupDone ? "✓ Top-up Successful!"
              : <><ArrowDownLeft size={14} /> Top Up {topupAmount ? `$${topupAmount} USDC` : "USDC"}</>
            }
          </button>
          <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-4)", marginTop: 10 }}>
            Powered by Circle Gateway · Instant on Arc
          </p>
        </motion.div>

        {/* Transaction history */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card" style={{ padding: "22px", overflow: "hidden" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 18 }}>Transaction History</h2>
          {loadingTx ? (
            <div>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 10, marginBottom: 10 }} />)}
            </div>
          ) : txHistory.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <Zap size={28} style={{ color: "var(--text-4)", marginBottom: 10 }} />
              <p style={{ color: "var(--text-3)", fontSize: 14, fontWeight: 600 }}>No transactions yet</p>
              <p style={{ color: "var(--text-4)", fontSize: 12, marginTop: 4 }}>Your on-chain read receipts will appear here.</p>
            </div>
          ) : (
            <div>
              {txHistory.map((tx, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: i < txHistory.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: tx.amount > 0 ? "rgba(5,150,105,0.1)" : "var(--brand-muted)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {tx.amount > 0
                        ? <ArrowDownLeft size={16} style={{ color: "#059669" }} />
                        : <ArrowUpRight size={16} style={{ color: "var(--brand)" }} />
                      }
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{tx.title}</p>
                      <a href={`https://explorer.arc.io/testnet/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "var(--brand)", fontFamily: "JetBrains Mono, monospace", display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
                        {tx.hash?.slice(0, 14)}… <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 14, fontWeight: 700, color: tx.amount > 0 ? "#059669" : "var(--text-2)" }}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount.toFixed(2)} USDC
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
