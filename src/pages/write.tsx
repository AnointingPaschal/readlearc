/**
 * /write — a simple community post, like Facebook: a few words and/or photos, posted to one of your spaces.
 * (Long-form, monetizable articles live at /write/article.)
 */
import { useEffect, useState } from "react";
import { PenLine, Users, FileText, FlaskConical, Loader2, Plus } from "lucide-react";
import { ensureDefaultSpace } from "@/lib/space";
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
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!isAuth || !address) return;
    apiFetch(`/api/groups?member=${address}&limit=100`).then((r) => r.json()).then((d) => {
      const list: G[] = Array.isArray(d) ? d : [];
      setGroups(list);
      let last = ""; try { last = localStorage.getItem(LAST) || ""; } catch { /* */ }
      setGid(list.find((g) => String(g.id) === last)?.id ? last : list[0] ? String(list[0].id) : "");
    }).catch(() => setGroups([]));
    apiFetch(`/api/profiles/${address}`).then((r) => r.json()).then((p) => setName(p?.display_name || p?.username || "")).catch(() => {});
  }, [isAuth, address, reload]);

  async function createMine() {
    setCreating(true); setErr("");
    try { await ensureDefaultSpace(address, name || `${address.slice(0, 6)}…${address.slice(-4)}`); setReload((x) => x + 1); }
    catch (e) { setErr((e as Error).message); }
    setCreating(false);
  }

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
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "0 0 4px" }}>You don't have a space yet</p>
          <p style={{ fontSize: 12, color: "var(--text-4)", margin: "0 0 14px" }}>Posts are shared inside spaces. Create your own, or join one.</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={createMine} disabled={creating} className="btn btn-primary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {creating ? <><Loader2 size={13} className="spin" />Creating…</> : <><Plus size={13} />Create my space</>}
            </button>
            <Link href="/contribute" className="btn btn-ghost btn-sm">Browse spaces</Link>
          </div>
          {err && <p style={{ fontSize: 12, color: "#dc2626", marginTop: 10 }}>{err}</p>}
        </div>
      ) : (
        <PostForm key={gid} groupId={gid} rows={5} placeholder="What's on your mind?" onPosted={() => router.push(`/contribute/${gid}`)} />
      )}
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
      <Link href="/write/article" className="btn btn-secondary" style={{ justifyContent: "center", gap: 7, height: 46, fontWeight: 700 }}>
        <FileText size={15} />Write Article
      </Link>
      <Link href="/write/research" className="btn btn-primary" style={{ justifyContent: "center", gap: 7, height: 46, fontWeight: 700 }}>
        <FlaskConical size={15} />Research Studio
      </Link>
    </div>
  </>);
}
