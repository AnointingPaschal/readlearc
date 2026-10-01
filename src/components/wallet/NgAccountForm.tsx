import { useEffect, useState } from "react";
import type { ethers } from "ethers";
import { Check, Landmark } from "lucide-react";
import { bankCall, loadNgBanks, type NgAccount, type NgBank } from "@/lib/bank";
import { ErrBox, lbl, Spinner } from "./Sheet";

/** Add a Nigerian bank account: pick bank → type the 10-digit NUBAN → the account name is looked up and confirmed → saved as a payout recipient. */
export default function NgAccountForm({ signer, onSaved }: { signer: ethers.Signer; onSaved: (a: NgAccount) => void }) {
  const [banks, setBanks] = useState<NgBank[]>([]);
  const [code, setCode] = useState("");
  const [num, setNum] = useState("");
  const [name, setName] = useState("");
  const [looking, setLooking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => { loadNgBanks().then(setBanks); }, []);

  useEffect(() => {
    setName(""); setErr("");
    if (!/^\d{10}$/.test(num) || !code) return;
    let off = false; setLooking(true);
    bankCall<{ accountName: string }>(signer, "POST", "/api/bank/ng/resolve", { accountNumber: num, bankCode: code })
      .then((d) => { if (!off) setName(d.accountName); })
      .catch((e) => { if (!off) setErr(e.message); })
      .finally(() => { if (!off) setLooking(false); });
    return () => { off = true; };
  }, [num, code, signer]);

  async function save() {
    setSaving(true); setErr("");
    try {
      const bank = banks.find((b) => b.code === code)!;
      const d = await bankCall<{ data: NgAccount }>(signer, "POST", "/api/bank/ng/accounts", { accountNumber: num, bankCode: code, bankName: bank.name, accountName: name });
      onSaved(d.data); setNum(""); setName(""); setCode("");
    } catch (e: any) { setErr(e.message); }
    setSaving(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <label style={lbl}>Bank</label>
        <select value={code} onChange={(e) => setCode(e.target.value)} className="input">
          <option value="">Select a Nigerian bank…</option>
          {banks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
        </select>
      </div>
      <div>
        <label style={lbl}>Account number (10 digits)</label>
        <input value={num} onChange={(e) => setNum(e.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" className="input" placeholder="0123456789" style={{ fontFamily: "JetBrains Mono,monospace", letterSpacing: ".08em" }} />
      </div>
      {looking && <div style={{ fontSize: 12, color: "var(--text-4)" }}>Checking account…</div>}
      {name && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "rgba(5,150,105,.08)", border: "1px solid rgba(5,150,105,.25)", borderRadius: "var(--r)", fontSize: 13, fontWeight: 700, color: "#059669" }}><Check size={14} />{name}</div>}
      <ErrBox msg={err} />
      <button className="btn btn-primary" disabled={!name || saving} onClick={save} style={{ height: 46, justifyContent: "center", fontWeight: 700 }}>
        {saving ? <><Spinner />Saving…</> : <><Landmark size={15} />Save bank account</>}
      </button>
    </div>
  );
}
