"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "../components/ui/Navbar";
import { FACULTIES } from "../lib/categories";
import {
  ArrowRight, BookOpen, PenLine, Zap, Users, TrendingUp,
  Star, Clock, Shield, FlaskConical, Search, Flame, ChevronRight,
} from "lucide-react";
import { FacultyIcon } from "../components/ui/FacultyIcon";

interface Article {
  id: string; title: string; blurb: string; price: string; category: string;
  readTime: number; isResearch: boolean; authorShort: string; authorAddress: string;
  reads: number; status: string; featured: boolean; timestamp: number;
}
interface Cfg {
  hero_image?: string; hero_title?: string; hero_sub?: string; hero_cta?: string;
  site_banner?: string; brand_name?: string; brand_tagline?: string; brand_color?: string;
  hero_slide_1_title?: string; hero_slide_1_sub?: string; hero_slide_1_image?: string; hero_slide_1_color?: string; hero_slide_1_tag?: string;
  hero_slide_2_title?: string; hero_slide_2_sub?: string; hero_slide_2_image?: string; hero_slide_2_color?: string; hero_slide_2_tag?: string;
  hero_slide_3_title?: string; hero_slide_3_sub?: string; hero_slide_3_image?: string; hero_slide_3_color?: string; hero_slide_3_tag?: string;
}

function hue(addr: string) { return parseInt((addr || "000000").slice(2, 4) || "0", 16) * 1.4; }

function FeaturedCard({ a, big }: { a: Article; big?: boolean }) {
  const h = hue(a.authorAddress);
  return (
    <Link href={`/article/${a.id}`} style={{ textDecoration: "none", display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="card card-hover" style={{ padding: big ? "18px" : "14px", height: "100%", display: "flex", flexDirection: "column", gap: 8, boxSizing: "border-box" as const }}>
        {/* Badges row */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "var(--brand-muted)", color: "var(--brand)", border: "1px solid var(--brand-border)" }}>{a.category}</span>
          {a.isResearch && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "rgba(2,132,199,.1)", color: "#0284c7", border: "1px solid rgba(2,132,199,.25)" }}>Research</span>}
          {a.featured && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "rgba(202,138,4,.1)", color: "#ca8a04", border: "1px solid rgba(202,138,4,.3)", display: "flex", alignItems: "center", gap: 3 }}><Star size={7} />Featured</span>}
        </div>
        {/* Title */}
        <h3 style={{ fontFamily: "Outfit,sans-serif", fontSize: big ? 16 : 13, fontWeight: 800, color: "var(--text)", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: big ? 3 : 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden", flex: 1 }}>{a.title}</h3>
        {/* Excerpt — always shown */}
        {a.blurb && <p style={{ fontSize: big ? 12 : 11, color: "var(--text-3)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: big ? 3 : 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden", margin: 0 }}>{a.blurb}</p>}
        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid var(--border)", marginTop: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 16, height: 16, borderRadius: "50%", background: `hsl(${h}deg,40%,50%)`, flexShrink: 0 }} />
            <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 9, color: "var(--text-4)" }}>{a.authorShort}</span>
          </div>
          <span style={{ fontFamily: "Outfit,sans-serif", fontSize: 13, fontWeight: 800, color: "var(--accent)" }}>${parseFloat(a.price).toFixed(3)}</span>
        </div>
      </div>
    </Link>
  );
}

