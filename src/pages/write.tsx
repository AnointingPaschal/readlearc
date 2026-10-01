/**
 * /write — a simple community post, like Facebook: a few words and/or photos, posted to one of your spaces.
 * (Long-form, monetizable articles live at /write/article.)
 */
import { useEffect, useState } from "react";
import { PenLine, Users, FileText } from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import ConnectGate from "@/components/ui/ConnectGate";
import PostForm from "@/components/ui/PostForm";
import { Link, useRouter } from "@/lib/nav";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

interface G { id: string; name: string }
const LAST = "rl-last-community";
const hue = (a: string) => parseInt(String(a ?? "0").slice(2, 4) || "0", 16) * 1.4;

export default function WritePost() {
  const { address, isAuth } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<G[] | null>(null);
  const [gid, setGid] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (!isAuth || !address) return;
    apiFetch(`/api/groups?member=${address}&limit=100`).then((r) => r.json()).then((d) => {
      const list: G[] = Array.isArray(d) ? d : [];
      setGroups(list);
      let last = ""; try { last = localStorage.getItem(LAST) || ""; } catch { /* */ }
      setGid(list.find((g) => String(g.id) === last)?.id ? last : list[0] ? String(list[0].id) : "");
    }).catch(() => setGroups([]));
    apiFetch(`/api/profiles/${address}`).then((r) => r.json()).then((p) => setName(p?.display_name || p?.username || "")).catch(() => {});
  }, [isAuth, address]);

  const shell = (children: React.ReactNode) => (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "calc(var(--header-h) + 20px) 16px 110px" }}>{children}</div>
    </div>
  );

  if (!isAuth) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <ConnectGate title="Sign in to post" body="Create or unlock your wallet to share with your spaces." icon={PenLine} />
    </div>
  );

  return shell(<>
    <h1 style={{ fontFamily: "Outfit,sans-serif", fontWeight: 900, fontSize: 24, color: "var(--text)", letterSpacing: "-.02em", margin: "0 0 14px" }}>Create post</h1>

    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: `hsl(${hue(address)}deg,55%,50%)`, flexShrink: 0 }} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{name || `${address.slice(0, 6)}…${address.slice(-4)}`}</div>
          {groups && groups.length > 0 && (
            <select value={gid} onChange={(e) => { setGid(e.target.value); try { localStorage.setItem(LAST, e.target.value); } catch { /* */ } }}
              style={{ marginTop: 3, maxWidth: "100%", fontSize: 12, fontWeight: 600, color: "var(--brand)", background: "var(--brand-muted)", border: "1px solid var(--brand-border)", borderRadius: 99, padding: "3px 10px", outline: "none" }}>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {groups === null ? (
        <div className="skeleton" style={{ height: 140, borderRadius: "var(--r)" }} />
      ) : groups.length === 0 ? (
        <div style={{ textAlign: "center", padding: "26px 10px" }}>
          <Users size={30} style={{ color: "var(--text-4)", marginBottom: 8 }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "0 0 4px" }}>Join a space to start posting</p>
          <p style={{ fontSize: 12, color: "var(--text-4)", margin: "0 0 14px" }}>Posts are shared inside spaces. Join one or start your own.</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/contribute" className="btn btn-primary btn-sm">Browse spaces</Link>
            <Link href="/contribute/create" className="btn btn-ghost btn-sm">Create one</Link>
          </div>
        </div>
      ) : (
        <PostForm key={gid} groupId={gid} rows={5} placeholder="What's on your mind?" onPosted={() => router.push(`/contribute/${gid}`)} />
      )}
    </div>

    <Link href="/write/article" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 12, color: "var(--text-3)", textDecoration: "none" }}>
      <FileText size={14} style={{ color: "var(--brand)" }} />Writing a long article or research paper? <b style={{ color: "var(--brand)" }}>Open the article editor →</b>
    </Link>
  </>);
}
