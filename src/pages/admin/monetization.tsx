/**
 * Admin → Monetization. Decide who can charge for content (all on-chain, Monetization contract):
 *   • Everyone         — one switch turns paid content on for all creators
 *   • Automatic        — creators qualify when they hit follower / post / account-age thresholds
 *   • Manual           — approve, reject or block specific wallets (applications appear here)
 * A creator is monetized if (not blocked) AND (everyone OR manually approved OR meets the automatic rules).
 */
import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { BadgeDollarSign, Users, Sparkles, UserCheck, Loader2, Check, X, Ban, RotateCcw } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cfg, explainError, shortAddr } from "@/lib/chain";
import { getRules, adminSetAll, adminSetAuto, adminSetCreator, listCreatorStatuses, MON_STATUS, type MonRules, type CreatorMon } from "@/lib/onchain/money";
import { getProfiles } from "@/lib/onchain/social";
import { withActivity } from "@/lib/activity";
import { Link } from "@/lib/nav";

const STATUS_COLOR = ["#6b7280", "#d97706", "#059669", "#dc2626", "#7f1d1d"];

export default function MonetizationAdmin() {
  const { signer } = useAuth();
  const [rules, setRules] = useState<MonRules | null>(null);
  const [draft, setDraft] = useState({ auto: false, minFollowers: 0, minPosts: 0, minAccountDays: 0 });
  const [rows, setRows] = useState<(CreatorMon & { name?: string })[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved" | "blocked" | "all">("pending");
  const [addr, setAddr] = useState("");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      if (!cfg.monetization) {
        setErr("Contracts are not configured yet. Go to Admin → Finance → Contracts to set the Monetization contract address.");
        return;
      }
      const r = await getRules();
      setRules(r);
      setDraft({ auto: r.auto, minFollowers: r.minFollowers, minPosts: r.minPosts, minAccountDays: r.minAccountDays });
      const list = await listCreatorStatuses();
      const profs = await getProfiles(list.map((x) => x.address));
      setRows(list.map((x) => ({ ...x, name: profs.get(x.address.toLowerCase())?.username ?? undefined })).sort((a, b) => b.at - a.at));
    } catch (e) {
      const msg = explainError(e, "Could not load monetization settings");
      // Surface a cleaner message when the RPC call fails because the contract address is wrong/empty
      setErr(
        msg.startsWith("Network error") && !cfg.monetization
          ? "Contracts are not configured yet. Go to Admin → Finance → Contracts to set the Monetization contract address."
          : msg
      );
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function run(label: string, fn: () => Promise<unknown>) {
    if (!signer) { setErr("Connect an admin wallet."); return; }
    setBusy(label); setErr("");
    try { await withActivity(label, async () => { await fn(); }); await load(); }
    catch (e) { setErr(explainError(e, "Transaction failed")); }
    setBusy("");
  }
  const setStatus = (who: string, status: number) => run("Updating creator", () => adminSetCreator(signer!, [who], status));

  const shown = rows.filter((r) => filter === "all" ? true : filter === "pending" ? r.status === 1 : filter === "approved" ? r.status === 2 : r.status === 4 || r.status === 3);
  const input = { background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", padding: "8px 10px", fontSize: 13, color: "var(--text)", outline: "none", width: "100%", boxSizing: "border-box" as const };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 900 }}>
      <div>
        <h1 style={{ fontFamily: "Outfit,sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-.02em", display: "flex", alignItems: "center", gap: 8 }}>
          <BadgeDollarSign size={20} style={{ color: "var(--brand)" }} /> Content Monetization
        </h1>
        <p style={{ fontSize: 12, color: "var(--text-4)", marginTop: 3 }}>Choose who can charge for articles &amp; videos, take subscriptions and tips. Stored on-chain — every change is a transaction.</p>
      </div>
      {err && <div style={{ padding: "10px 14px", background: "rgba(220,38,38,.06)", border: "1px solid rgba(220,38,38,.2)", borderRadius: "var(--r)", color: "#dc2626", fontSize: 13 }}>{err}</div>}
      {!rules ? <div className="card skeleton" style={{ height: 160 }} /> : (<>
        {/* Everyone */}
        <div className="card" style={{ padding: 18, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <Users size={18} style={{ color: "var(--brand)" }} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>Enable for all users</div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>Every creator can charge. Blocked wallets below are still excluded.</div>
          </div>
          <button className={`btn btn-sm ${rules.all ? "btn-primary" : "btn-secondary"}`} disabled={!!busy} onClick={() => run("Saving", () => adminSetAll(signer!, !rules.all))}>
            {busy === "Saving" ? <Loader2 size={13} className="spin" /> : null}{rules.all ? "On — click to turn off" : "Off — click to turn on"}
          </button>
        </div>

        {/* Automatic */}
        <div className="card" style={{ padding: 18, opacity: rules.all ? .6 : 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <Sparkles size={18} style={{ color: "var(--brand)" }} />
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>Automatic requirements</div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>Creators who meet <b>all</b> thresholds are enabled automatically — checked live against their on-chain followers, posts and account age.</div>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>
              <input type="checkbox" checked={draft.auto} onChange={(e) => setDraft({ ...draft, auto: e.target.checked })} style={{ accentColor: "var(--brand)" }} /> Enabled
            </label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 12 }}>
            {([["minFollowers", "Min. followers"], ["minPosts", "Min. approved posts"], ["minAccountDays", "Min. account age (days)"]] as const).map(([k, l]) => (
              <label key={k} style={{ fontSize: 11, fontWeight: 600, color: "var(--text-4)", display: "flex", flexDirection: "column", gap: 5 }}>{l}
                <input type="number" min={0} value={draft[k]} disabled={!draft.auto} onChange={(e) => setDraft({ ...draft, [k]: Math.max(0, Number(e.target.value) || 0) })} style={input} />
              </label>
            ))}
          </div>
          <button className="btn btn-primary btn-sm" disabled={!!busy} onClick={() => run("Saving rules", () => adminSetAuto(signer!, draft))}>
            {busy === "Saving rules" ? <Loader2 size={13} className="spin" /> : null} Save automatic rules on-chain
          </button>
        </div>

        {/* Manual */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <UserCheck size={18} style={{ color: "var(--brand)" }} />
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>Specific users (manual)</div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>Approve applications, enable a wallet directly, or block one. Approved wallets are monetized regardless of the thresholds.</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            <input value={addr} onChange={(e) => setAddr(e.target.value.trim())} placeholder="0x… wallet address" style={{ ...input, flex: 1, minWidth: 240, fontFamily: "JetBrains Mono,monospace", fontSize: 12 }} />
            <button className="btn btn-primary btn-sm" disabled={!ethers.isAddress(addr) || !!busy} onClick={() => setStatus(addr, 2).then(() => setAddr(""))}><Check size={13} /> Enable</button>
            <button className="btn btn-secondary btn-sm" disabled={!ethers.isAddress(addr) || !!busy} onClick={() => setStatus(addr, 4).then(() => setAddr(""))}><Ban size={13} /> Block</button>
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            {(["pending", "approved", "blocked", "all"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: "5px 12px", borderRadius: 99, border: `1.5px solid ${filter === f ? "var(--brand)" : "var(--border)"}`, background: filter === f ? "var(--brand-muted)" : "transparent", color: filter === f ? "var(--brand)" : "var(--text-3)", fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>
                {f}{f === "pending" ? ` (${rows.filter((r) => r.status === 1).length})` : ""}
              </button>
            ))}
          </div>
          {shown.length === 0 ? <div style={{ padding: "26px 0", textAlign: "center", fontSize: 13, color: "var(--text-4)" }}>Nothing here.</div> : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {shown.map((r) => (
                <div key={r.address} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <Link href={`/profile/${r.address}`} style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", textDecoration: "none" }}>{r.name ? `@${r.name}` : shortAddr(r.address)}</Link>
                    <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 10, color: "var(--text-4)" }}>{r.address}</div>
                    {r.note && <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3, fontStyle: "italic" }}>“{r.note}”</div>}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: STATUS_COLOR[r.status], background: `${STATUS_COLOR[r.status]}14`, border: `1px solid ${STATUS_COLOR[r.status]}33`, padding: "2px 9px", borderRadius: 99, textTransform: "uppercase" }}>{MON_STATUS[r.status]}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    {r.status !== 2 && <button className="btn btn-primary btn-xs" disabled={!!busy} onClick={() => setStatus(r.address, 2)}><Check size={11} />Approve</button>}
                    {r.status === 1 && <button className="btn btn-secondary btn-xs" disabled={!!busy} onClick={() => setStatus(r.address, 3)}><X size={11} />Reject</button>}
                    {r.status !== 4 && <button className="btn btn-secondary btn-xs" disabled={!!busy} onClick={() => setStatus(r.address, 4)}><Ban size={11} />Block</button>}
                    {r.status !== 0 && <button className="btn btn-ghost btn-xs" disabled={!!busy} onClick={() => setStatus(r.address, 0)} title="Reset to default"><RotateCcw size={11} /></button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </>)}
    </div>
  );
}
