import { useState } from "react";
import type { ethers } from "ethers";
import { Globe } from "lucide-react";
import { bankCall, runDeviceCheck, type WireLink } from "@/lib/bank";
import { ErrBox, lbl, Spinner } from "./Sheet";

/** Link an international bank account (USD/EUR) through Circle's wire rails. */
export default function WireForm({ signer, onSaved }: { signer: ethers.Signer; onSaved: (w: WireLink) => void }) {
  const [f, setF] = useState({ name: "", line1: "", city: "", district: "", postalCode: "", country: "US", bankName: "", bankCountry: "US", iban: "", accountNumber: "", routingNumber: "" });
  const [useIban, setUseIban] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const ok = f.name && f.line1 && f.city && f.postalCode && f.country.length === 2 && f.bankCountry.length === 2 && (useIban ? f.iban : f.accountNumber && f.routingNumber);

  async function save() {
    setBusy(true); setErr("");
    try {
      const sig = await runDeviceCheck(signer);
      const d = await bankCall<{ data: WireLink }>(signer, "POST", "/api/bank/wires", {
        ...sig,
        billingDetails: { name: f.name, line1: f.line1, city: f.city, district: f.district || undefined, postalCode: f.postalCode, country: f.country.toUpperCase() },
        bankAddress: { bankName: f.bankName || undefined, country: f.bankCountry.toUpperCase() },
        ...(useIban ? { iban: f.iban } : { accountNumber: f.accountNumber, routingNumber: f.routingNumber }),
      });
      onSaved(d.data);
    } catch (e: any) { setErr(e.message || "Couldn't link the account"); }
    setBusy(false);
  }

  const row = (l: string, k: keyof typeof f, ph = "", mono = false) => (
    <div><label style={lbl}>{l}</label><input value={f[k]} onChange={set(k)} placeholder={ph} className="input" style={mono ? { fontFamily: "JetBrains Mono,monospace" } : undefined} /></div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {row("Account holder name", "name", "As on the bank account")}
      {row("Address", "line1", "Street address")}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>{row("City", "city")}{row("State / region", "district")}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>{row("Postal code", "postalCode")}{row("Country (2 letters)", "country", "US")}</div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8 }}>{row("Bank name", "bankName")}{row("Bank country", "bankCountry", "US")}</div>
      <div style={{ display: "flex", gap: 6 }}>
        {[["US / SWIFT account", false], ["IBAN", true]].map(([l, v]) => (
          <button key={String(l)} onClick={() => setUseIban(v as boolean)} className="btn btn-sm" style={{ flex: 1, justifyContent: "center", background: useIban === v ? "var(--brand)" : "var(--bg-alt)", color: useIban === v ? "white" : "var(--text-3)" }}>{l}</button>
        ))}
      </div>
      {useIban ? row("IBAN", "iban", "DE31 1004 0048 0532 0130 00", true) : <>
        {row("Account number", "accountNumber", "", true)}
        {row("Routing number (US) or SWIFT / BIC", "routingNumber", "", true)}
      </>}
      <ErrBox msg={err} />
      <button className="btn btn-primary" disabled={!ok || busy} onClick={save} style={{ height: 46, justifyContent: "center", fontWeight: 700 }}>
        {busy ? <><Spinner />Verifying device & linking…</> : <><Globe size={15} />Link bank account</>}
      </button>
    </div>
  );
}
