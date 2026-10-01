import { useCallback, useEffect, useState } from "react";
import type { ethers } from "ethers";
import { ArrowRight, Banknote, Check, Copy, Download, Send, Shield, Upload } from "lucide-react";
import { bankCall, fmtNgn, fmtUsd, quoteCashout, type BankConfig, type Cashout, type NgAccount } from "@/lib/bank";
import { ErrBox, lbl, Sheet, Spinner } from "./Sheet";

interface Managed { walletId: string; address: string; blockchain: string }
type Mode = "" | "send" | "cashout" | "receive";

const nonce = () => crypto.randomUUID();
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Poll Circle (through our API) until the transfer has a tx hash and is final. */
async function settle(signer: ethers.Signer, id: string): Promise<string> {
  for (let i = 0; i < 45; i++) {
    const t = await bankCall<{ state: string; txHash: string | null; errorReason?: string }>(signer, "GET", `/api/dcw/send?id=${id}`);
    if (["FAILED", "DENIED", "CANCELLED"].includes(t.state)) throw new Error(`Transfer ${t.state.toLowerCase()}${t.errorReason ? ": " + t.errorReason : ""}`);
    if (t.txHash && ["CONFIRMED", "COMPLETE"].includes(t.state)) return t.txHash;
    await wait(2000);
  }
  throw new Error("Still processing — check the wallet again in a minute");
}

