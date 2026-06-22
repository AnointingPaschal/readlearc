"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "../../../components/ui/Navbar";
import { useAuth } from "../../../lib/auth";
import {
  Users, Lock, Globe, ArrowLeft, Send, BookOpen,
  Flame, Crown, CheckCircle2, AlertCircle,
} from "lucide-react";

interface Group {
  id: string; name: string; description: string; type: "public" | "private";
  category: string; owner_address: string; banner_image?: string;
  member_count: number; post_count: number; tags: string[];
  member_addresses: string[]; rules: string; created_at: string;
}
interface Post {
  id: string; group_id: string; author_address: string; content: string;
  article_id?: string; type: string; likes: number; created_at: string;
}

function hue(addr: string) { return parseInt((addr || "0").slice(2, 4) || "0", 16) * 1.4; }
function short(addr: string) { return addr ? `${addr.slice(0,6)}…${addr.slice(-4)}` : "Unknown"; }

export default function GroupPage() {
  const { id } = useParams<{ id: string }>();
  const { address, isAuth, requireAuth } = useAuth();

  const [group,   setGroup]   = useState<Group | null>(null);
  const [posts,   setPosts]   = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [joining, setJoining] = useState(false);
  const [draft,   setDraft]   = useState("");
  const [postType,setPostType]= useState<"discussion" | "announcement">("discussion");
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  const isMember = group ? (group.member_addresses || []).includes(address?.toLowerCase() || "") : false;
  const isOwner  = group ? group.owner_address === address?.toLowerCase() : false;

  async function load() {
    setLoading(true);
    const [g, p] = await Promise.all([
      fetch(`/api/groups/${id}`).then(r => r.json()).catch(() => null),
      fetch(`/api/groups/${id}/posts`).then(r => r.json()).catch(() => []),
    ]);
    setGroup(g || null);
    setPosts(Array.isArray(p) ? p : []);
    setLoading(false);
  }
  useEffect(() => { if (id) load(); }, [id]);

  async function join() {
    if (!isAuth) { requireAuth(); return; }
    setJoining(true);
    const r = await fetch(`/api/groups/${id}/members`, {
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
    const r = await fetch(`/api/groups/${id}/members`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberAddress: address, action: "leave" }),
    });
    if (r.ok) load();
  }

  async function submitPost() {
    if (!draft.trim()) return;
    setPosting(true); setError("");
    const r = await fetch(`/api/groups/${id}/posts`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorAddress: address, content: draft, type: postType }),
    });
    const d = await r.json();
    if (r.ok) { setDraft(""); load(); }
    else setError(d.error || "Failed to post");
    setPosting(false);
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "calc(var(--header-h) + 40px) 16px" }}>
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: "var(--r-lg)", marginBottom: 12 }} />)}
      </div>
    </div>
  );

  if (!group) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "calc(var(--header-h) + 60px) 16px", textAlign: "center" }}>
        <Users size={40} style={{ color: "var(--text-4)", marginBottom: 14 }} />
        <h2 style={{ fontFamily: "Outfit,sans-serif", fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>Group not found</h2>
        <Link href="/contribute" className="btn btn-secondary" style={{ gap: 6 }}><ArrowLeft size={13} />Back to Groups</Link>
      </div>
    </div>
  );

  const canSee = group.type === "public" || isMember;

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
          <div style={{ height: 120, background: group.banner_image ? undefined : `linear-gradient(135deg,hsl(${hue(group.id)}deg,45%,25%),hsl(${hue(group.id)+60}deg,40%,18%))`, position: "relative" }}>
            {group.banner_image && <img src={group.banner_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.3)" }} />
            <div style={{ position: "absolute", bottom: 12, left: 16, display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 99, display: "flex", alignItems: "center", gap: 4, background: group.type === "private" ? "rgba(220,38,38,.85)" : "rgba(5,150,105,.85)", color: "white", backdropFilter: "blur(8px)" }}>
                {group.type === "private" ? <Lock size={9} /> : <Globe size={9} />}
                {group.type === "private" ? "Private Group" : "Public Group"}
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: "rgba(109,40,217,.85)", color: "white", backdropFilter: "blur(8px)" }}>{group.category}</span>
            </div>
          </div>

          <div style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <h1 style={{ fontFamily: "Outfit,sans-serif", fontSize: "clamp(18px,4vw,24px)", fontWeight: 900, color: "var(--text)", letterSpacing: "-.02em", marginBottom: 5 }}>{group.name}</h1>
                {group.description && <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6, maxWidth: 560 }}>{group.description}</p>}
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                {!isMember ? (
                  <button onClick={join} disabled={joining} className="btn btn-primary" style={{ gap: 6 }}>
                    {joining ? "Joining…" : <><Users size={13} />Join Group</>}
                  </button>
                ) : !isOwner ? (
                  <button onClick={leave} className="btn btn-secondary btn-sm" style={{ color: "#dc2626" }}>Leave</button>
                ) : null}
                {isOwner && <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-4)", padding: "6px 10px", background: "var(--bg-alt)", borderRadius: "var(--r)", border: "1px solid var(--border)" }}><Crown size={12} style={{ color: "#ca8a04" }} />Owner</span>}
              </div>
            </div>

            <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 12, color: "var(--text-4)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Users size={11} />{group.member_count} members</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><BookOpen size={11} />{group.post_count} posts</span>
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
            <p style={{ fontSize: 13, color: "var(--text-4)", marginBottom: 18 }}>Join this group to see posts and participate.</p>
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
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    {(["discussion","announcement"] as const).map(t => (
                      <button key={t} onClick={() => setPostType(t)} style={{
                        padding: "4px 12px", fontSize: 11, fontWeight: 700, borderRadius: "var(--r-f)", cursor: "pointer",
                        border: `1.5px solid ${postType === t ? "var(--brand)" : "var(--border)"}`,
                        background: postType === t ? "var(--brand-muted)" : "transparent",
                        color: postType === t ? "var(--brand)" : "var(--text-4)",
                        textTransform: "capitalize",
                      }}>{t}</button>
                    ))}
                  </div>
                  <textarea value={draft} onChange={e => setDraft(e.target.value)}
                    placeholder={postType === "announcement" ? "Share an announcement with the group…" : "Start a discussion, share an article, ask a question…"}
                    rows={3}
                    style={{ width: "100%", padding: "10px 12px", background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", fontSize: 13, color: "var(--text)", outline: "none", resize: "none", boxSizing: "border-box" as const, lineHeight: 1.6 }} />
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                    <button onClick={submitPost} disabled={posting || !draft.trim()} className="btn btn-primary btn-sm" style={{ gap: 5 }}>
                      {posting ? "Posting…" : <><Send size={12} />Post</>}
                    </button>
                  </div>
                </div>
              )}

              {/* Posts */}
              {!posts.length ? (
                <div className="card" style={{ padding: "36px 20px", textAlign: "center" }}>
                  <Flame size={32} style={{ color: "var(--text-4)", marginBottom: 12 }} />
                  <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", fontFamily: "Outfit,sans-serif", marginBottom: 5 }}>No posts yet</p>
                  <p style={{ fontSize: 12, color: "var(--text-4)" }}>{isMember ? "Be the first to start a discussion!" : "Join to post."}</p>
                </div>
              ) : (
                posts.map(p => (
                  <div key={p.id} className="card" style={{ padding: "14px 16px", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: `hsl(${hue(p.author_address)}deg,40%,50%)`, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 10, fontWeight: 700, color: "var(--text)" }}>
                          {short(p.author_address)}
                          {p.author_address === group.owner_address && <Crown size={9} style={{ display: "inline", marginLeft: 4, color: "#ca8a04" }} />}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--text-4)" }}>
                          {new Date(p.created_at).toLocaleDateString()} ·
                          <span style={{ marginLeft: 4, fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 99, background: p.type === "announcement" ? "rgba(220,38,38,.1)" : "var(--brand-muted)", color: p.type === "announcement" ? "#dc2626" : "var(--brand)", border: `1px solid ${p.type === "announcement" ? "rgba(220,38,38,.2)" : "var(--brand-border)"}` }}>{p.type}</span>
                        </div>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{p.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Sidebar */}
            <div>
              {group.rules && (
                <div className="card" style={{ padding: "14px", marginBottom: 10 }}>
                  <div style={{ fontFamily: "Outfit,sans-serif", fontSize: 11, fontWeight: 800, color: "var(--text)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>Group Rules</div>
                  <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{group.rules}</p>
                </div>
              )}
              <div className="card" style={{ padding: "14px" }}>
                <div style={{ fontFamily: "Outfit,sans-serif", fontSize: 11, fontWeight: 800, color: "var(--text)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>Members ({group.member_count})</div>
                {(group.member_addresses || []).slice(0, 8).map(addr => (
                  <div key={addr} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: `hsl(${hue(addr)}deg,40%,50%)`, flexShrink: 0 }} />
                    <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 10, color: "var(--text-3)", flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{short(addr)}</span>
                    {addr === group.owner_address && <Crown size={10} style={{ color: "#ca8a04", flexShrink: 0 }} />}
                  </div>
                ))}
                {group.member_count > 8 && <p style={{ fontSize: 10, color: "var(--text-4)", marginTop: 8 }}>+{group.member_count - 8} more members</p>}
              </div>
            </div>
          </div>
        )}

        <style>{`@media(max-width:680px){.card+div[style*="grid-template-columns"]{grid-template-columns:1fr !important}}`}</style>
      </div>
    </div>
  );
}
