import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Eye, EyeOff, Save, RefreshCw, Copy } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { signedJson } from "@/lib/onchain/auth";
import { fmtNgn, fmtUsd, ago, type Cashout } from "@/lib/bank";
import { StatusChip } from "@/components/wallet/Sheet";

const NATURE = ["otherOperatingCompanies", "eCommercePlatform", "paymentProcessorPlatform", "cryptoSoftwareProvider", "otherCryptoServices", "marketing", "education", "nonProfit", "web3GamingSocial", "tokenProject", "p2p", "trading", "banking", "assetManager", "insurance", "healthCare", "realEstate", "construction", "agriculture", "art", "film", "accounting", "manufacturingOther", "transportation", "utilities", "cryptoExchange", "cryptoInvesting", "cryptoCustodian", "nftMarketplace", "stakingServices"];
const INST = ["privateCo", "publicCo", "soleTrader", "partnership", "coop", "foundation", "trust", "associationOrConsortium", "governmentBody"];
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
  const [cl, setCl] = useState({ clientName: "", country: "NG", natureOfBusiness: "otherOperatingCompanies", institutionType: "privateCo" });
  const [creating, setCreating] = useState(false);
  const [clMsg, setClMsg] = useState("");
  async function createClient() {
    if (!signer) return; setCreating(true); setClMsg("");
    const r = await signedJson<{ clientEntityId?: string; error?: string }>(signer, "POST", "/api/bank/client", cl);
    if (r.ok && r.data.clientEntityId) { setS((p) => ({ ...p, circle_client_entity_id: r.data.clientEntityId! })); setClMsg("Created and saved: " + r.data.clientEntityId); }
    else setClMsg(r.data?.error || "Failed");
    setCreating(false);
  }
  const [dc, setDc] = useState<{ ok?: boolean; error?: string; appId?: string; entitySecret?: boolean; walletSetId?: string; hasKey?: boolean; cipherOk?: boolean; cipherError?: string } | null>(null);
  const [wsMsg, setWsMsg] = useState("");
  async function loadDcw() { if (!signer) return; const r = await signedJson<any>(signer, "GET", "/api/dcw/admin"); if (r.ok) setDc(r.data); }
  async function makeSet() {
    if (!signer) return; setWsMsg("Creating…");
    const r = await signedJson<{ walletSetId?: string; error?: string }>(signer, "POST", "/api/dcw/admin", {});
    if (r.ok && r.data.walletSetId) { setS((p) => ({ ...p, dcw_wallet_set_id: r.data.walletSetId! })); setWsMsg("Wallet set created and saved"); void loadDcw(); } else setWsMsg(r.data?.error || "Failed");
  }
  const webhook = typeof location !== "undefined" ? `${location.origin}/api/bank/ng/webhook` : "";

  async function test() {
    if (!signer) return; setTesting(true);
    const r = await signedJson<Status>(signer, "GET", "/api/bank/admin");
    void loadDcw();
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
    const keys = ["dcw_api_key", "dcw_blockchain", "dcw_max_send_usd", "dcw_enabled", "circle_env", "circle_api_key", "circle_account_id", "circle_client_entity_id", "paystack_secret_key", "ngn_enabled", "ngn_per_usd", "ngn_fee_pct", "ngn_min_usd", "ngn_max_usd"];
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
        <F l="Client entity ID" hint="Needed for the device check Circle requires before a bank account can be created. Paste an existing one, or create it below.">{input("circle_client_entity_id", "a3f1b2c4-…")}</F>
        <details style={{ border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "10px 12px" }}>
          <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 700, color: "var(--brand)" }}>Create client entity at Circle</summary>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
            <div style={{ fontSize: 11, color: "var(--text-4)" }}>Uses the API key above (save it first). Registers your platform as a business client.</div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
              <F l="Business name"><input className="input" value={cl.clientName} onChange={(e) => setCl({ ...cl, clientName: e.target.value })} /></F>
              <F l="Country (2 letters)"><input className="input" maxLength={2} value={cl.country} onChange={(e) => setCl({ ...cl, country: e.target.value.toUpperCase() })} /></F>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <F l="Nature of business"><select className="input" value={cl.natureOfBusiness} onChange={(e) => setCl({ ...cl, natureOfBusiness: e.target.value })}>{NATURE.map((n) => <option key={n}>{n}</option>)}</select></F>
              <F l="Institution type"><select className="input" value={cl.institutionType} onChange={(e) => setCl({ ...cl, institutionType: e.target.value })}>{INST.map((n) => <option key={n}>{n}</option>)}</select></F>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={createClient} disabled={creating || !cl.clientName || cl.country.length !== 2} style={{ alignSelf: "flex-start" }}>{creating ? "Creating…" : "Create client entity"}</button>
            {clMsg && <div style={{ fontSize: 12, color: clMsg.startsWith("Created") ? "#059669" : "#dc2626" }}>{clMsg}</div>}
          </div>
        </details>
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

      <div className="card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontFamily: "Outfit,sans-serif", fontSize: 15, fontWeight: 800, color: "var(--text)" }}>Managed wallets — Circle developer-controlled (optional)</div>
        <div style={{ fontSize: 12, color: "var(--text-4)", lineHeight: 1.6 }}>
          Lets users also hold a wallet whose keys Circle secures and <b>you</b> authorise with the entity secret. Setup: (1) register an entity secret in Circle Console and <b>save the recovery file somewhere separate</b>; (2) add the secret in Cloudflare Pages → Settings → Variables as an encrypted secret named <code>CIRCLE_ENTITY_SECRET</code> — it is never stored in KV or shown here; (3) paste the developer-wallet API key below; (4) create the wallet set.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 8 }}>
          {pill(dc?.ok, dc?.ok ? `Circle connected · app ${String(dc.appId).slice(0, 8)}…` : "Developer API key", dc?.error || (dc && !dc.hasKey ? "No API key" : undefined))}
          {pill(dc?.entitySecret && dc?.cipherOk, "Entity secret", !dc?.entitySecret ? "CIRCLE_ENTITY_SECRET not set" : dc?.cipherError)}
          {pill(!!dc?.walletSetId, "Wallet set", "Not created yet")}
        </div>
        <F l="Developer-wallet API key"><div style={{ display: "flex", gap: 6 }}>{input("dcw_api_key", "TEST_API_KEY:…", true)}<button className="btn btn-ghost btn-sm" onClick={() => setShow((v) => !v)}>{show ? <EyeOff size={14} /> : <Eye size={14} />}</button></div></F>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <F l="Network"><select className="input" value={s.dcw_blockchain || "ARC-TESTNET"} onChange={set("dcw_blockchain")}><option>ARC-TESTNET</option><option>ARC</option></select></F>
          <F l="Max $ per send">{input("dcw_max_send_usd", "1000")}</F>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-3)" }}>
          <input type="checkbox" checked={(s.dcw_enabled ?? "true") !== "false"} onChange={(e) => setS((p) => ({ ...p, dcw_enabled: e.target.checked ? "true" : "false" }))} />Managed wallets enabled
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button className="btn btn-secondary btn-sm" onClick={makeSet} disabled={!dc?.ok || !dc?.entitySecret || !!dc?.walletSetId}>Create wallet set</button>
          {dc?.walletSetId && <code style={{ fontSize: 11, color: "var(--text-4)" }}>{dc.walletSetId}</code>}
          {wsMsg && <span style={{ fontSize: 12, color: wsMsg.includes("created") ? "#059669" : "var(--text-4)" }}>{wsMsg}</span>}
        </div>
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
