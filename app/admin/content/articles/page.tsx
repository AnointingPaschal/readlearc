"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Search, ExternalLink, Eye, EyeOff, RefreshCw } from "lucide-react";
import Link from "next/link";
import { CONTRACT_ADDRESS, CONTRACT_ABI, EXPLORER_URL, readProvider } from "../../../../lib/chain";

export default function ArticlesAdminPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [catFilter, setCatFilter] = useState("All");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        if (!CONTRACT_ADDRESS) return;
        const prov  = readProvider();
        const c     = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, prov);
        const count = Number(await c.articleCount());
        const arts: any[] = [];
        for (let i = count; i >= Math.max(1, count - 49); i--) {
          try {
            const m = await c.getArticleMetadata(i);
            arts.push({
              id: m.id.toString(), title: m.title, category: m.category,
              price: ethers.formatUnits(m.price, 6), reads: Number(m.reads),
              author: m.author, timestamp: Number(m.timestamp),
            });
          } catch {}
        }
        setArticles(arts);
      } catch {}
      finally { setLoading(false); }
    }
    load();
  }, []);

  const categories = ["All", ...Array.from(new Set(articles.map(a => a.category)))];

  const filtered = articles.filter(a => {
    const ms = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.author.toLowerCase().includes(search.toLowerCase());
    const mc = catFilter === "All" || a.category === catFilter;
    return ms && mc;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>All Articles</h1>
          <p style={{ color: "var(--text-4)", fontSize: 12, marginTop: 3 }}>{articles.length} articles from blockchain</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", pointerEvents: "none" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title or address…" className="admin-input" style={{ paddingLeft: 34, fontSize: 13 }} />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setCatFilter(cat)} style={{ padding: "7px 14px", borderRadius: "var(--radius-full)", border: `1.5px solid ${catFilter === cat ? "var(--brand)" : "var(--border)"}`, background: catFilter === cat ? "var(--brand-muted)" : "transparent", color: catFilter === cat ? "var(--brand)" : "var(--text-3)", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .15s" }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden", padding: 0 }}>
        {loading ? (
          <div style={{ padding: 20 }}>{[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8, marginBottom: 10 }} />)}</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead><tr>
                <th style={{ textAlign: "left" }}>Article</th>
                <th style={{ textAlign: "right" }}>Reads</th>
                <th style={{ textAlign: "right" }}>Price</th>
                <th style={{ textAlign: "right" }}>Author</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td style={{ maxWidth: 300 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 260 }}>{a.title}</div>
                          <span className="badge badge-neutral" style={{ fontSize: 9, marginTop: 3 }}>{a.category}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>{a.reads.toLocaleString()}</td>
                    <td style={{ textAlign: "right", fontWeight: 600, color: "#059669" }}>${a.price}</td>
                    <td style={{ textAlign: "right" }}>
                      <Link href={`/profile/${a.author}`} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "var(--brand)", textDecoration: "none" }}>
                        {a.author.slice(0,8)}…
                      </Link>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                        <Link href={`/article/${a.id}`} style={{ color: "var(--text-4)", display: "flex" }} title="View article"><Eye size={13} /></Link>
                        <a href={`${EXPLORER_URL}/tx/${a.id}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-4)", display: "flex" }} title="On-chain"><ExternalLink size={13} /></a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-4)", fontSize: 13 }}>
                {articles.length === 0 ? "No articles on-chain yet." : "No articles match your filter."}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
