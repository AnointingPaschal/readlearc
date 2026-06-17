"use client";
import { useState } from "react";
import { Wallet, ArrowDownLeft, AlertTriangle, ExternalLink, CheckCircle } from "lucide-react";

export default function PayoutsPage() {
  const [amount, setAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [done, setDone] = useState(false);

  const TREASURY_BALANCE = 1284.50;

  async function handleWithdraw() {
    setWithdrawing(true);
    await new Promise((r) => setTimeout(r, 2000));
    setWithdrawing(false);
    setDone(true);
    setAmount("");
    setTimeout(() => setDone(false), 3000);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Platform Payouts</h1>
        <p className="text-gray-500 text-sm mt-1">Withdraw accumulated platform fees from the Arc treasury.</p>
      </div>

      <div className="rounded-2xl p-8 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1a0a2e 0%, #0a1a0e 100%)", border: "1px solid rgba(124,58,237,0.3)" }}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-arc-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider font-semibold">Treasury Balance</div>
          <div className="text-5xl font-black text-white mb-6">
            ${TREASURY_BALANCE.toFixed(2)} <span className="text-xl text-usdc-400">USDC</span>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1.5 block">Amount to withdraw (USDC)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  max={TREASURY_BALANCE}
                  className="w-full bg-[#0a0a0f]/50 border border-white/20 rounded-xl pl-8 pr-16 py-3 text-white text-lg font-bold focus:outline-none focus:border-arc-500/50"
                />
                <button
                  onClick={() => setAmount(TREASURY_BALANCE.toString())}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-arc-400 hover:text-arc-300 transition-colors"
                >
                  MAX
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-white">Super Admin Signature Required</h3>
          <p className="text-xs text-gray-400 mt-1">
            Withdrawing from the platform treasury requires a signature from an authorized super_admin wallet registered in AdminRegistry.sol. The transaction will be logged on-chain.
          </p>
        </div>
      </div>

      <button
        onClick={handleWithdraw}
        disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > TREASURY_BALANCE || withdrawing}
        className="w-full py-4 bg-arc-600 hover:bg-arc-500 disabled:bg-gray-800 disabled:text-gray-500 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
      >
        {withdrawing ? (
          <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Awaiting Wallet Signature...</>
        ) : done ? (
          <><CheckCircle className="w-5 h-5" /> Withdrawal Complete!</>
        ) : (
          <><Wallet className="w-5 h-5" /> Withdraw to Admin Wallet</>
        )}
      </button>

      <div className="glass rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Recent Withdrawals</h2>
        <div className="space-y-3">
          {[
            { date: "Jun 1, 2026", amount: 4500.00, tx: "0x1a2b...3c4d" },
            { date: "May 1, 2026", amount: 3200.50, tx: "0x5e6f...7g8h" },
          ].map((w, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div>
                <div className="flex items-center gap-2">
                  <ArrowDownLeft className="w-4 h-4 text-usdc-400" />
                  <span className="text-sm font-medium text-white">${w.amount.toFixed(2)} USDC</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">{w.date}</div>
              </div>
              <a href="#" className="flex items-center gap-1 text-xs text-arc-400 hover:text-arc-300 font-mono">
                {w.tx} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
