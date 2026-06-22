"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Navbar from "../../components/ui/Navbar";
import { FACULTIES } from "../../lib/categories";
import {
  Search, Star, Clock, TrendingUp, FlaskConical, BookOpen,
  Grid3X3, List, ArrowRight, ChevronDown, ChevronRight, X,
  Flame, SlidersHorizontal, FileText,
} from "lucide-react";
import { FacultyIcon } from "../../components/ui/FacultyIcon";

interface A {
  id: string; title: string; blurb: string; price: string; category: string;
  readTime: number; isResearch: boolean; authorShort: string; authorAddress: string;
  reads: number; status: string; featured: boolean; timestamp: number;
}

const SORTS = [
  { key: "reads", label: "Most Read" },
  { key: "new",   label: "Newest" },
  { key: "price_asc", label: "Lowest Price" },
  { key: "price_desc", label: "Highest Price" },
];

function hue(addr: string) { return parseInt((addr || "000000").slice(2, 4) || "0", 16) * 1.4; }

function GridCard({ a }: { a: A }) {
  const h = hue(a.authorAddress);
  return (
    <Link href={`/article/${a.id}`} style={{ textDecoration: "none", display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="card card-hover" style={{ padding: 0, overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ height: 70, background: "var(--bg-alt)", borderBottom: "1px solid var(--border)", flexShrink: 0, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FileText size={20} style={{ color: "var(--border)", opacity: .5 }} />
          {a.isResearch && <span style={{ position: "absolute", top: 6, left: 6, fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "rgba(2,132,199,.1)", color: "#0284c7", border: "1px solid rgba(2,132,199,.25)" }}>Research</span>}
          {a.featured && <span style={{ position: "absolute", top: 6, right: 6, fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "rgba(202,138,4,.1)", color: "#ca8a04", border: "1px solid rgba(202,138,4,.25)", display: "flex", alignItems: "center", gap: 3 }}><Star size={7} />Featured</span>}
        </div>
        <div style={{ padding: "12px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "var(--brand-muted)", color: "var(--brand)", border: "1px solid var(--brand-border)" }}>{a.category}</span>
            <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "rgba(5,150,105,.08)", color: "var(--accent)", border: "1px solid rgba(5,150,105,.2)" }}>${parseFloat(a.price).toFixed(3)}</span>
          </div>
          <h3 style={{ fontFamily: "Outfit,sans-serif", fontSize: 13, fontWeight: 800, color: "var(--text)", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as any, overflow: "hidden", flex: 1 }}>{a.title}</h3>
          {a.blurb && <p style={{ fontSize: 10, color: "var(--text-4)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>{a.blurb}</p>}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid var(--border)", marginTop: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: `hsl(${h}deg,40%,50%)` }} />
              <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 9, color: "var(--text-4)" }}>{a.authorShort}</span>
            </div>
            <span style={{ fontSize: 9, color: "var(--text-4)", display: "flex", alignItems: "center", gap: 3 }}><TrendingUp size={8} />{a.reads}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ListCard({ a }: { a: A }) {
  const h = hue(a.authorAddress);
  return (
    <Link href={`/article/${a.id}`} style={{ textDecoration: "none" }}>
      <div className="card card-hover" style={{ padding: "12px 14px", display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ width: 48, height: 48, borderRadius: "var(--r)", background: "var(--bg-alt)", border: "1px solid var(--border)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FileText size={18} style={{ color: "var(--border)" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 5, marginBottom: 5, flexWrap: "wrap" }}>
            <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "var(--brand-muted)", color: "var(--brand)", border: "1px solid var(--brand-border)" }}>{a.category}</span>
            {a.isResearch && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "rgba(2,132,199,.1)", color: "#0284c7", border: "1px solid rgba(2,132,199,.2)" }}>Research</span>}
            {a.featured && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "rgba(202,138,4,.1)", color: "#ca8a04", border: "1px solid rgba(202,138,4,.2)", display: "flex", alignItems: "center", gap: 3 }}><Star size={7} />Featured</span>}
          </div>
          <h3 style={{ fontFamily: "Outfit,sans-serif", fontSize: 14, fontWeight: 700, color: "var(--text)", lineHeight: 1.3, marginBottom: 4 }}>{a.title}</h3>
          {a.blurb && <p style={{ fontSize: 11, color: "var(--text-4)", lineHeight: 1.5, marginBottom: 5, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>{a.blurb}</p>}
          <div style={{ display: "flex", gap: 10, fontSize: 10, color: "var(--text-4)", flexWrap: "wrap" }}>
            <span style={{ fontFamily: "JetBrains Mono,monospace" }}>{a.authorShort}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Clock size={9} /> {a.readTime}m</span>
            <span>{a.reads} reads</span>
          </div>
        </div>
        <div style={{ fontFamily: "Outfit,sans-serif", fontSize: 15, fontWeight: 900, color: "var(--accent)", flexShrink: 0 }}>${parseFloat(a.price).toFixed(3)}</div>
      </div>
    </Link>
  );
}

export default function ExplorePage() {
  const [arts,        setArts]        = useState<A[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [cat,         setCat]         = useState("All");
  const [sort,        setSort]        = useState("reads");
  const [view,        setView]        = useState<"grid" | "list">("grid");
  const [onlyResearch,setOnlyResearch]= useState(false);
  const [facultyId,   setFacultyId]   = useState("");
  const [expandedFac, setExpandedFac] = useState<string | null>(null);
  const [page,        setPage]        = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const PER_PAGE = 18;

  useEffect(() => {
    setLoading(true);
    fetch("/api/articles?status=approved&limit=200")
      .then(r => r.json()).then(d => {
        setArts(Array.isArray(d) ? d : []);
        setLoading(false);
      });
  }, []);

  // Read URL params
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("q")) setSearch(p.get("q") || "");
    if (p.get("research") === "1") setOnlyResearch(true);
    if (p.get("faculty")) { setFacultyId(p.get("faculty") || ""); setExpandedFac(p.get("faculty") || ""); }
  }, []);

  const facultyCourseLabels = useMemo(() => {
    if (!facultyId) return [];
    return FACULTIES.find(f => f.id === facultyId)?.courses.map(c => c.label) || [];
  }, [facultyId]);

  const filtered = useMemo(() => arts.filter(a => {
    if (onlyResearch && !a.isResearch) return false;
    if (facultyId && facultyCourseLabels.length && !facultyCourseLabels.includes(a.category)) return false;
    if (cat !== "All" && a.category !== cat) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        (a.blurb || "").toLowerCase().includes(q) ||
        (a.category || "").toLowerCase().includes(q) ||
        (a.authorShort || "").toLowerCase().includes(q)
      );
    }
    return true;
  }).sort((a, b) => {
    if (sort === "reads")      return b.reads - a.reads;
    if (sort === "new")        return b.timestamp - a.timestamp;
    if (sort === "price_asc")  return parseFloat(a.price) - parseFloat(b.price);
    if (sort === "price_desc") return parseFloat(b.price) - parseFloat(a.price);
    return 0;
  }), [arts, onlyResearch, facultyId, facultyCourseLabels, cat, search, sort]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // All categories that exist in current articles
  const existingCats = useMemo(() => {
    return Array.from(new Set(arts.map(a => a.category).filter(Boolean))) as string[];
  }, [arts]);

  // Cats in selected faculty
  const facultyCats = facultyId ? facultyCourseLabels.filter(c => existingCats.includes(c)) : [];

  function clearFilters() {
    setSearch(""); setCat("All"); setFacultyId(""); setOnlyResearch(false); setPage(1);
  }

  const hasFilters = search || cat !== "All" || facultyId || onlyResearch;
  const totalArticles = arts.length;
  const researchCount = arts.filter(a => a.isResearch).length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />

      {/* ── Page header ── */}
      <div style={{ marginTop: "var(--header-h)", background: "var(--bg-card)", borderBottom: "1px solid var(--border)", padding: "20px 16px 0" }}>
        <div className="container">
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16, gap: 10, flexWrap: "wrap" }}>
            <div>
              <h1 style={{ fontFamily: "Outfit,sans-serif", fontSize: "clamp(22px,4vw,32px)", fontWeight: 900, color: "var(--text)", letterSpacing: "-.03em", marginBottom: 4 }}>Explore</h1>
              <p style={{ fontSize: 12, color: "var(--text-4)" }}>
                {totalArticles} articles · {researchCount} research papers · {FACULTIES.length} disciplines
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {/* Sort */}
              <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}
                style={{ padding: "7px 10px", background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", fontSize: 12, color: "var(--text)", outline: "none", cursor: "pointer" }}>
                {SORTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              {/* View toggle */}
              <div style={{ display: "flex", border: "1.5px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
                {(["grid", "list"] as const).map(v => (
                  <button key={v} onClick={() => setView(v)} style={{ width: 34, height: 34, border: "none", cursor: "pointer", background: view === v ? "var(--brand-muted)" : "var(--bg-alt)", color: view === v ? "var(--brand)" : "var(--text-4)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>
                    {v === "grid" ? <Grid3X3 size={13} /> : <List size={13} />}
                  </button>
                ))}
              </div>
              {/* Mobile sidebar toggle */}
              <button onClick={() => setSidebarOpen(o => !o)} className="btn btn-secondary btn-sm sidebar-toggle" style={{ gap: 5 }}>
                <SlidersHorizontal size={13} />Filters
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div style={{ position: "relative", paddingBottom: 16 }}>
            <Search size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", pointerEvents: "none", marginTop: -8 }} />
            <input
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search titles, topics, authors, disciplines…"
              style={{ width: "100%", padding: "11px 14px 11px 42px", background: "var(--bg)", border: "1.5px solid var(--border)", borderRadius: "var(--r-lg)", fontSize: 13, color: "var(--text)", outline: "none", boxSizing: "border-box" as const }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", marginTop: -8, background: "none", border: "none", cursor: "pointer", color: "var(--text-4)", padding: 4, display: "flex" }}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Body: sidebar + grid ── */}
      <div className="container" style={{ padding: "20px 16px 60px" }}>
        <div className="explore-layout">

          {/* ── LEFT sidebar ── */}
          <aside className={`explore-sidebar${sidebarOpen ? " sidebar-open" : ""}`}>

            {/* Research toggle */}
            <div className="card" style={{ padding: "12px 14px", marginBottom: 8 }}>
              <button onClick={() => { setOnlyResearch(v => !v); setPage(1); }} style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0,
              }}>
                <div style={{ width: 36, height: 20, borderRadius: 99, background: onlyResearch ? "var(--brand)" : "var(--bg-alt)", border: "1.5px solid var(--border)", position: "relative", transition: "background .2s", flexShrink: 0 }}>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", background: "white", position: "absolute", top: 2, left: onlyResearch ? 18 : 2, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.3)" }} />
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", fontFamily: "Outfit,sans-serif" }}>Research Only</div>
                  <div style={{ fontSize: 10, color: "var(--text-4)" }}>{researchCount} papers</div>
                </div>
              </button>
            </div>

            {/* Faculty tree */}
            <div className="card" style={{ padding: "12px 14px", marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 10, fontFamily: "Outfit,sans-serif" }}>Disciplines</div>

              {/* All option */}
              <button onClick={() => { setFacultyId(""); setCat("All"); setPage(1); }} style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%", background: !facultyId && cat === "All" ? "var(--brand-muted)" : "none",
                border: "none", borderRadius: "var(--r)", cursor: "pointer", padding: "6px 8px", marginBottom: 2,
              }}>
                <BookOpen size={13} style={{ color: !facultyId && cat === "All" ? "var(--brand)" : "var(--text-4)", flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: !facultyId && cat === "All" ? "var(--brand)" : "var(--text-3)", fontFamily: "Outfit,sans-serif" }}>All Disciplines</span>
              </button>

              {FACULTIES.map(f => {
                const isOpen = expandedFac === f.id;
                const isActive = facultyId === f.id;
                const coursesWithContent = f.courses.filter(c => existingCats.includes(c.label));
                return (
                  <div key={f.id} style={{ marginBottom: 2 }}>
                    <button
                      onClick={() => {
                        setExpandedFac(isOpen ? null : f.id);
                        setFacultyId(isActive ? "" : f.id);
                        setCat("All"); setPage(1);
                      }}
                      style={{
                        display: "flex", alignItems: "center", gap: 7, width: "100%", border: "none", borderRadius: "var(--r)", cursor: "pointer", padding: "6px 8px",
                        background: isActive ? "var(--brand-muted)" : "none",
                        transition: "background .12s",
                      }}
                    >
                      <FacultyIcon name={f.icon} size={13} style={{ color: isActive ? "var(--brand)" : "var(--text-4)", flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: isActive ? "var(--brand)" : "var(--text-3)", textAlign: "left", lineHeight: 1.3 }}>{f.label}</span>
                      {coursesWithContent.length > 0 && <span style={{ fontSize: 9, color: "var(--text-4)", flexShrink: 0 }}>{coursesWithContent.length}</span>}
                      <ChevronDown size={11} style={{ color: "var(--text-4)", transition: "transform .2s", transform: isOpen ? "rotate(180deg)" : "rotate(0)", flexShrink: 0 }} />
                    </button>

                    {/* Sub-courses */}
                    {isOpen && coursesWithContent.length > 0 && (
                      <div style={{ paddingLeft: 28, paddingBottom: 4 }}>
                        {coursesWithContent.map(c => (
                          <button key={c.id} onClick={() => { setCat(c.label); setFacultyId(f.id); setPage(1); }}
                            style={{
                              display: "flex", alignItems: "center", gap: 5, width: "100%", border: "none", borderRadius: "var(--r)", cursor: "pointer", padding: "5px 8px",
                              background: cat === c.label ? "var(--brand-muted)" : "none",
                            }}>
                            <ChevronRight size={9} style={{ color: "var(--text-4)", flexShrink: 0 }} />
                            <span style={{ fontSize: 11, fontWeight: cat === c.label ? 700 : 500, color: cat === c.label ? "var(--brand)" : "var(--text-3)", textAlign: "left" }}>{c.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Active filters */}
            {hasFilters && (
              <button onClick={clearFilters} style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", padding: "8px 12px", background: "rgba(220,38,38,.06)", border: "1px solid rgba(220,38,38,.2)", borderRadius: "var(--r)", cursor: "pointer", color: "#dc2626", fontSize: 11, fontWeight: 700 }}>
                <X size={12} />Clear all filters
              </button>
            )}
          </aside>

          {/* ── RIGHT: Results ── */}
          <div className="explore-main">

            {/* Result count + active filter summary */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 6 }}>
              <p style={{ fontSize: 12, color: "var(--text-4)" }}>
                {loading ? "Loading…" : `${filtered.length} article${filtered.length !== 1 ? "s" : ""}`}
                {search && ` matching "${search}"`}
                {cat !== "All" && ` · ${cat}`}
              </p>
              {hasFilters && (
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {search && <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", background: "var(--brand-muted)", color: "var(--brand)", borderRadius: 99, border: "1px solid var(--brand-border)", display: "flex", alignItems: "center", gap: 4 }}>"{search}" <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--brand)", padding: 0, display: "flex" }}><X size={9} /></button></span>}
                  {cat !== "All" && <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", background: "var(--brand-muted)", color: "var(--brand)", borderRadius: 99, border: "1px solid var(--brand-border)", display: "flex", alignItems: "center", gap: 4 }}>{cat} <button onClick={() => setCat("All")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--brand)", padding: 0, display: "flex" }}><X size={9} /></button></span>}
                  {onlyResearch && <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", background: "rgba(2,132,199,.1)", color: "#0284c7", borderRadius: 99, border: "1px solid rgba(2,132,199,.2)", display: "flex", alignItems: "center", gap: 4 }}>Research <button onClick={() => setOnlyResearch(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#0284c7", padding: 0, display: "flex" }}><X size={9} /></button></span>}
                </div>
              )}
            </div>

            {/* Grid / List */}
            {loading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 }}>
                {[...Array(12)].map((_, i) => <div key={i} className="skeleton" style={{ height: 200, borderRadius: "var(--r-lg)" }} />)}
              </div>
            ) : !paged.length ? (
              <div style={{ textAlign: "center", padding: "64px 16px", background: "var(--bg-card)", borderRadius: "var(--r-xl)", border: "1.5px dashed var(--border)" }}>
                <BookOpen size={40} style={{ color: "var(--text-4)", marginBottom: 14 }} />
                <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", fontFamily: "Outfit,sans-serif", marginBottom: 6 }}>No articles found</p>
                <p style={{ fontSize: 13, color: "var(--text-4)", marginBottom: 20 }}>Try adjusting your filters or search term.</p>
                <button onClick={clearFilters} className="btn btn-secondary btn-sm">Clear filters</button>
              </div>
            ) : view === "grid" ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 }}>
                {paged.map(a => <GridCard key={a.id} a={a} />)}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {paged.map(a => <ListCard key={a.id} a={a} />)}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 28, flexWrap: "wrap" }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-secondary btn-sm" style={{ opacity: page === 1 ? .4 : 1 }}>← Prev</button>
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  const n = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
                  return (
                    <button key={n} onClick={() => setPage(n)} style={{ width: 34, height: 34, borderRadius: "var(--r)", border: `1.5px solid ${n === page ? "var(--brand)" : "var(--border)"}`, background: n === page ? "var(--brand-muted)" : "transparent", cursor: "pointer", fontSize: 12, fontWeight: 700, color: n === page ? "var(--brand)" : "var(--text-3)" }}>{n}</button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-secondary btn-sm" style={{ opacity: page === totalPages ? .4 : 1 }}>Next →</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .explore-layout {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 16px;
          align-items: start;
        }
        .explore-sidebar { min-width: 0; }
        .explore-main { min-width: 0; }
        .sidebar-toggle { display: none !important; }
        @media (max-width: 820px) {
          .explore-layout { grid-template-columns: 1fr; }
          .explore-sidebar {
            display: none;
            position: fixed; inset: 0; z-index: 200;
            background: rgba(0,0,0,.5);
            padding: 0;
          }
          .explore-sidebar.sidebar-open {
            display: block !important;
          }
          .explore-sidebar.sidebar-open > * {
            position: absolute; top: 0; left: 0; bottom: 0; width: 280px;
            background: var(--bg); overflow-y: auto; padding: 16px;
            box-shadow: 4px 0 24px rgba(0,0,0,.2);
          }
          .sidebar-toggle { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
