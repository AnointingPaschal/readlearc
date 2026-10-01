import { apiFetch } from "@/lib/api";
import { useState, useEffect } from "react";
import { Link } from "@/lib/nav";
import Navbar from "@/components/ui/Navbar";
import { useAuth } from "@/lib/auth";
import PostBody from "@/components/ui/PostBody";
import { Users, Lock, Globe, Plus, Search, BookOpen, Flame, Tag, ImagePlus } from "lucide-react";

interface Group {
  id: string; name: string; description: string; type: "public" | "private";
  category: string; owner_address: string; banner_image?: string;
  member_count: number; post_count: number; tags: string[];
  member_addresses: string[]; created_at: string;
}

const CATEGORIES = ["All","Science","Technology","Medicine","Business","Humanities","Law","Education","Arts","Engineering","Environment","Research"];

function GroupCard({ g, isMember }: { g: Group; isMember: boolean }) {
  const hue = parseInt((String(g.id || "6d")).slice(0,2) || "6d", 16) * 2.5;
  return (
    <Link href={`/contribute/${String(g.id)}`} style={{ textDecoration: "none" }}>
      <div className="card card-hover" style={{ overflow: "hidden", height: "100%" }}>
        {/* Banner */}
        <div style={{ height: 64, background: g.banner_image ? undefined : `linear-gradient(135deg,hsl(${hue}deg,45%,30%),hsl(${hue+60}deg,40%,20%))`, position: "relative", flexShrink: 0 }}>
          {g.banner_image && <img src={g.banner_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 5 }}>
            <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 99, backdropFilter: "blur(8px)", display: "flex", alignItems: "center", gap: 3, background: g.type === "private" ? "rgba(220,38,38,.8)" : "rgba(5,150,105,.8)", color: "white" }}>
              {g.type === "private" ? <Lock size={8} /> : <Globe size={8} />}
              {g.type === "private" ? "Private" : "Public"}
            </span>
            {isMember && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: "rgba(109,40,217,.85)", color: "white", backdropFilter: "blur(8px)" }}>Joined</span>}
          </div>
        </div>
        <div style={{ padding: "12px 14px" }}>
          <div style={{ display: "flex", gap: 5, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: "var(--brand-muted)", color: "var(--brand)", border: "1px solid var(--brand-border)" }}>{g.category}</span>
          </div>
          <h3 style={{ fontFamily: "Outfit,sans-serif", fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 5, lineHeight: 1.25 }}>{g.name}</h3>
          <p style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.55, marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>{g.description || "No description."}</p>
          <div style={{ display: "flex", gap: 10, fontSize: 10, color: "var(--text-4)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Users size={9} />{g.member_count} members</span>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}><BookOpen size={9} />{g.post_count} posts</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ContributePage() {
  const { address } = useAuth();
  const [groups,  setGroups]  = useState<Group[]>([]);
  const [mine,    setMine]    = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [cat,     setCat]     = useState("All");
  const [tab,     setTab]     = useState<"feed" | "discover" | "mine">("feed");
  const [loadErr, setLoadErr] = useState(false);
  const [feed,    setFeed]    = useState<any[] | null>(null);

  useEffect(() => {
    apiFetch("/api/groups/0/posts").then(r => r.json()).then(d => setFeed(Array.isArray(d) ? d : [])).catch(() => setFeed([]));
  }, []);

  useEffect(() => {
    setLoading(true); setLoadErr(false);
    apiFetch("/api/groups?type=public&limit=60")
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) { setGroups(d); }
        else { setLoadErr(true); }
        setLoading(false);
      }).catch(() => { setLoadErr(true); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!address) return;
    apiFetch(`/api/groups?member=${address.toLowerCase()}`).then(r => r.json()).then(d => {
      setMine(Array.isArray(d) ? d : []);
    }).catch(() => {});
  }, [address]);

  const list = (tab === "mine" ? mine : groups).filter(g => {
    if (search && !g.name.toLowerCase().includes(search.toLowerCase()) && !g.description?.toLowerCase().includes(search.toLowerCase())) return false;
    if (cat !== "All" && g.category !== cat) return false;
    return true;
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "calc(var(--header-h) + 20px) 14px calc(var(--bottom-nav-h, 0px) + 40px)" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h1 style={{ fontFamily: "Outfit,sans-serif", fontSize: "clamp(22px,4vw,30px)", fontWeight: 900, color: "var(--text)", letterSpacing: "-.02em", marginBottom: 3 }}>Contribute</h1>
            <p style={{ fontSize: 12, color: "var(--text-4)" }}>Join public groups or create private groups for your team</p>
          </div>
          <Link href="/contribute/create" className="btn btn-primary" style={{ gap: 6 }}>
            <Plus size={14} />Create Group
          </Link>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "2px solid var(--border)" }}>
          {(["feed","discover","mine"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "9px 18px", border: "none", cursor: "pointer", fontFamily: "Outfit,sans-serif",
              fontSize: 13, fontWeight: 700, background: "transparent",
              color: tab === t ? "var(--brand)" : "var(--text-4)",
              borderBottom: `2px solid ${tab === t ? "var(--brand)" : "transparent"}`,
              marginBottom: -2, transition: "all .15s", textTransform: "capitalize",
            }}>
              {t === "mine" ? `My Spaces ${mine.length > 0 ? `(${mine.length})` : ""}` : t === "feed" ? "Feed" : "Discover"}
            </button>
          ))}
        </div>

        {tab === "feed" && (
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <Link href="/write" className="card card-hover" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", textDecoration: "none", marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--brand-muted)", flexShrink: 0 }} />
              <span style={{ flex: 1, padding: "9px 14px", background: "var(--bg-alt)", borderRadius: 99, fontSize: 13, color: "var(--text-4)" }}>What's on your mind?</span>
              <ImagePlus size={18} style={{ color: "#16a34a" }} />
            </Link>
            {feed === null ? [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: "var(--r-lg)", marginBottom: 10 }} />) :
              (() => {
                const pub = new Map(groups.map(g => [String(g.id), g]));
                const items = feed.filter(p => pub.has(String(p.group_id))).slice(0, 40);
                if (!items.length) return (
                  <div style={{ textAlign: "center", padding: "50px 20px", background: "var(--bg-card)", borderRadius: "var(--r-xl)", border: "1.5px dashed var(--border)" }}>
                    <Flame size={34} style={{ color: "var(--text-4)", marginBottom: 10 }} />
                    <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", fontFamily: "Outfit,sans-serif", marginBottom: 4 }}>No posts yet</p>
                    <p style={{ fontSize: 12, color: "var(--text-4)" }}>Join a space and be the first to post.</p>
                  </div>
                );
                return items.map(p => {
                  const g = pub.get(String(p.group_id))!;
                  const h = parseInt(String(p.author_address ?? "0").slice(2, 4) || "0", 16) * 1.4;
                  return (
                    <div key={p.id} className="card" style={{ padding: "14px 16px", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: `hsl(${h}deg,45%,50%)`, flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 11, fontWeight: 700, color: "var(--text)" }}>{String(p.author_address).slice(0, 6)}…{String(p.author_address).slice(-4)}</div>
                          <div style={{ fontSize: 11, color: "var(--text-4)" }}>in <Link href={`/contribute/${g.id}`} style={{ color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>{g.name}</Link> · {new Date(p.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <PostBody content={p.content} />
                    </div>
                  );
                });
              })()}
          </div>
        )}

        {tab !== "feed" && (<>
        {/* Search + filter */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", pointerEvents: "none" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search groups…"
              style={{ width: "100%", padding: "9px 14px 9px 36px", background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: "var(--r-lg)", fontSize: 13, color: "var(--text)", outline: "none", boxSizing: "border-box" as const }} />
          </div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {CATEGORIES.slice(0,6).map(c => (
              <button key={c} onClick={() => setCat(c)} style={{
                padding: "7px 12px", borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "1.5px solid",
                background: cat === c ? "var(--brand-muted)" : "transparent",
                color: cat === c ? "var(--brand)" : "var(--text-4)",
                borderColor: cat === c ? "var(--brand-border)" : "var(--border)",
              }}>{c}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 12 }}>
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 200, borderRadius: "var(--r-lg)" }} />)}
          </div>
        ) : !list.length ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--bg-card)", borderRadius: "var(--r-xl)", border: "1.5px dashed var(--border)" }}>
            <Users size={40} style={{ color: "var(--text-4)", marginBottom: 14 }} />
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", fontFamily: "Outfit,sans-serif", marginBottom: 6 }}>
              {tab === "mine" ? "You haven't joined any groups yet" : "No groups found"}
            </p>
            <p style={{ fontSize: 13, color: "var(--text-4)", marginBottom: 20 }}>
              {tab === "mine" ? "Discover and join groups below" : "Be the first to create one!"}
            </p>
            <Link href="/contribute/create" className="btn btn-primary" style={{ gap: 6 }}><Plus size={14} />Create Space</Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 12 }}>
            {list.map(g => <GroupCard key={g.id} g={g} isMember={(g.member_addresses || []).includes(address?.toLowerCase() || "")} />)}
          </div>
        )}
        </>)}
      </div>
    </div>
  );
}
