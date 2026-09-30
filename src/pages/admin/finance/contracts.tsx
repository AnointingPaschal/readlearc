/**
 * Admin → Contracts. Chain + contract addresses live in Cloudflare KV (edited here, saved with a
 * wallet-signed request). The SPA reads them from /api/config at boot — no rebuild or redeploy.
 */
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Copy, Check, ExternalLink, FileCode, AlertTriangle, CheckCircle2, Loader2, Save, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cfg, type RLConfig } from "@/lib/config";

type Field = { key: keyof RLConfig; label: string; desc: string; contract?: boolean; num?: boolean };
const FIELDS: Field[] = [
  { key: "chainId", label: "Chain ID", desc: "EVM chain id (Arc mainnet = 5042)", num: true },
  { key: "chainName", label: "Chain name", desc: "Shown in the UI" },
  { key: "rpcUrl", label: "RPC URL", desc: "JSON-RPC endpoint used by every visitor’s browser to read content" },
  { key: "explorerUrl", label: "Explorer URL", desc: "Block explorer base URL" },
  { key: "faucetUrl", label: "Faucet URL", desc: "Where users get test USDC (optional)" },
  { key: "usdc", label: "USDC token", desc: "ERC-20 USDC (6 decimals)", contract: true },
  { key: "roles", label: "Roles", desc: "Admin / moderator roles", contract: true },
  { key: "contentStore", label: "ContentStore", desc: "Articles & videos are stored here (as event logs)", contract: true },
  { key: "social", label: "Social", desc: "Profiles, follows, comments, reactions, communities", contract: true },
  { key: "monetization", label: "Monetization", desc: "Who can charge (all / auto / manual)", contract: true },
  { key: "payments", label: "Payments", desc: "Pay-to-read, subscriptions, tips", contract: true },
  { key: "streamPay", label: "StreamPay", desc: "Pay-per-second video sessions", contract: true },
  { key: "treasury", label: "Treasury", desc: "Platform fee recipient (shown for reference)" },
  { key: "startBlock", label: "Start block", desc: "Block the contracts were deployed at — event scans start here (big speed-up)", num: true },
];

export default function ContractsPage() {
  const [form, setForm] = useState<Record<string, string>>(() => Object.fromEntries(FIELDS.map((f) => [f.key, String(cfg[f.key] ?? "")])));
  const [code, setCode] = useState<Record<string, boolean | null>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState("");

  async function verify() {
    const res: Record<string, boolean | null> = {};
    try {
      const p = new ethers.JsonRpcProvider(form.rpcUrl, Number(form.chainId), { staticNetwork: true });
      await Promise.all(FIELDS.filter((f) => f.contract).map(async (f) => {
        const a = form[f.key];
        res[f.key] = ethers.isAddress(a) ? (await p.getCode(a)) !== "0x" : a ? false : null;
      }));
    } catch { FIELDS.filter((f) => f.contract).forEach((f) => (res[f.key] = null)); }
    setCode(res);
  }
  useEffect(() => { verify(); /* eslint-disable-next-line */ }, []);

  async function save() {
    setSaving(true); setMsg(null);
    try {
      const body: Record<string, unknown> = {};
      for (const f of FIELDS) {
        const v = form[f.key].trim();
        if (f.contract && v && !ethers.isAddress(v)) throw new Error(`${f.label} is not a valid address`);
        body[f.key] = f.num ? Number(v || 0) : v;
      }
      const r = await apiFetch("/api/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || `Save failed (${r.status})`);
      setMsg({ ok: true, text: "Saved to Cloudflare KV. Reloading so every page picks up the new config…" });
      setTimeout(() => location.reload(), 1200);
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
    setSaving(false);
  }

  const missing = FIELDS.filter((f) => f.contract && !form[f.key]);
  const inp = { width: "100%", boxSizing: "border-box" as const, background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", padding: "9px 12px", fontFamily: "JetBrains Mono,monospace", fontSize: 12, color: "var(--text)", outline: "none" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 760 }}>
      <div>
        <h1 style={{ fontFamily: "Outfit,sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-.02em" }}>Smart Contracts &amp; Chain</h1>
        <p style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>Stored in Cloudflare KV — change them here, no redeploy needed.</p>
      </div>

      {missing.length > 0 && (
        <div style={{ padding: "13px 16px", background: "rgba(217,119,6,.07)", border: "1px solid rgba(217,119,6,.2)", borderRadius: "var(--r-md)", display: "flex", gap: 10 }}>
          <AlertTriangle size={14} style={{ color: "#d97706", flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.65 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#d97706", marginBottom: 4 }}>Contracts not configured yet</p>
            Deploy once from the repo, then paste the addresses below:
            <pre style={{ background: "var(--bg-alt)", padding: "10px 12px", borderRadius: "var(--r)", marginTop: 6, overflowX: "auto", fontSize: 11 }}>{`cd contracts && npm install
DEPLOYER_PRIVATE_KEY=0x… RPC_URL=${form.rpcUrl || "<rpc>"} TREASURY_ADDRESS=0x… npm run deploy`}</pre>
            It prints every address (and writes <code>contracts/deployments/{form.chainId || "chainId"}.json</code>). The deploying wallet becomes the first admin.
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
        {FIELDS.map((f) => {
          const ok = code[f.key];
          return (
            <label key={f.key} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>
                <FileCode size={12} style={{ color: f.contract ? "var(--brand)" : "var(--text-4)" }} />{f.label}
                {f.contract && ok === true && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, color: "var(--accent)" }}><CheckCircle2 size={10} />contract found</span>}
                {f.contract && ok === false && <span style={{ fontSize: 10, color: "#dc2626" }}>no contract at this address</span>}
                {f.contract && form[f.key] && ethers.isAddress(form[f.key]) && (
                  <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                    <button type="button" onClick={() => { navigator.clipboard.writeText(form[f.key]); setCopied(f.key); setTimeout(() => setCopied(""), 1500); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--brand)", display: "flex" }}>{copied === f.key ? <Check size={12} /> : <Copy size={12} />}</button>
                    <a href={`${form.explorerUrl}/address/${form[f.key]}`} target="_blank" rel="noreferrer" style={{ color: "var(--brand)", display: "flex" }}><ExternalLink size={12} /></a>
                  </span>
                )}
              </span>
              <input value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} style={inp} placeholder={f.contract ? "0x…" : ""} spellCheck={false} />
              <span style={{ fontSize: 11, color: "var(--text-4)" }}>{f.desc}</span>
            </label>
          );
        })}
        {msg && <div style={{ fontSize: 12, color: msg.ok ? "var(--accent)" : "#dc2626" }}>{msg.text}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>{saving ? <Loader2 size={13} className="spin" /> : <Save size={13} />} Save to KV</button>
          <button className="btn btn-secondary btn-sm" onClick={verify}><RefreshCw size={13} /> Verify addresses</button>
        </div>
      </div>
    </div>
  );
}
