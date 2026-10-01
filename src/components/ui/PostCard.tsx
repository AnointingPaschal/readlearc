/** A community post shown like a Facebook post: author, text + photos, reactions, comments with replies. */
import { useEffect, useRef, useState } from "react";
import { Link } from "@/lib/nav";
import { Flame, Zap, Gem, ThumbsDown, CloudRain, XOctagon, MessageCircle, Smile, Megaphone } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { postContentId } from "@/lib/post";
import { REACTIONS, type ReactionKey } from "@/lib/reactions";
import PostBody from "@/components/ui/PostBody";
import Comments from "@/components/social/Comments";

const ICONS: Record<ReactionKey, React.ElementType> = { flame: Flame, zap: Zap, gem: Gem, thumbsdown: ThumbsDown, cloudrain: CloudRain, xoctagon: XOctagon };
const ORDER: ReactionKey[] = ["flame", "zap", "gem", "thumbsdown", "cloudrain", "xoctagon"];

export interface PostRow { id: number | string; group_id?: number; author_address: string; content: string; type: string; created_at: string }
export interface AuthorInfo { name?: string | null; username?: string | null }

const profCache = new Map<string, Promise<AuthorInfo>>();
function authorInfo(addr: string): Promise<AuthorInfo> {
  const k = addr.toLowerCase();
  if (!profCache.has(k)) {
    profCache.set(k, apiFetch(`/api/profiles/${k}`).then((r) => r.json()).then((p) => ({ name: p?.display_name, username: p?.username })).catch(() => ({})));
  }
  return profCache.get(k)!;
}

