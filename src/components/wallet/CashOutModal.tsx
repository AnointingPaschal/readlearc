import { useState } from "react";
import { ethers } from "ethers";
import { ArrowRight, Check, Landmark } from "lucide-react";
import { getSigner, USDC_ABI, USDC_ADDR, type StoredWallet } from "@/lib/internal-wallet";
import { bankCall, fmtNgn, fmtUsd, quoteCashout, type BankConfig, type Cashout, type NgAccount } from "@/lib/bank";
import { ErrBox, lbl, Sheet, Spinner, StatusChip } from "./Sheet";

/** USDC → Naira. Step 1: the wallet sends USDC to the platform treasury (normal transaction approval).
 *  Step 2: the server verifies that transfer on-chain and pays the Naira to the chosen bank account. */
export default function CashOutModal({ wallet, balance, cfg, accounts, onClose, onDone, onAddAccount }: {
  wallet: StoredWallet; balance: string; cfg: BankConfig; accounts: NgAccount[];
  onClose: () => void; onDone: () => void; onAddAccount: () => void;
}) {
  const [acct, setAcct] = useState(accounts[0]?.id || "");
  const [amt, setAmt] = useState("");
  const [pw, setPw] = useState("");
  const [step, setStep] = useState<"" | "send" | "pay">("");
  const [err, setErr] = useState("");
  const [rec, setRec] = useState<Cashout | null>(null);
  const [stuck, setStuck] = useState("");

  const usd = parseFloat(amt) || 0;
  const q = quoteCashout(usd, cfg);
  const tooLow = usd > 0 && usd < cfg.minUsd, tooHigh = usd > cfg.maxUsd, over = usd > parseFloat(balance);
  const ready = acct && usd > 0 && !tooLow && !tooHigh && !over && pw;

  async function go() {
    setErr(""); setStep("send");
    let hash = stuck;
    try {
      const signer = await getSigner(wallet.encryptedKey, pw);
      if (!hash) {
        const usdc = new ethers.Contract(USDC_ADDR, USDC_ABI, signer);
        const dec = await usdc.decimals();
        const tx = await usdc.transfer(cfg.treasury, ethers.parseUnits(usd.toFixed(Number(dec) > 6 ? 6 : Number(dec)), dec));
        hash = tx.hash; setStuck(hash);
        await tx.wait();
      }
      setStep("pay");
      const d = await bankCall<{ data: Cashout }>(signer, "POST", "/api/bank/ng/cashout", { txHash: hash, accountId: acct });
      setRec(d.data); setStuck(""); onDone();
    } catch (e: any) {
      const m = String(e.message || "");
      setErr(m.includes("decrypt") || m.includes("password") ? "Wrong password" : m.includes("user rejected") || m.includes("Rejected") ? "You declined the transaction" : m.slice(0, 200));
    }
    setStep("");
  }

  if (rec) return (
    <Sheet title="Cash out" onClose={onClose}>
      <div style={{ textAlign: "center", padding: "10px 0 6px" }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(5,150,105,.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><Check size={28} style={{ color: "#059669" }} /></div>
        <div style={{ fontFamily: "Outfit,sans-serif", fontSize: 26, fontWeight: 900, color: "var(--text)" }}>{fmtNgn(rec.ngn)}</div>
        <div style={{ fontSize: 12, color: "var(--text-4)", margin: "4px 0 10px" }}>to {rec.accountName} · {rec.bankName} ••{rec.last4}</div>
        <StatusChip s={rec.status} />
        <p style={{ fontSize: 12, color: "var(--text-4)", marginTop: 12, lineHeight: 1.6 }}>
          {rec.status === "success" ? "Sent. It should reflect in your account within minutes." : "Your bank transfer is being processed. This page's Bank tab shows the live status."}
        </p>
        <button className="btn btn-primary" onClick={onClose} style={{ marginTop: 14, justifyContent: "center", width: "100%", height: 46 }}>Done</button>
      </div>
    </Sheet>
  );

  return (
    <Sheet title="Cash out to Naira" onClose={onClose}>
      {!accounts.length ? (
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <Landmark size={30} style={{ color: "var(--brand)", marginBottom: 8 }} />
          <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 14 }}>Add a Nigerian bank account first.</p>
          <button className="btn btn-primary" onClick={onAddAccount} style={{ justifyContent: "center", width: "100%", height: 46 }}>Add bank account</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={lbl}>Pay to</label>
            <select className="input" value={acct} onChange={(e) => setAcct(e.target.value)}>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.bankName} ••{a.last4} — {a.accountName}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Amount (USDC)</label>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 4, background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", padding: "10px 12px" }}>
                <span style={{ fontWeight: 700, color: "var(--text-4)" }}>$</span>
                <input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="0.00" style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 18, fontWeight: 700, color: "var(--text)", minWidth: 0 }} />
              </div>
              <button onClick={() => setAmt(String(Math.min(parseFloat(balance), cfg.maxUsd)))} style={{ padding: "10px 14px", background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", fontSize: 11, fontWeight: 700, color: "var(--brand)", cursor: "pointer" }}>MAX</button>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 4 }}>Balance {fmtUsd(balance)} · limits {fmtUsd(cfg.minUsd)}–{fmtUsd(cfg.maxUsd)}</div>
          </div>
          <div style={{ padding: "12px 14px", background: "var(--bg-alt)", borderRadius: "var(--r)", display: "flex", flexDirection: "column", gap: 5 }}>
            {[["Rate", `$1 = ${fmtNgn(cfg.rate)}`], ["Fee", `${cfg.feePct}% (${fmtUsd(q.fee)})`]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-4)" }}><span>{k}</span><span style={{ fontWeight: 600, color: "var(--text-3)" }}>{v}</span></div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: "1px solid var(--border)", paddingTop: 7, marginTop: 2 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)" }}>You receive</span>
              <span style={{ fontFamily: "Outfit,sans-serif", fontSize: 20, fontWeight: 900, color: "var(--text)" }}>{fmtNgn(usd > 0 ? q.ngn : 0)}</span>
            </div>
          </div>
          <div>
            <label style={lbl}>Wallet password</label>
            <input type="password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password to sign the transfer" />
          </div>
          <ErrBox msg={tooLow ? `Minimum is ${fmtUsd(cfg.minUsd)}` : tooHigh ? `Maximum is ${fmtUsd(cfg.maxUsd)}` : over ? "Amount is more than your balance" : err} />
          {stuck && <div style={{ fontSize: 11, color: "#d97706", lineHeight: 1.5 }}>Your USDC transfer went through but the bank payout didn't finish. Press the button to retry — you won't be charged twice.</div>}
          <button className="btn btn-primary" disabled={!(ready || (stuck && pw)) || !!step} onClick={go} style={{ height: 50, justifyContent: "center", fontWeight: 700, fontSize: 15 }}>
            {step ? <><Spinner />{step === "send" ? "Sending USDC…" : "Paying out…"}</> : <>{stuck ? "Retry payout" : "Cash out"}<ArrowRight size={15} /></>}
          </button>
        </div>
      )}
    </Sheet>
  );
}