function ArticleRow({ a }: { a: Article }) {
  const h = hue(a.authorAddress);
  return (
    <Link href={`/article/${a.id}`} style={{ textDecoration: "none" }}>
      <div className="card card-hover" style={{ padding: "12px 16px" }}>
        {/* Badges + price on one line */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
          <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 7px", borderRadius: 99, background: "var(--brand-muted)", color: "var(--brand)", border: "1px solid var(--brand-border)" }}>{a.category}</span>
          {a.isResearch && <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 7px", borderRadius: 99, background: "rgba(2,132,199,.1)", color: "#0284c7", border: "1px solid rgba(2,132,199,.2)" }}>Research</span>}
          <span style={{ marginLeft: "auto", fontFamily: "Outfit,sans-serif", fontSize: 12, fontWeight: 800, color: "var(--accent)" }}>${parseFloat(a.price).toFixed(3)}</span>
        </div>
        {/* Title */}
        <h4 style={{ fontFamily: "Outfit,sans-serif", fontSize: 13, fontWeight: 700, color: "var(--text)", lineHeight: 1.3, marginBottom: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>{a.title}</h4>
        {/* Excerpt */}
        {a.blurb && <p style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.55, marginBottom: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>{a.blurb}</p>}
        {/* Meta */}
        <div style={{ fontSize: 10, color: "var(--text-4)", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 13, height: 13, borderRadius: "50%", background: `hsl(${h}deg,40%,50%)`, flexShrink: 0 }} />
          <span>{a.authorShort}</span>
          <Clock size={8} />
          <span>{a.readTime}m</span>
          <span>·</span>
          <span>{a.reads} reads</span>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [featured, setFeatured] = useState<Article[]>([]);
  const [trending, setTrending] = useState<Article[]>([]);
  const [research, setResearch] = useState<Article[]>([]);
  const [recent,   setRecent]   = useState<Article[]>([]);
  const [stats,    setStats]    = useState({ articles: 0, writers: 0, reads: 0 });
  const [cfg,      setCfg]      = useState<Cfg>({});
  const [search,   setSearch]   = useState("");
  const [activeTag, setActiveTag] = useState("All");
  const [cats,     setCats]     = useState<string[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [slide,    setSlide]    = useState(0);
  const slideTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/articles?status=featured&limit=6").then(r => r.json()).catch(() => []),
      fetch("/api/articles?limit=120").then(r => r.json()).catch(() => []),
      fetch("/api/articles?isResearch=true&limit=6").then(r => r.json()).catch(() => []),
      fetch("/api/admin/settings").then(r => r.json()).catch(() => ({})),
    ]).then(([feat, all, res, settings]) => {
      const feats = Array.isArray(feat) ? feat : [];
      const alls  = Array.isArray(all) ? all : [];
      const ress  = Array.isArray(res) ? res : [];
      setFeatured(feats.slice(0, 6));
      setTrending(alls.sort((a: Article, b: Article) => b.reads - a.reads).slice(0, 8));
      setResearch(ress.slice(0, 6));
      setRecent(alls.slice(0, 10));
      const cs = Array.from(new Set(alls.map((a: Article) => a.category).filter(Boolean))) as string[];
      setCats(cs);
      const writers = new Set(alls.map((a: Article) => a.authorAddress)).size;
      const reads   = alls.reduce((s: number, a: Article) => s + (a.reads || 0), 0);
      setStats({ articles: alls.length, writers, reads });
      setCfg(settings || {});
      setLoading(false);
    });
  }, []);

  // Hero auto-slide
  const slides = [1, 2, 3].map(n => ({
    title: (cfg as any)[`hero_slide_${n}_title`],
    sub:   (cfg as any)[`hero_slide_${n}_sub`],
    image: (cfg as any)[`hero_slide_${n}_image`],
    color: (cfg as any)[`hero_slide_${n}_color`] || "var(--brand)",
    tag:   (cfg as any)[`hero_slide_${n}_tag`],
  })).filter(s => s.title || s.image);

  const heroTitle = cfg.hero_title || cfg.brand_name ? `${cfg.brand_name || "Readlearc"}` : "Academic Publishing on Web3";
  const heroSub   = cfg.hero_sub   || cfg.brand_tagline || "Writers earn 85% in USDC. Readers own proof of every article they unlock.";
  const heroCta   = cfg.hero_cta   || "Explore Articles";
  const heroImg   = cfg.hero_image || "";
  const banner    = cfg.site_banner || "";

  useEffect(() => {
    if (slides.length < 2) return;
    slideTimer.current = setInterval(() => setSlide(s => (s + 1) % slides.length), 5000);
    return () => { if (slideTimer.current) clearInterval(slideTimer.current); };
  }, [slides.length]);

  const activeSlide = slides[slide];
  const TAGS = ["All", ...cats.slice(0, 8)];
  const feed = (activeTag === "All" ? trending : trending.filter(a => a.category === activeTag));

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />

      {/* ── Hero ── */}
      <div style={{ marginTop: "var(--header-h)", position: "relative", height: "clamp(300px,42vh,480px)", overflow: "hidden" }}>
        {/* Background */}
        {(activeSlide?.image || heroImg) ? (
          <img
            src={activeSlide?.image || heroImg} alt="hero"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "opacity .6s" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: `linear-gradient(145deg, #0a0618 0%, ${cfg.brand_color || "#1a0938"} 50%, #06111e 100%)` }}>
            {/* Grid lines decoration */}
            <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          </div>
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,.75) 0%, rgba(0,0,0,.4) 60%, rgba(0,0,0,.2) 100%)" }} />

        {/* Content */}
        <div className="container" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 clamp(16px,5vw,56px)" }}>
          <div style={{ maxWidth: 600 }}>
            {(activeSlide?.tag || cfg.brand_name) && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 99, background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.15)", backdropFilter: "blur(8px)", marginBottom: 14 }}>
                <Zap size={10} color="white" style={{ opacity: .8 }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.9)", letterSpacing: ".05em" }}>{activeSlide?.tag || cfg.brand_name || "Readlearc"}</span>
              </div>
            )}
            <h1 style={{ fontFamily: "Outfit,sans-serif", fontSize: "clamp(26px,5vw,52px)", fontWeight: 900, color: "white", lineHeight: 1.05, letterSpacing: "-.03em", marginBottom: 12 }}>
              {activeSlide?.title || heroTitle}
            </h1>
            <p style={{ fontSize: "clamp(12px,1.6vw,15px)", color: "rgba(255,255,255,.75)", lineHeight: 1.7, marginBottom: 22, maxWidth: 500 }}>
              {activeSlide?.sub || heroSub}
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/explore" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 22px", background: "var(--accent)", borderRadius: 99, fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: 13, color: "white", textDecoration: "none" }}>
                {heroCta} <ArrowRight size={13} />
              </Link>
              <Link href="/write" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 22px", background: "rgba(255,255,255,.1)", border: "1.5px solid rgba(255,255,255,.2)", borderRadius: 99, fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: 13, color: "white", textDecoration: "none", backdropFilter: "blur(8px)" }}>
                <PenLine size={12} />Start Writing
              </Link>
            </div>
          </div>
        </div>

        {/* Slide dots */}
        {slides.length > 1 && (
          <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
            {slides.map((_, i) => (
              <button key={i} onClick={() => { setSlide(i); }} style={{ width: i === slide ? 20 : 6, height: 6, borderRadius: 99, background: i === slide ? "white" : "rgba(255,255,255,.35)", border: "none", cursor: "pointer", padding: 0, transition: "all .3s" }} />
            ))}
          </div>
        )}
      </div>

      {/* ── Banner ── */}
      {banner && (
        <div style={{ width: "100%", maxHeight: 100, overflow: "hidden" }}>
          <img src={banner} alt="banner" style={{ width: "100%", objectFit: "cover", display: "block", maxHeight: 100 }} />
        </div>
      )}

      {/* ── Stats strip ── */}
      <div style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)", overflowX: "auto" }}>
        <div className="container" style={{ display: "flex", minWidth: "max-content", padding: "0 16px" }}>
          {[
            { icon: BookOpen, label: "Published", v: stats.articles + "+" },
            { icon: Users, label: "Writers", v: stats.writers + "+" },
            { icon: TrendingUp, label: "Total Reads", v: stats.reads + "+" },
            { icon: Zap, label: "Writer Share", v: "85% USDC" },
            { icon: Shield, label: "On-chain Proof", v: "Every Read" },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", borderRight: "1px solid var(--border)", flexShrink: 0 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: "var(--brand-muted)", border: "1px solid var(--brand-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <s.icon size={13} style={{ color: "var(--brand)" }} />
              </div>
              <div>
                <div style={{ fontFamily: "Outfit,sans-serif", fontSize: 16, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: 9, color: "var(--text-4)", marginTop: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container" style={{ padding: "36px 16px 70px" }}>

        {/* ── Featured ── */}
        {featured.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 3, height: 20, background: "#ca8a04", borderRadius: 2 }} />
                <Star size={15} style={{ color: "#ca8a04" }} />
                <h2 style={{ fontFamily: "Outfit,sans-serif", fontSize: 20, fontWeight: 900, color: "var(--text)", letterSpacing: "-.02em" }}>Featured</h2>
              </div>
              <Link href="/explore?filter=featured" style={{ fontSize: 11, color: "var(--brand)", textDecoration: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
                See all <ArrowRight size={11} />
              </Link>
            </div>
            {/* Magazine layout: 1 big + up to 4 small */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 }}>
              {featured.slice(0, 1).map(a => <FeaturedCard key={a.id} a={a} big />)}
              {featured.slice(1, 4).map(a => <FeaturedCard key={a.id} a={a} />)}
            </div>
          </section>
        )}

        {/* ── Trending ── */}
        <section style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 3, height: 20, background: "var(--accent)", borderRadius: 2 }} />
            <Flame size={15} style={{ color: "var(--accent)" }} />
            <h2 style={{ fontFamily: "Outfit,sans-serif", fontSize: 20, fontWeight: 900, color: "var(--text)", letterSpacing: "-.02em" }}>Trending</h2>
          </div>

          {/* Search inline */}
          <form
            onSubmit={e => { e.preventDefault(); if (search.trim()) window.location.href = `/explore?q=${encodeURIComponent(search)}`; }}
            style={{ position: "relative", marginBottom: 12 }}
          >
            <Search size={14} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", pointerEvents: "none" }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search articles, topics, disciplines…"
              style={{ width: "100%", padding: "10px 14px 10px 38px", background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: "var(--r-lg)", fontSize: 13, color: "var(--text)", outline: "none", boxSizing: "border-box" as const }}
            />
          </form>

          {/* Tag pills */}
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 14 }}>
            {TAGS.map(t => (
              <button key={t} onClick={() => setActiveTag(t)} style={{
                padding: "4px 12px", borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit,sans-serif", transition: "all .12s",
                border: `1.5px solid ${activeTag === t ? "var(--brand)" : "var(--border)"}`,
                background: activeTag === t ? "var(--brand-muted)" : "transparent",
                color: activeTag === t ? "var(--brand)" : "var(--text-3)",
              }}>{t}</button>
            ))}
          </div>

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 10 }}>
              {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 180, borderRadius: "var(--r-lg)" }} />)}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 10 }}>
              {feed.slice(0, 6).map(a => <FeaturedCard key={a.id} a={a} />)}
            </div>
          )}
          <div style={{ textAlign: "center", marginTop: 18 }}>
            <Link href="/explore" className="btn btn-secondary" style={{ gap: 6 }}>Browse all articles <ArrowRight size={12} /></Link>
          </div>
        </section>

        {/* ── Research ── */}
        {research.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 3, height: 20, background: "#0284c7", borderRadius: 2 }} />
                <FlaskConical size={15} style={{ color: "#0284c7" }} />
                <h2 style={{ fontFamily: "Outfit,sans-serif", fontSize: 20, fontWeight: 900, color: "var(--text)", letterSpacing: "-.02em" }}>Research Papers</h2>
              </div>
              <Link href="/explore?research=1" style={{ fontSize: 11, color: "var(--brand)", textDecoration: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
                View all <ArrowRight size={11} />
              </Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 10 }}>
              {research.map(a => (
                <Link key={a.id} href={`/article/${a.id}`} style={{ textDecoration: "none" }}>
                  <div className="card card-hover" style={{ padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 38, height: 38, borderRadius: "var(--r)", background: "rgba(2,132,199,.1)", border: "1px solid rgba(2,132,199,.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <FlaskConical size={17} style={{ color: "#0284c7" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "var(--brand)", marginBottom: 4, fontFamily: "Outfit,sans-serif" }}>{a.category}</div>
                      <h4 style={{ fontFamily: "Outfit,sans-serif", fontSize: 13, fontWeight: 700, color: "var(--text)", lineHeight: 1.3, marginBottom: 5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>{a.title}</h4>
                      <div style={{ display: "flex", gap: 8, fontSize: 10, color: "var(--text-4)" }}>
                        <span>{a.authorShort}</span>
                        <span style={{ color: "var(--accent)", fontWeight: 700 }}>${parseFloat(a.price).toFixed(3)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Browse by Discipline ── */}
        <section style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 3, height: 20, background: "var(--brand)", borderRadius: 2 }} />
              <BookOpen size={15} style={{ color: "var(--brand)" }} />
              <h2 style={{ fontFamily: "Outfit,sans-serif", fontSize: 20, fontWeight: 900, color: "var(--text)", letterSpacing: "-.02em" }}>Browse by Discipline</h2>
            </div>
            <Link href="/explore" style={{ fontSize: 11, color: "var(--brand)", textDecoration: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
              Explore all <ArrowRight size={11} />
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 8 }}>
            {FACULTIES.map(f => (
              <Link key={f.id} href={`/explore?faculty=${f.id}`} style={{ textDecoration: "none" }}>
                <div className="card card-hover" style={{ padding: "14px 12px", textAlign: "center", border: `1px solid var(--border)`, transition: "border-color .15s" }}>
                  <FacultyIcon name={f.icon} size={22} style={{ color: f.color, marginBottom: 7 }} />
                  <div style={{ fontFamily: "Outfit,sans-serif", fontSize: 11, fontWeight: 700, color: "var(--text)", lineHeight: 1.3 }}>{f.label}</div>
                  <div style={{ fontSize: 9, color: "var(--text-4)", marginTop: 3 }}>{f.courses.length} courses</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section style={{ marginBottom: 48, padding: "32px clamp(16px,4vw,40px)", background: "var(--bg-card)", borderRadius: "var(--r-xl)", border: "1px solid var(--border)" }}>
          <h2 style={{ fontFamily: "Outfit,sans-serif", fontSize: 20, fontWeight: 900, color: "var(--text)", textAlign: "center", letterSpacing: "-.02em", marginBottom: 4 }}>How It Works</h2>
          <p style={{ fontSize: 12, color: "var(--text-4)", textAlign: "center", marginBottom: 28 }}>Fair economics for academic publishing on the Arc blockchain</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 20 }}>
            {[
              { icon: PenLine, color: "var(--brand)", title: "Write & Submit", desc: "Use our rich editor or Research Studio. Submit your work for review." },
              { icon: Shield, color: "#d97706", title: "Quality Review", desc: "AI checks quality, originality, and plagiarism before going live." },
              { icon: BookOpen, color: "var(--accent)", title: "Readers Pay", desc: "Readers pay USDC per article — directly into your earnings." },
              { icon: Zap, color: "#0284c7", title: "You Earn 85%", desc: "85% of every USDC payment is paid out to you monthly." },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: `${s.color}18`, border: `1.5px solid ${s.color}30`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <s.icon size={22} style={{ color: s.color }} />
                </div>
                <h4 style={{ fontFamily: "Outfit,sans-serif", fontSize: 13, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>{s.title}</h4>
                <p style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Latest ── */}
        {recent.length > 0 && (
          <section>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 3, height: 20, background: "var(--text-4)", borderRadius: 2 }} />
                <Clock size={14} style={{ color: "var(--text-3)" }} />
                <h2 style={{ fontFamily: "Outfit,sans-serif", fontSize: 20, fontWeight: 900, color: "var(--text)", letterSpacing: "-.02em" }}>Latest</h2>
              </div>
              <Link href="/explore" style={{ fontSize: 11, color: "var(--brand)", textDecoration: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
                All <ArrowRight size={11} />
              </Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {recent.map(a => <ArticleRow key={a.id} a={a} />)}
            </div>
          </section>
        )}
      </div>

      {/* ── Footer ── */}
      <footer style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border)", padding: "36px 16px 24px" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 28, marginBottom: 32 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,var(--brand),var(--accent))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Zap size={14} color="white" />
                </div>
                <span style={{ fontFamily: "Outfit,sans-serif", fontWeight: 900, fontSize: 15, color: "var(--text)" }}>{cfg.brand_name || "Readlearc"}</span>
              </div>
              <p style={{ fontSize: 11, color: "var(--text-4)", lineHeight: 1.7 }}>{cfg.brand_tagline || "Pay per word. Own every read."}</p>
            </div>
            {[
              { label: "Platform", links: [{ l: "Explore", h: "/explore" }, { l: "Write Article", h: "/write" }, { l: "Research Studio", h: "/write/research" }, { l: "Creator Studio", h: "/creator" }] },
              { label: "Account",  links: [{ l: "My Wallet", h: "/wallet-app" }, { l: "Reading History", h: "/reading-history" }, { l: "My Profile", h: "/profile" }] },
              { label: "Network",  links: [{ l: "Arc Testnet", h: "https://testnet.arcscan.app" }, { l: "Circle USDC", h: "https://faucet.circle.com" }, { l: "OpenRouter AI", h: "https://openrouter.ai" }] },
            ].map(col => (
              <div key={col.label}>
                <div style={{ fontFamily: "Outfit,sans-serif", fontSize: 10, fontWeight: 800, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 }}>{col.label}</div>
                {col.links.map(l => (
                  <Link key={l.l} href={l.h} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-4)", textDecoration: "none", marginBottom: 7, transition: "color .12s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--brand)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--text-4)")}
                  >
                    <ChevronRight size={9} style={{ flexShrink: 0 }} />{l.l}
                  </Link>
                ))}
              </div>
            ))}
          </div>
          <div style={{ paddingTop: 16, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <p style={{ fontSize: 11, color: "var(--text-4)" }}>© {new Date().getFullYear()} {cfg.brand_name || "Readlearc"} · Built on Arc Testnet</p>
            <p style={{ fontSize: 11, color: "var(--text-4)", display: "flex", alignItems: "center", gap: 5 }}><Shield size={10} />All payments verified on-chain</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