function ago(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m`;
  if (d < 86400) return `${Math.floor(d / 3600)}h`;
  if (d < 86400 * 7) return `${Math.floor(d / 86400)}d`;
  return new Date(iso).toLocaleDateString();
}

function useInView<T extends Element>(): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (seen || !ref.current) return;
    if (typeof IntersectionObserver === "undefined") { setSeen(true); return; }
    const io = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) { setSeen(true); io.disconnect(); } }, { rootMargin: "300px" });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [seen]);
  return [ref, seen];
}

export default function PostCard({ post, group, author }: { post: PostRow; group?: { id: number | string; name: string } | null; author?: AuthorInfo }) {
  const { address, isAuth, requireAuth } = useAuth();
  const cid = postContentId(post.id);
  const [ref, seen] = useInView<HTMLDivElement>();
  const [info, setInfo] = useState<AuthorInfo>(author || {});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [mine, setMine] = useState<ReactionKey | null>(null);
  const [picker, setPicker] = useState(false);
  const [open, setOpen] = useState(false);
  const [commentCount, setCommentCount] = useState<number | null>(null);

  useEffect(() => { if (!author) authorInfo(post.author_address).then(setInfo); }, [post.author_address, author]);
  useEffect(() => { if (author) setInfo(author); }, [author]);

  async function loadReactions() {
    try {
      const d = await (await apiFetch(`/api/social/reactions/${cid}`)).json();
      setCounts(d?.counts || {});
      setMine(address ? ((d?.voters?.[address.toLowerCase()] as ReactionKey) || null) : null);
    } catch { /* keep empty */ }
  }
  async function loadCommentCount() {
    try { const l = await (await apiFetch(`/api/social/comments/${cid}`)).json(); setCommentCount(Array.isArray(l) ? l.length : 0); } catch { /* ignore */ }
  }
  useEffect(() => { if (seen) { loadReactions(); loadCommentCount(); } }, [seen, address]);
  useEffect(() => {
    const h = () => loadCommentCount();
    window.addEventListener("reload-comments", h);
    return () => window.removeEventListener("reload-comments", h);
  }, [cid]);

  async function react(key: ReactionKey) {
    setPicker(false);
    if (!isAuth || !address) { requireAuth(); return; }
    const next = mine === key ? null : key;
    const prev = mine;
    setCounts((c) => { const n = { ...c }; if (prev) n[prev] = Math.max(0, (n[prev] || 0) - 1); if (next) n[next] = (n[next] || 0) + 1; return n; });
    setMine(next);
    const r = await apiFetch(`/api/social/reactions/${cid}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ emoji: next }) });
    if (!r.ok) loadReactions(); // rejected in the approval sheet or failed → restore real state
  }

  const total = ORDER.reduce((s, k) => s + (counts[k] || 0), 0);
  const top = ORDER.filter((k) => (counts[k] || 0) > 0).sort((a, b) => (counts[b] || 0) - (counts[a] || 0)).slice(0, 3);
  const h = parseInt(String(post.author_address).slice(2, 4) || "0", 16) * 1.4;
  const name = info.name || (info.username ? `@${info.username}` : `${post.author_address.slice(0, 6)}…${post.author_address.slice(-4)}`);
  const MineIcon = mine ? ICONS[mine] : Smile;

  return (
    <div ref={ref} className="card" style={{ padding: 0, marginBottom: 12, overflow: "visible" }}>
      <div style={{ padding: "14px 16px 4px", display: "flex", alignItems: "center", gap: 10 }}>
        <Link href={`/profile/${post.author_address}`} style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg,hsl(${h}deg,60%,55%),hsl(${(h + 40) % 360}deg,55%,45%))`, flexShrink: 0 }} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <Link href={`/profile/${post.author_address}`} style={{ fontWeight: 700, fontSize: 14, color: "var(--text)", textDecoration: "none", fontFamily: "Outfit,sans-serif" }}>{name}</Link>
          <div style={{ fontSize: 11.5, color: "var(--text-4)", display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
            {group && <><span>in</span><Link href={`/contribute/${group.id}`} style={{ color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>{group.name}</Link><span>·</span></>}
            <span>{ago(post.created_at)}</span>
            {post.type === "announcement" && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9.5, fontWeight: 800, padding: "1px 6px", borderRadius: 99, background: "rgba(220,38,38,.1)", color: "#dc2626" }}><Megaphone size={9} />Announcement</span>}
          </div>
        </div>
      </div>

      <div style={{ padding: "8px 16px 10px" }}><PostBody content={post.content} /></div>

      {(total > 0 || (commentCount ?? 0) > 0) && (
        <div style={{ padding: "0 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: "var(--text-4)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            {top.map((k) => { const I = ICONS[k]; return <span key={k} style={{ width: 20, height: 20, borderRadius: "50%", background: REACTIONS[k].color, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><I size={11} color="white" /></span>; })}
            {total > 0 && <span>{total}</span>}
          </span>
          {(commentCount ?? 0) > 0 && <button onClick={() => setOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-4)", fontSize: 12, padding: 0 }}>{commentCount} comment{commentCount === 1 ? "" : "s"}</button>}
        </div>
      )}

      <div style={{ borderTop: "1px solid var(--border)", display: "flex", position: "relative" }}>
        {picker && (
          <div style={{ position: "absolute", bottom: "100%", left: 10, marginBottom: 6, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 99, padding: "6px 8px", display: "flex", gap: 4, boxShadow: "0 8px 28px rgba(0,0,0,.18)", zIndex: 20 }}>
            {ORDER.map((k) => { const I = ICONS[k]; return (
              <button key={k} title={REACTIONS[k].label} onClick={() => react(k)} style={{ width: 38, height: 38, borderRadius: "50%", border: mine === k ? `2px solid ${REACTIONS[k].color}` : "none", background: `${REACTIONS[k].color}22`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <I size={18} color={REACTIONS[k].color} />
              </button>
            ); })}
          </div>
        )}
        <button onClick={() => (mine ? react(mine) : setPicker((v) => !v))} onContextMenu={(e) => { e.preventDefault(); setPicker(true); }}
          style={{ flex: 1, padding: "11px 0", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontSize: 13, fontWeight: 700, color: mine ? REACTIONS[mine].color : "var(--text-3)" }}>
          <MineIcon size={17} />{mine ? REACTIONS[mine].label : "React"}
        </button>
        <button onClick={() => setPicker((v) => !v)} aria-label="More reactions" style={{ width: 34, background: "none", border: "none", cursor: "pointer", color: "var(--text-4)", fontSize: 11 }}>▾</button>
        <button onClick={() => setOpen((v) => !v)}
          style={{ flex: 1, padding: "11px 0", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontSize: 13, fontWeight: 700, color: open ? "var(--brand)" : "var(--text-3)" }}>
          <MessageCircle size={17} />Comment
        </button>
      </div>

      {open && <div style={{ borderTop: "1px solid var(--border)", padding: "12px 16px 14px" }}><Comments articleId={cid} /></div>}
    </div>
  );
}