/** Optional second wallet type: a managed wallet (Circle holds the keys, this site authorises). Lives beside the user's own self-custody wallet. */
export default function ManagedWallet({ signer, cfg, ngAccounts, mainAddress, onUnlock, onFund, onChanged }: {
  signer: ethers.Signer | null; cfg: BankConfig; ngAccounts: NgAccount[]; mainAddress: string;
  onUnlock: () => void; onFund: (managedAddress: string) => void; onChanged: () => void;
}) {
  const [w, setW] = useState<Managed | null>(null);
  const [bal, setBal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [mode, setMode] = useState<Mode>("");
  const [to, setTo] = useState(""); const [amt, setAmt] = useState(""); const [acct, setAcct] = useState("");
  const [step, setStep] = useState(""); const [done, setDone] = useState<{ text: string; sub?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!signer) return; setLoading(true);
    try { const d = await bankCall<{ wallet: Managed | null; balance: string | null; error?: string }>(signer, "GET", "/api/dcw/wallet"); setW(d.wallet); setBal(d.balance); if (d.error) setErr(d.error); }
    catch (e: any) { setErr(e.message); }
    setLoading(false);
  }, [signer]);
  useEffect(() => { void load(); }, [load]);

  async function create() {
    if (!signer) return onUnlock();
    setBusy(true); setErr("");
    try { const d = await bankCall<{ wallet: Managed }>(signer, "POST", "/api/dcw/wallet", {}); setW(d.wallet); setBal("0"); } catch (e: any) { setErr(e.message); }
    setBusy(false);
  }
  const close = () => { setMode(""); setTo(""); setAmt(""); setErr(""); setStep(""); setDone(null); };

  async function send(dest: string) {
    if (!signer) return; setErr(""); setStep("Sending…");
    try {
      const r = await bankCall<{ id: string }>(signer, "POST", "/api/dcw/send", { to: dest, amount: amt, nonce: nonce() });
      setStep("Confirming on-chain…"); const hash = await settle(signer, r.id);
      setDone({ text: `${fmtUsd(amt)} sent`, sub: hash }); void load(); onChanged();
    } catch (e: any) { setErr(e.message); }
    setStep("");
  }

  async function cashout() {
    if (!signer || !cfg.treasury) return; setErr(""); setStep("Sending USDC…");
    try {
      const r = await bankCall<{ id: string }>(signer, "POST", "/api/dcw/send", { to: cfg.treasury, amount: amt, nonce: nonce() });
      setStep("Confirming on-chain…"); const hash = await settle(signer, r.id);
      setStep("Paying out…");
      const c = await bankCall<{ data: Cashout }>(signer, "POST", "/api/bank/ng/cashout", { txHash: hash, accountId: acct });
      setDone({ text: fmtNgn(c.data.ngn), sub: `to ${c.data.accountName} · ${c.data.bankName} ••${c.data.last4} — ${c.data.status}` }); void load(); onChanged();
    } catch (e: any) { setErr(e.message); }
    setStep("");
  }

  if (!cfg.managed) return null;
  const usd = parseFloat(amt) || 0;
  const q = quoteCashout(usd, cfg);
  const balN = parseFloat(bal || "0");
  const over = usd > balN;
  const card: React.CSSProperties = { padding: "14px 16px", marginBottom: 12 };

  return (
    <div className="card" style={card}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 11, background: "linear-gradient(135deg,#2775ca,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}><Shield size={17} color="white" /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "Outfit,sans-serif", fontSize: 14, fontWeight: 800, color: "var(--text)" }}>Managed wallet</div>
          <div style={{ fontSize: 11, color: "var(--text-4)" }}>Keys secured by Circle · no password to sign</div>
        </div>
        {w && <div style={{ textAlign: "right" }}><div style={{ fontFamily: "Outfit,sans-serif", fontSize: 17, fontWeight: 800, color: "var(--text)" }}>{loading && bal === null ? "…" : fmtUsd(balN)}</div><div style={{ fontSize: 10, color: "var(--text-4)" }}>USDC</div></div>}
      </div>

      {!signer ? (
        <button className="btn btn-secondary btn-sm" onClick={onUnlock} style={{ width: "100%", justifyContent: "center" }}>Unlock wallet to use</button>
      ) : !w ? (
        <>
          <button className="btn btn-primary btn-sm" onClick={create} disabled={busy || loading} style={{ width: "100%", justifyContent: "center" }}>{busy ? "Creating…" : "Create my managed wallet"}</button>
          <ErrBox msg={err} />
        </>
      ) : (
        <>
          <button onClick={() => { navigator.clipboard?.writeText(w.address); setCopied(true); setTimeout(() => setCopied(false), 1500); }} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg-alt)", border: "1px solid var(--border)", borderRadius: "var(--r-f)", padding: "4px 11px", cursor: "pointer", marginBottom: 10 }}>
            <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 11, color: "var(--text-3)" }}>{w.address.slice(0, 8)}…{w.address.slice(-6)}</span>
            {copied ? <Check size={11} style={{ color: "#059669" }} /> : <Copy size={11} style={{ color: "var(--text-4)" }} />}
          </button>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
            {[["Add", Download, () => onFund(w.address)], ["Send", Send, () => setMode("send")], ["To me", Upload, () => { setTo(mainAddress); setMode("send"); }], ["Cash out", Banknote, () => { setAcct(ngAccounts[0]?.id || ""); setMode("cashout"); }]].map(([l, Icon, fn]: any) => (
              <button key={l} onClick={fn} disabled={l === "Cash out" && !cfg.ngn} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "9px 2px", background: "var(--bg-alt)", border: "1px solid var(--border)", borderRadius: "var(--r)", cursor: "pointer", opacity: l === "Cash out" && !cfg.ngn ? .4 : 1 }}>
                <Icon size={15} style={{ color: "var(--brand)" }} /><span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)" }}>{l}</span>
              </button>
            ))}
          </div>
          {err && !mode && <div style={{ marginTop: 8 }}><ErrBox msg={err} /></div>}
        </>
      )}

      {mode === "send" && w && (
        <Sheet title="Send from managed wallet" onClose={close}>
          {done ? (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(5,150,105,.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}><Check size={26} style={{ color: "#059669" }} /></div>
              <div style={{ fontFamily: "Outfit,sans-serif", fontSize: 20, fontWeight: 900 }}>{done.text}</div>
              <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 10, color: "var(--text-4)", margin: "6px 0 14px", wordBreak: "break-all" }}>{done.sub}</div>
              <button className="btn btn-primary" onClick={close} style={{ width: "100%", justifyContent: "center", height: 46 }}>Done</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div><label style={lbl}>Recipient address</label><input className="input" value={to} onChange={(e) => setTo(e.target.value.trim())} placeholder="0x…" style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 13 }} /></div>
              <div><label style={lbl}>Amount (USDC)</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="input" type="number" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="0.00" style={{ flex: 1 }} />
                  <button className="btn btn-ghost btn-sm" onClick={() => setAmt(String(Math.min(balN, cfg.managedMax || balN)))}>MAX</button>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 4 }}>Balance {fmtUsd(balN)} · limit {fmtUsd(cfg.managedMax || 0)} per send</div>
              </div>
              <div style={{ fontSize: 11, color: "#b45309", background: "rgba(217,119,6,.08)", border: "1px solid rgba(217,119,6,.25)", padding: "8px 10px", borderRadius: "var(--r)", lineHeight: 1.5 }}>Sends can't be undone. Double-check the address.</div>
              <ErrBox msg={over ? "Amount is more than the balance" : err} />
              <button className="btn btn-primary" disabled={!/^0x[0-9a-fA-F]{40}$/.test(to) || !usd || over || !!step} onClick={() => send(to)} style={{ height: 48, justifyContent: "center", fontWeight: 700 }}>
                {step ? <><Spinner />{step}</> : <>Confirm & send<ArrowRight size={15} /></>}
              </button>
            </div>
          )}
        </Sheet>
      )}

      {mode === "cashout" && w && (
        <Sheet title="Cash out from managed wallet" onClose={close}>
          {done ? (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(5,150,105,.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}><Check size={26} style={{ color: "#059669" }} /></div>
              <div style={{ fontFamily: "Outfit,sans-serif", fontSize: 24, fontWeight: 900 }}>{done.text}</div>
              <div style={{ fontSize: 12, color: "var(--text-4)", margin: "6px 0 14px" }}>{done.sub}</div>
              <button className="btn btn-primary" onClick={close} style={{ width: "100%", justifyContent: "center", height: 46 }}>Done</button>
            </div>
          ) : !ngAccounts.length ? (
            <p style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center", padding: "10px 0" }}>Add a Nigerian bank account in the Bank tab first.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div><label style={lbl}>Pay to</label><select className="input" value={acct} onChange={(e) => setAcct(e.target.value)}>{ngAccounts.map((a) => <option key={a.id} value={a.id}>{a.bankName} ••{a.last4} — {a.accountName}</option>)}</select></div>
              <div><label style={lbl}>Amount (USDC)</label>
                <input className="input" type="number" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="0.00" />
                <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 4 }}>Balance {fmtUsd(balN)} · limits {fmtUsd(cfg.minUsd)}–{fmtUsd(Math.min(cfg.maxUsd, cfg.managedMax || cfg.maxUsd))}</div>
              </div>
              <div style={{ padding: "12px 14px", background: "var(--bg-alt)", borderRadius: "var(--r)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 700 }}>You receive · fee {cfg.feePct}%</span>
                <span style={{ fontFamily: "Outfit,sans-serif", fontSize: 20, fontWeight: 900 }}>{fmtNgn(usd > 0 ? q.ngn : 0)}</span>
              </div>
              <ErrBox msg={usd > 0 && usd < cfg.minUsd ? `Minimum is ${fmtUsd(cfg.minUsd)}` : usd > cfg.maxUsd ? `Maximum is ${fmtUsd(cfg.maxUsd)}` : over ? "Amount is more than the balance" : err} />
              <button className="btn btn-primary" disabled={!acct || !usd || usd < cfg.minUsd || usd > cfg.maxUsd || over || !!step} onClick={cashout} style={{ height: 48, justifyContent: "center", fontWeight: 700 }}>
                {step ? <><Spinner />{step}</> : <>Cash out<ArrowRight size={15} /></>}
              </button>
            </div>
          )}
        </Sheet>
      )}
    </div>
  );
}
