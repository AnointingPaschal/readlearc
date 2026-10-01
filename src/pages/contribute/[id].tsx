import { apiFetch } from "@/lib/api";
import { useState, useEffect } from "react";
import { useParams } from "@/lib/nav";
import { Link } from "@/lib/nav";
import Navbar from "@/components/ui/Navbar";
import { useAuth } from "@/lib/auth";
import PostForm from "@/components/ui/PostForm";
import PostCard from "@/components/ui/PostCard";
import {
  Users, Lock, Globe, ArrowLeft, BookOpen,
  Flame, Crown, CheckCircle2, AlertCircle,
} from "lucide-react";

interface Group {
  id: string; name: string; description: string; type: "public" | "private";
  category: string; owner_address: string; banner_image?: string;
  member_count: number; post_count: number; tags: string[];
  member_addresses: string[]; rules: string; created_at: string;
}
interface Post {
  id: string; space_id: string; author_address: string; content: string;
  article_id?: string; type: string; likes: number; created_at: string;
}

function hue(addr: string) { return parseInt(String(addr ?? "0").slice(2, 4) || "0", 16) * 1.4; }
function short(addr: string) { return addr ? `${addr.slice(0,6)}…${addr.slice(-4)}` : "Unknown"; }

export default function ContributeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { address, isAuth, requireAuth } = useAuth();

  const [space,   setGroup]   = useState<Group | null>(null);
  const [posts,   setPosts]   = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  const isMember = space ? (space.member_addresses || []).includes(address?.toLowerCase() || "") : false;
  const isOwner  = space ? space.owner_address === address?.toLowerCase() : false;

  async function load() {
    setLoading(true);
    const [g, p] = await Promise.all([
      apiFetch(`/api/groups/${id}`).then(r => r.json()).catch(() => null),
      apiFetch(`/api/groups/${id}/posts`).then(r => r.json()).catch(() => []),
    ]);
    setGroup(g || null);
    setPosts(Array.isArray(p) ? p : []);
    setLoading(false);
  }
  useEffect(() => { if (id) load(); }, [id]);

  async function join() {
    if (!isAuth) { requireAuth(); return; }
    setJoining(true);
    const r = await apiFetch(`/api/groups/${id}/members`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberAddress: address }),
    });
    const d = await r.json();
    if (r.ok) { setSuccess("Joined!"); load(); }
    else setError(d.error || "Failed");
    setJoining(false);
    setTimeout(() => setSuccess(""), 3000);
  }

  async function leave() {
    const r = await apiFetch(`/api/groups/${id}/members`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberAddress: address, action: "leave" }),
    });
    if (r.ok) load();
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "calc(var(--header-h) + 40px) 16px" }}>
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: "var(--r-lg)", marginBottom: 12 }} />)}
      </div>
    </div>
  );

  if (!space) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "calc(var(--header-h) + 60px) 16px", textAlign: "center" }}>
        <Users size={40} style={{ color: "var(--text-4)", marginBottom: 14 }} />
        <h2 style={{ fontFamily: "Outfit,sans-serif", fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>Contribute space not found</h2>
        <Link href="/contribute" className="btn btn-secondary" style={{ gap: 6 }}><ArrowLeft size={13} />Back to Contribute</Link>
      </div>
    </div>
  );

  const canSee = space.type === "public" || isMember;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "calc(var(--header-h) + 12px) 14px calc(var(--bottom-nav-h, 0px) + 40px)" }}>

        {/* Back */}
        <Link href="/contribute" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-4)", textDecoration: "none", marginBottom: 14 }}>
          <ArrowLeft size={13} />Groups
        </Link>

        {/* Group header */}
        <div className="card" style={{ overflow: "hidden", marginBottom: 14, padding: 0 }}>
          <div style={{ height: 120, background: space.banner_image ? undefined : `linear-gradient(135deg,hsl(${hue(space.id)}deg,45%,25%),hsl(${hue(space.id)+60}deg,40%,18%))`, position: "relative" }}>
            {space.banner_image && <img src={space.banner_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.3)" }} />
            <div style={{ position: "absolute", bottom: 12, left: 16, display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 99, display: "flex", alignItems: "center", gap: 4, background: space.type === "private" ? "rgba(220,38,38,.85)" : "rgba(5,150,105,.85)", color: "white", backdropFilter: "blur(8px)" }}>
                {space.type === "private" ? <Lock size={9} /> : <Globe size={9} />}
                {space.type === "private" ? "Private Group" : "Public Group"}
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: "rgba(109,40,217,.85)", color: "white", backdropFilter: "blur(8px)" }}>{space.category}</span>
            </div>
          </div>

          <div style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <h1 style={{ fontFamily: "Outfit,sans-serif", fontSize: "clamp(18px,4vw,24px)", fontWeight: 900, color: "var(--text)", letterSpacing: "-.02em", marginBottom: 5 }}>{space.name}</h1>
                {space.description && <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6, maxWidth: 560 }}>{space.description}</p>}
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                {!isMember ? (
                  <button onClick={join} disabled={joining} className="btn btn-primary" style={{ gap: 6 }}>
                    {joining ? "Joining…" : <><Users size={13} />Join Space</>}
                  </button>
                ) : !isOwner ? (
                  <button onClick={leave} className="btn btn-secondary btn-sm" style={{ color: "#dc2626" }}>Leave</button>
                ) : null}
                {isOwner && <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-4)", padding: "6px 10px", background: "var(--bg-alt)", borderRadius: "var(--r)", border: "1px solid var(--border)" }}><Crown size={12} style={{ color: "#ca8a04" }} />Owner</span>}
              </div>
            </div>

            <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 12, color: "var(--text-4)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Users size={11} />{space.member_count} members</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><BookOpen size={11} />{space.post_count} posts</span>
            </div>
          </div>
        </div>

        {success && <div style={{ padding: "10px 14px", background: "rgba(5,150,105,.07)", border: "1px solid rgba(5,150,105,.2)", borderRadius: "var(--r-md)", marginBottom: 12, fontSize: 13, color: "var(--accent)", display: "flex", gap: 7 }}><CheckCircle2 size={14} />{success}</div>}
        {error && <div style={{ padding: "10px 14px", background: "rgba(220,38,38,.06)", border: "1px solid rgba(220,38,38,.2)", borderRadius: "var(--r-md)", marginBottom: 12, fontSize: 13, color: "#dc2626", display: "flex", gap: 7 }}><AlertCircle size={14} />{error}</div>}

        {/* Private lock */}
        {!canSee && (
          <div className="card" style={{ padding: "40px 24px", textAlign: "center" }}>
            <Lock size={36} style={{ color: "var(--text-4)", marginBottom: 14 }} />
            <h3 style={{ fontFamily: "Outfit,sans-serif", fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Private Group</h3>
            <p style={{ fontSize: 13, color: "var(--text-4)", marginBottom: 18 }}>Join this space to see posts and participate.</p>
            <button onClick={join} className="btn btn-primary" style={{ gap: 6 }}><Users size={13} />Request to Join</button>
          </div>
        )}

        {canSee && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 14, alignItems: "start" }}>

            {/* Posts feed */}
            <div>
              {/* Compose */}
              {isMember && (
                <div className="card" style={{ padding: "14px", marginBottom: 14 }}>
                  <PostForm groupId={id!} rows={3} allowAnnouncement={isOwner} onPosted={load}
                    placeholder={`Share something with ${space.name}…`} />
                </div>
              )}

              {/* Posts */}
              {!posts.length ? (
                <div className="card" style={{ padding: "36px 20px", textAlign: "center" }}>
                  <Flame size={32} style={{ color: "var(--text-4)", marginBottom: 12 }} />
                  <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", fontFamily: "Outfit,sans-serif", marginBottom: 5 }}>No contributions yet</p>
                  <p style={{ fontSize: 12, color: "var(--text-4)" }}>{isMember ? "Be the first to share research, ask questions!" : "Join to post."}</p>
                </div>
              ) : (
                posts.map(p => <PostCard key={p.id} post={p} group={{ id: space.id, name: space.name }} />)
              )}
            </div>

            {/* Sidebar */}
            <div>
              {space.rules && (
                <div className="card" style={{ padding: "14px", marginBottom: 10 }}>
                  <div style={{ fontFamily: "Outfit,sans-serif", fontSize: 11, fontWeight: 800, color: "var(--text)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>Space Rules</div>
                  <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{space.rules}</p>
                </div>
              )}
              <div className="card" style={{ padding: "14px" }}>
                <div style={{ fontFamily: "Outfit,sans-serif", fontSize: 11, fontWeight: 800, color: "var(--text)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>Members ({space.member_count})</div>
                {(space.member_addresses || []).slice(0, 8).map(addr => (
                  <div key={addr} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: `hsl(${hue(addr)}deg,40%,50%)`, flexShrink: 0 }} />
                    <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 10, color: "var(--text-3)", flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{short(addr)}</span>
                    {addr === space.owner_address && <Crown size={10} style={{ color: "#ca8a04", flexShrink: 0 }} />}
                  </div>
                ))}
                {space.member_count > 8 && <p style={{ fontSize: 10, color: "var(--text-4)", marginTop: 8 }}>+{space.member_count - 8} more members</p>}
              </div>
            </div>
          </div>
        )}

        <style>{`@media(max-width:680px){.card+div[style*="grid-template-columns"]{grid-template-columns:1fr !important}}`}</style>
      </div>
    </div>
  );
}
