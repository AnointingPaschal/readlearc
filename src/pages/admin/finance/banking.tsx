import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Eye, EyeOff, Save, RefreshCw, Copy } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { signedJson } from "@/lib/onchain/auth";
import { fmtNgn, fmtUsd, ago, type Cashout } from "@/lib/bank";
import { StatusChip } from "@/components/wallet/Sheet";

interface Status { circle: { ok: boolean; error?: string; env?: string }; paystack: { ok: boolean; error?: string; data?: { currency: string; balance: number }[] }; cashouts: Cashout[] }
const F = ({ l, hint, children }: { l: string; hint?: string; children: React.ReactNode }) => (
  <div><label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", display: "block", marginBottom: 4 }}>{l}</label>{children}{hint && <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 3, lineHeight: 1.5 }}>{hint}</div>}</div>
);

export default function BankingAdmin() {
  const { signer } = useAuth();
  const [s, setS] = useState<Record<string, string>>({});
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [st, setSt] = useState<Status | null>(null);
  const [testing, setTesting] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setS((p) => ({ ...p, [k]: e.target.value }));
  const webhook = typeof location !== "undefined" ? `${location.origin}/api/bank/ng/webhook` : "";

  async function test() {
    if (!signer) return; setTesting(true);
    const r = await signedJson<Status>(signer, "GET", "/api/bank/admin");
    setSt(r.ok ? r.data : null); if (!r.ok) setMsg((r.data as any)?.error || "Couldn't load status");
    setTesting(false);
  }
  useEffect(() => {
    if (!signer) return;
    signedJson<Record<string, string>>(signer, "GET", "/api/admin/settings").then((r) => { if (r.ok) setS(r.data || {}); });
    void test();
  }, [signer]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    if (!signer) return; setSaving(true); setMsg("");
    const keys = ["circle_env", "circle_api_key", "circle_account_id", "circle_client_entity_id", "paystack_secret_key", "ngn_enabled", "ngn_per_usd", "ngn_fee_pct", "ngn_min_usd", "ngn_max_usd"];
    const r = await signedJson(signer, "POST", "/api/admin/settings", Object.fromEntries(keys.map((k) => [k, s[k] ?? ""])));
    setMsg(r.ok ? "Saved" : (r.data as any)?.error || "Save failed");
    setSaving(false); if (r.ok) { void test(); setTimeout(() => setMsg(""), 2500); }
  }

  const pill = (ok: boolean | undefined, label: string, err?: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: "var(--r)", background: ok ? "rgba(5,150,105,.08)" : "var(--bg-alt)", border: `1px solid ${ok ? "rgba(5,150,105,.25)" : "var(--border)"}` }}>
      {ok ? <CheckCircle2 size={15} style={{ color: "#059669" }} /> : <XCircle size={15} style={{ color: "var(--text-4)" }} />}
      <div><div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{label}</div>{!ok && err && <div style={{ fontSize: 11, color: "var(--text-4)" }}>{err}</div>}</div>
    </div>
  );
  const bal = st?.paystack.data?.find((b) => b.currency === "NGN");
  const input = (k: string, ph = "", pw = false) => <input className="input" type={pw && !show ? "password" : "text"} value={s[k] ?? ""} onChange={set(k)} placeholder={ph} autoComplete="off" />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 760 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontFamily: "Outfit,sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>Banking</h1>
        <button className="btn btn-ghost btn-sm" onClick={test} disabled={testing}><RefreshCw size={13} className={testing ? "spin" : ""} />Test connections</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 10 }}>
        {pill(st?.circle.ok, `Circle (${st?.circle.env || s.circle_env || "sandbox"})`, st?.circle.error)}
        {pill(st?.paystack.ok, bal ? `Paystack · balance ${fmtNgn(bal.balance / 100)}` : "Paystack", st?.paystack.error)}
      </div>

      <div className="card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontFamily: "Outfit,sans-serif", fontSize: 15, fontWeight: 800, color: "var(--text)" }}>Circle — USD / EUR bank rails</div>
        <div style={{ fontSize: 12, color: "var(--text-4)", lineHeight: 1.6 }}>Enables wire-account linking, wire instructions, deposits and withdrawals in the wallet. Keys stay on the server (Cloudflare KV) and are never sent to browsers. You can also use the env vars <code>CIRCLE_API_KEY</code>, <code>CIRCLE_ENV</code>.</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <F l="Environment"><select className="input" value={s.circle_env || "sandbox"} onChange={set("circle_env")}><option value="sandbox">Sandbox</option><option value="production">Production</option></select></F>
          <F l="Account ID" hint="Optional — filters deposits/withdrawals to this account.">{input("circle_account_id", "1000565227")}</F>
        </div>
        <F l="API key">
          <div style={{ display: "flex", gap: 6 }}>{input("circle_api_key", "SAND_API_KEY:…", true)}<button className="btn btn-ghost btn-sm" onClick={() => setShow((v) => !v)}>{show ? <EyeOff size={14} /> : <Eye size={14} />}</button></div>
        </F>
        <F l="Client entity ID" hint="From POST /v1/partner/clients. Needed for the device check that Circle requires before a bank account can be created.">{input("circle_client_entity_id", "a3f1b2c4-…")}</F>
      </div>

      <div className="card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontFamily: "Outfit,sans-serif", fontSize: 15, fontWeight: 800, color: "var(--text)" }}>Nigerian banks — Naira cash-out (Paystack)</div>
        <div style={{ fontSize: 12, color: "var(--text-4)", lineHeight: 1.6 }}>Users send USDC to the treasury address; the server verifies it on-chain and pays Naira to their bank through Paystack Transfers. Your Paystack balance must cover payouts, and Transfers must be enabled on the account. The treasury address is set under Finance → Contracts.</div>
        <F l="Paystack secret key"><div style={{ display: "flex", gap: 6 }}>{input("paystack_secret_key", "sk_live_…", true)}<button className="btn btn-ghost btn-sm" onClick={() => setShow((v) => !v)}>{show ? <EyeOff size={14} /> : <Eye size={14} />}</button></div></F>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10 }}>
          <F l="₦ per $1" hint="Your payout rate.">{input("ngn_per_usd", "1500")}</F>
          <F l="Fee %">{input("ngn_fee_pct", "1")}</F>
          <F l="Min $">{input("ngn_min_usd", "1")}</F>
          <F l="Max $">{input("ngn_max_usd", "1000")}</F>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-3)" }}>
          <input type="checkbox" checked={(s.ngn_enabled ?? "true") !== "false"} onChange={(e) => setS((p) => ({ ...p, ngn_enabled: e.target.checked ? "true" : "false" }))} />Cash-out enabled
        </label>
        <F l="Webhook URL" hint="Paste into Paystack → Settings → API Keys & Webhooks so payout statuses update instantly.">
          <div style={{ display: "flex", gap: 6 }}><input className="input" readOnly value={webhook} style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 12 }} /><button className="btn btn-ghost btn-sm" onClick={() => navigator.clipboard?.writeText(webhook)}><Copy size={14} /></button></div>
        </F>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button className="btn btn-primary" onClick={save} disabled={saving || !signer}><Save size={14} />{saving ? "Saving…" : "Save banking settings"}</button>
        {msg && <span style={{ fontSize: 13, color: msg === "Saved" ? "#059669" : "#dc2626", fontWeight: 600 }}>{msg}</span>}
      </div>

      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontFamily: "Outfit,sans-serif", fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>Naira cash-outs</div>
        {!st?.cashouts.length ? <div style={{ fontSize: 12, color: "var(--text-4)" }}>None yet.</div> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead><tr style={{ textAlign: "left", color: "var(--text-4)" }}>{["When", "Wallet", "USDC", "Paid", "To", "Status"].map((h) => <th key={h} style={{ padding: "6px 8px", fontWeight: 700 }}>{h}</th>)}</tr></thead>
              <tbody>{st.cashouts.map((c) => (
                <tr key={c.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ padding: "8px" }}>{ago(c.createdAt)}</td>
                  <td style={{ padding: "8px", fontFamily: "JetBrains Mono,monospace" }}>{c.address.slice(0, 6)}…{c.address.slice(-4)}</td>
                  <td style={{ padding: "8px" }}>{fmtUsd(c.amountUsd)}</td>
                  <td style={{ padding: "8px", fontWeight: 700 }}>{fmtNgn(c.ngn)}</td>
                  <td style={{ padding: "8px" }}>{c.bankName} ••{c.last4}</td>
                  <td style={{ padding: "8px" }}><StatusChip s={c.status} />{c.error && <div style={{ fontSize: 10, color: "#dc2626", marginTop: 2, maxWidth: 200 }}>{c.error}</div>}</td>
                </tr>))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
