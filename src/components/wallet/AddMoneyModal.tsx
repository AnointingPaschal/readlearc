import { useEffect, useState } from "react";
import type { ethers } from "ethers";
import { Copy, ExternalLink, Plus } from "lucide-react";
import { cfg as appCfg } from "@/lib/config";
import { bankCall, type WireInstructions, type WireLink } from "@/lib/bank";
import { ErrBox, Sheet, StatusChip } from "./Sheet";

const Row = ({ k, v }: { k: string; v?: string }) => v ? (
  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
    <span style={{ color: "var(--text-4)" }}>{k}</span>
    <button onClick={() => navigator.clipboard?.writeText(v)} title="Copy" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)", fontWeight: 600, textAlign: "right", fontFamily: "inherit", fontSize: 12, display: "flex", gap: 6, alignItems: "center" }}>
      {v}<Copy size={10} style={{ color: "var(--text-4)", flexShrink: 0 }} />
    </button>
  </div>
) : null;

/** Fund the wallet: bank wire (USD/EUR) via Circle — shows the wire instructions for a linked bank account — or the testnet faucet. */
export default function AddMoneyModal({ signer, wires, circleOn, onClose, onLink }: { signer: ethers.Signer | null; wires: WireLink[]; circleOn: boolean; onClose: () => void; onLink: () => void }) {
  const [sel, setSel] = useState(wires[0]?.id || "");
  const [cur, setCur] = useState("USD");
  const [ins, setIns] = useState<WireInstructions | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sel || !signer) return;
    setLoading(true); setErr(""); setIns(null);
    bankCall<{ instructions: WireInstructions | null }>(signer, "GET", `/api/bank/wires/${sel}?currency=${cur}`)
      .then((d) => setIns(d.instructions)).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }, [sel, cur, signer]);

  const b = ins?.beneficiaryBank, bn = ins?.beneficiary;
  return (
    <Sheet title="Add money" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {circleOn && (
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontFamily: "Outfit,sans-serif", fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 2 }}>Bank wire (USD / EUR)</div>
            <div style={{ fontSize: 11, color: "var(--text-4)", marginBottom: 10, lineHeight: 1.5 }}>Send a wire from your linked bank account and it's credited as USDC.</div>
            {!wires.length ? (
              <button className="btn btn-primary btn-sm" onClick={onLink} style={{ justifyContent: "center", width: "100%" }}><Plus size={13} />Link a bank account</button>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginBottom: 8 }}>
                  <select className="input" value={sel} onChange={(e) => setSel(e.target.value)}>{wires.map((w) => <option key={w.id} value={w.id}>{w.description}</option>)}</select>
                  <select className="input" value={cur} onChange={(e) => setCur(e.target.value)} style={{ width: 80 }}><option>USD</option><option>EUR</option></select>
                </div>
                {loading && <div style={{ fontSize: 12, color: "var(--text-4)" }}>Loading instructions…</div>}
                <ErrBox msg={err} />
                {ins && (
                  <div>
                    <div style={{ padding: "8px 10px", background: "rgba(217,119,6,.08)", border: "1px solid rgba(217,119,6,.25)", borderRadius: "var(--r)", fontSize: 11, color: "#b45309", margin: "4px 0 6px", lineHeight: 1.5 }}>
                      Put this reference in the wire's reference field or the deposit can't be matched to you.
                    </div>
                    <Row k="Reference" v={ins.trackingRef} />
                    <Row k="Beneficiary" v={bn?.name} />
                    <Row k="Beneficiary address" v={[bn?.address1, bn?.address2].filter(Boolean).join(", ")} />
                    <Row k="Bank" v={b?.name} />
                    <Row k="Account number" v={b?.accountNumber} />
                    <Row k="Routing number" v={b?.routingNumber} />
                    <Row k="SWIFT / BIC" v={b?.swiftCode} />
                    <Row k="Bank address" v={[b?.address, b?.city, b?.postalCode, b?.country].filter(Boolean).join(", ")} />
                  </div>
                )}
              </>
            )}
          </div>
        )}
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontFamily: "Outfit,sans-serif", fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 2 }}>Testnet faucet</div>
          <div style={{ fontSize: 11, color: "var(--text-4)", marginBottom: 10 }}>Free test USDC for {appCfg.chainName}.</div>
          <a href={appCfg.faucetUrl || "https://faucet.circle.com"} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ justifyContent: "center", width: "100%" }}>Open faucet <ExternalLink size={12} /></a>
        </div>
        {wires.length > 0 && <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{wires.map((w) => <span key={w.id} style={{ fontSize: 11, color: "var(--text-4)", display: "flex", gap: 6, alignItems: "center" }}>{w.description}<StatusChip s={w.status || "pending"} /></span>)}</div>}
      </div>
    </Sheet>
  );
}
