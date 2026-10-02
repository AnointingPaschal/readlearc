import { useRef, useState } from "react";
import { ImagePlus, X, Send, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { compressImage, encodePost, uploadPhoto, PHOTO_BUDGET, MAX_IMAGES, MAX_TEXT } from "@/lib/post";

interface Props {
  groupId: number | string;
  onPosted?: () => void;
  placeholder?: string;
  rows?: number;
  /** show the "announcement" switch (group owners) */
  allowAnnouncement?: boolean;
}

/** Facebook-style composer: text + photo uploads (compressed in the browser, stored off-chain; the post carries a short link). */
export default function PostForm({ groupId, onPosted, placeholder = "What's on your mind?", rows = 4, allowAnnouncement }: Props) {
  const { isAuth, requireAuth, signer } = useAuth();
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [posting, setPosting] = useState(false);
  const [announce, setAnnounce] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function addFiles(list: FileList | null) {
    const files = Array.from(list || []).filter((f) => f.type.startsWith("image/"));
    if (fileRef.current) fileRef.current.value = "";
    if (!files.length) return;
    setError("");
    const room = MAX_IMAGES - images.length;
    if (room <= 0) { setError(`You can add up to ${MAX_IMAGES} photos.`); return; }
    const take = files.slice(0, room);
    setBusy(true);
    try {
      const out: string[] = [];
      for (const f of take) out.push(await compressImage(f, PHOTO_BUDGET));
      setImages((x) => [...x, ...out]);
      if (files.length > room) setError(`Only ${MAX_IMAGES} photos per post — added the first ${room}.`);
    } catch (e) { setError((e as Error).message); }
    setBusy(false);
  }

  async function submit() {
    if (!isAuth) { requireAuth(); return; }
    if (!text.trim() && !images.length) return;
    setPosting(true); setError("");
    try {
      // photos live off-chain: upload them first, then post only their short links
      let links: string[] = [];
      if (images.length) { if (!signer) { requireAuth(); setPosting(false); return; } links = await Promise.all(images.map((d) => uploadPhoto(signer, d))); }
      const r = await apiFetch(`/api/groups/${groupId}/posts`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: encodePost({ text: text.trim(), images: links }), type: announce ? "announcement" : "discussion" }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Couldn't post. Are you a member of this community?");
      setText(""); setImages([]); setAnnounce(false);
      onPosted?.();
    } catch (e) { setError((e as Error).message); }
    setPosting(false);
  }

  const canPost = !posting && !busy && (text.trim().length > 0 || images.length > 0);

  return (
    <div>
      <textarea
        value={text} onChange={(e) => setText(e.target.value.slice(0, MAX_TEXT))} rows={rows} placeholder={placeholder}
        style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", background: "var(--bg-alt)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", fontSize: 15, lineHeight: 1.6, color: "var(--text)", outline: "none", resize: "vertical", fontFamily: "inherit" }}
      />

      {images.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: images.length === 1 ? "1fr" : "repeat(2,1fr)", gap: 6, marginTop: 10 }}>
          {images.map((src, i) => (
            <div key={i} style={{ position: "relative", borderRadius: "var(--r)", overflow: "hidden", border: "1px solid var(--border)", background: "var(--bg-alt)" }}>
              <img src={src} alt="" style={{ width: "100%", maxHeight: images.length === 1 ? 420 : 200, objectFit: "cover", display: "block" }} />
              <button onClick={() => setImages((x) => x.filter((_, j) => j !== i))} title="Remove photo"
                style={{ position: "absolute", top: 6, right: 6, width: 26, height: 26, borderRadius: "50%", border: "none", background: "rgba(0,0,0,.65)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p style={{ fontSize: 12, color: "#dc2626", margin: "8px 0 0" }}>{error}</p>}

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
        <button type="button" className="btn btn-ghost btn-sm" disabled={busy || images.length >= MAX_IMAGES} onClick={() => fileRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {busy ? <Loader2 size={14} className="spin" /> : <ImagePlus size={15} style={{ color: "#16a34a" }} />}Photo
        </button>
        {allowAnnouncement && (
          <label style={{ fontSize: 12, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
            <input type="checkbox" checked={announce} onChange={(e) => setAnnounce(e.target.checked)} />Announcement
          </label>
        )}
        <span style={{ fontSize: 11, color: "var(--text-4)", marginLeft: "auto" }}>{text.length}/{MAX_TEXT}</span>
        <button className="btn btn-primary btn-sm" disabled={!canPost} onClick={submit} style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 84, justifyContent: "center" }}>
          {posting ? <><Loader2 size={13} className="spin" />Posting…</> : <><Send size={13} />Post</>}
        </button>
      </div>
    </div>
  );
}
