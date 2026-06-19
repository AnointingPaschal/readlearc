"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Search, ExternalLink, BookOpen } from "lucide-react";
import { READLEARC_ADDRESS, READLEARC_ABI, ARC_EXPLORER, getReadProvider } from "../../../../lib/web3";

export default function ReadersAdminPage() {
  const [readers, setReaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        if (!READLEARC_ADDRESS) return;
        const prov = getReadProvider();
        const c    = new ethers.Contract(READLEARC_ADDRESS, READLEARC_ABI, prov);
        const evs  = await c.queryFilter(c.filters.ArticleRead(), -100000);
        const map  = new Map<string, any>();
        for (const ev of evs) {
          const e = ev as any;
          if (!map.has(e.args.reader)) map.set(e.args.reader, { address: e.args.reader, reads: 0, spent: 0 });
          const r = map.get(e.args.reader);
          r.reads++;
          r.spent += parseFloat(ethers.formatUnits(e.args.price, 6));
        }
        setReaders([...map.values()].sort((a, b) => b.reads - a.reads));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const filtered = readers.filter(r => !search || r.address.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>Readers</h1>
        <p style={{ color: "var(--text-4)", fontSize: 12, marginTop: 3 }}>{readers.length} unique reader wallets on-chain</p>
      </div>
      <div style={{ position: "relative", maxWidth: 400 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", pointerEvents: "none" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search address…" className="admin-input" style={{ paddingLeft: 36, fontSize: 13 }} />
      </div>
      <div className="card" style={{ overflow: "hidden", padding: 0 }}>
        {loading ? (
          <div style={{ padding: 24 }}>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8, marginBottom: 10 }} />)}</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-4)", fontSize: 14 }}>No reader activity found yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead><tr>
                <th style={{ textAlign: "left" }}>Wallet</th>
                <th style={{ textAlign: "right" }}>Articles Read</th>
                <th style={{ textAlign: "right" }}>USDC Spent</th>
                <th style={{ textAlign: "right" }}>On-Chain</th>
              </tr></thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.address}>
                    <td><span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "var(--text)" }}>{r.address.slice(0,10)}…{r.address.slice(-6)}</span></td>
                    <td style={{ textAlign: "right" }}><span style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}><BookOpen size={11} style={{ color: "var(--brand)" }} />{r.reads}</span></td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: "#059669" }}>${r.spent.toFixed(4)}</td>
                    <td style={{ textAlign: "right" }}>
                      <a href={`${ARC_EXPLORER}/address/${r.address}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--brand)", display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11 }}>View <ExternalLink size={10} /></a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
