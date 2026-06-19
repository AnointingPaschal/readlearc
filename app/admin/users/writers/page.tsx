"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Search, UserCheck, UserX, ExternalLink, RefreshCw, CheckCircle2 } from "lucide-react";
import { READLEARC_ADDRESS, READLEARC_ABI, ARC_EXPLORER, getReadProvider, fetchArticlesByAuthor } from "../../../../lib/web3";
import { useWallet } from "../../../../lib/web3Context";

export default function WritersAdminPage() {
  const { signer, isConnected } = useWallet();
  const [writers, setWriters]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search,  setSearch]    = useState("");
  const [acting,  setActing]    = useState<string>("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        if (!READLEARC_ADDRESS) return;
        const prov = getReadProvider();
        const c    = new ethers.Contract(READLEARC_ADDRESS, READLEARC_ABI, prov);
        const filter = c.filters.ArticlePublished();
        const events = await c.queryFilter(filter, -100000);
        const authorsMap = new Map<string, any>();
        for (const ev of events) {
          const e = ev as any;
          if (!authorsMap.has(e.args.author)) {
            authorsMap.set(e.args.author, { address: e.args.author, articleCount: 0, verified: false });
          }
          authorsMap.get(e.args.author).articleCount++;
        }
        const list = [...authorsMap.values()];
        for (const w of list) {
          try { w.verified = await c.verifiedWriters(w.address); } catch {}
        }
        list.sort((a, b) => b.articleCount - a.articleCount);
        setWriters(list);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  async function toggleVerify(address: string, current: boolean) {
    if (!signer || !READLEARC_ADDRESS) return;
    setActing(address);
    try {
      const c  = new ethers.Contract(READLEARC_ADDRESS, READLEARC_ABI, signer);
      const tx = await c.setVerifiedWriter(address, !current);
      await tx.wait();
      setWriters(ws => ws.map(w => w.address === address ? { ...w, verified: !current } : w));
    } catch (err: any) { alert(err.reason || err.message); }
    finally { setActing(""); }
  }

  const filtered = writers.filter(w =>
    !search || w.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>Writers</h1>
          <p style={{ color: "var(--text-4)", fontSize: 12, marginTop: 3 }}>{writers.length} unique authors detected on-chain</p>
        </div>
        {!isConnected && (
          <div style={{ padding: "8px 14px", background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "var(--radius)", fontSize: 12, color: "#dc2626" }}>
            Connect owner wallet to verify/suspend writers
          </div>
        )}
      </div>

      <div style={{ position: "relative", maxWidth: 400 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", pointerEvents: "none" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by address…" className="admin-input" style={{ paddingLeft: 36, fontSize: 13 }} />
      </div>

      <div className="card" style={{ overflow: "hidden", padding: 0 }}>
        {loading ? (
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 10 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--text-4)", fontSize: 14 }}>
            {READLEARC_ADDRESS ? "No writers found yet — publish articles to see them here." : "Contract not deployed."}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Address</th>
                  <th style={{ textAlign: "right" }}>Articles</th>
                  <th style={{ textAlign: "right" }}>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(w => (
                  <tr key={w.address}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, var(--brand), var(--accent))", flexShrink: 0 }} />
                        <div>
                          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "var(--text)", fontWeight: 600 }}>
                            {w.address.slice(0,10)}…{w.address.slice(-6)}
                          </div>
                          {w.verified && <div style={{ fontSize: 10, color: "#059669", display: "flex", alignItems: "center", gap: 3 }}><CheckCircle2 size={9} /> Verified Writer</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{w.articleCount}</td>
                    <td style={{ textAlign: "right" }}>
                      <span className={w.verified ? "pill-verified" : "pill-draft"} style={{ fontSize: 11, padding: "3px 9px", display: "inline-block" }}>
                        {w.verified ? "VERIFIED" : "DEFAULT"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                        <a href={`${ARC_EXPLORER}/address/${w.address}`} target="_blank" rel="noopener noreferrer" title="View on-chain" style={{ color: "var(--text-4)", display: "flex" }}>
                          <ExternalLink size={13} />
                        </a>
                        <button
                          onClick={() => toggleVerify(w.address, w.verified)}
                          disabled={!isConnected || acting === w.address}
                          title={w.verified ? "Remove verification" : "Verify writer"}
                          style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-alt)", cursor: "pointer", fontSize: 11, fontWeight: 600, color: w.verified ? "#dc2626" : "#059669", transition: "all 0.15s" }}
                        >
                          {acting === w.address ? <RefreshCw size={11} style={{ animation: "rl-spin 1s linear infinite" }} /> : w.verified ? <UserX size={11} /> : <UserCheck size={11} />}
                          {w.verified ? "Unverify" : "Verify"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style>{`@keyframes rl-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
