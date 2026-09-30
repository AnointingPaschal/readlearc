/**
 * Admin → Earnings. Payments settle directly on-chain (reader → writer / treasury / referrer in a
 * single transaction), so there is nothing to "pay out" — this page is a live ledger of every
 * payment read from the Payments contract's events.
 */
import { useEffect, useMemo, useState } from "react";
import { DollarSign, RefreshCw, ExternalLink, BookOpen, Users, Heart } from "lucide-react";
import { allPayments, type EarningRow } from "@/lib/onchain/money";
import { getProfiles } from "@/lib/onchain/social";
import { txUrl } from "@/lib/config";
import { shortAddr, IS_CONFIGURED } from "@/lib/chain";
import { Link } from "@/lib/nav";

const ICON = { read: BookOpen, subscription: Users, tip: Heart, video: DollarSign } as const;

export default function AdminEarningsPage() {
  const [rows, setRows] = useState<EarningRow[]>([]);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!IS_CONFIGURED) { setLoading(false); return; }
    setLoading(true);
    const r = await allPayments().catch(() => []);
    setRows(r);
    const profs = await getProfiles([...new Set(r.map((x) => x.counterparty))]).catch(() => new Map());
    setNames(new Map([...profs].map(([k, v]) => [k, v.username ? `@${v.username}` : ""])));
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const totals = useMemo(() => {
    const t = { gross: 0, creators: 0, reads: 0, subs: 0, tips: 0 };
    for (const r of rows) { t.gross += r.gross; t.creators += r.amount; if (r.type === "read") t.reads++; else if (r.type === "subscription") t.subs++; else if (r.type === "tip") t.tips++; }
    return t;
  }, [rows]);
  const byCreator = useMemo(() => {
    const m = new Map<string, { addr: string; total: number; n: number }>();
    for (const r of rows) { const e = m.get(r.counterparty.toLowerCase()) || { addr: r.counterparty, total: 0, n: 0 }; e.total += r.amount; e.n++; m.set(r.counterparty.toLowerCase(), e); }
    return [...m.values()].sort((a, b) => b.total - a.total).slice(0, 15);
  }, [rows]);
  const label = (a: string) => names.get(a.toLowerCase()) || shortAddr(a);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "Outfit,sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-.02em" }}>Earnings</h1>
          <p style={{ fontSize: 12, color: "var(--text-4)", marginTop: 3 }}>Every payment settles on-chain in one transaction — creators are paid instantly, no payout step.</p>
        </div>
        <button onClick={load} disabled={loading} className="btn btn-secondary btn-sm"><RefreshCw size={12} className={loading ? "spin" : ""} /> Refresh</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>
        {[
          { l: "Gross volume", v: `$${totals.gross.toFixed(4)}`, c: "var(--accent)" },
          { l: "Paid to creators", v: `$${totals.creators.toFixed(4)}`, c: "var(--brand)" },
          { l: "Article unlocks", v: String(totals.reads), c: "#0284c7" },
          { l: "Subscriptions", v: String(totals.subs), c: "#7c3aed" },
          { l: "Tips", v: String(totals.tips), c: "#d97706" },
        ].map((k) => (
          <div key={k.l} className="card" style={{ padding: 14 }}>
            <div style={{ fontFamily: "Outfit,sans-serif", fontSize: 20, fontWeight: 900, color: k.c }}>{loading ? "…" : k.v}</div>
            <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, marginTop: 4 }}>{k.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 14 }}>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", fontWeight: 700, fontSize: 13, color: "var(--text)", borderBottom: "1px solid var(--border)" }}>Top creators</div>
          {byCreator.length === 0 ? <div style={{ padding: 28, textAlign: "center", fontSize: 13, color: "var(--text-4)" }}>{loading ? "Loading…" : "No payments yet."}</div> :
            byCreator.map((c) => (
              <div key={c.addr} style={{ display: "flex", alignItems: "center", padding: "9px 16px", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                <Link href={`/profile/${c.addr}`} style={{ flex: 1, color: "var(--text)", textDecoration: "none", fontWeight: 600 }}>{label(c.addr)}</Link>
                <span style={{ fontSize: 11, color: "var(--text-4)", marginRight: 10 }}>{c.n} payments</span>
                <span style={{ fontWeight: 800, color: "var(--accent)" }}>${c.total.toFixed(4)}</span>
              </div>
            ))}
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", fontWeight: 700, fontSize: 13, color: "var(--text)", borderBottom: "1px solid var(--border)" }}>Recent payments</div>
          {rows.slice(0, 25).map((r, i) => {
            const Icon = ICON[r.type];
            return (
              <div key={r.hash + i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", borderBottom: "1px solid var(--border)", fontSize: 12 }}>
                <Icon size={13} style={{ color: "var(--text-4)" }} />
                <span style={{ flex: 1, color: "var(--text-2)", textTransform: "capitalize" }}>{r.type} → {label(r.counterparty)}</span>
                <span style={{ fontWeight: 700, color: "var(--text)" }}>${r.gross.toFixed(4)}</span>
                <a href={txUrl(r.hash)} target="_blank" rel="noreferrer" style={{ color: "var(--brand)", display: "flex" }}><ExternalLink size={11} /></a>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
