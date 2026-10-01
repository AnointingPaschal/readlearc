import { useState } from "react";
import { X } from "lucide-react";
import { parsePost } from "@/lib/post";

/** Renders a community post: text + photo grid (tap a photo to view it full-size). */
export default function PostBody({ content }: { content: string }) {
  const { text, images } = parsePost(content);
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div>
      {text && <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.65, whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>{text}</p>}
      {images.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: images.length === 1 ? "1fr" : "repeat(2,1fr)", gap: 4, marginTop: text ? 10 : 0, borderRadius: "var(--r)", overflow: "hidden" }}>
          {images.map((src, i) => (
            <img key={i} src={src} alt="" loading="lazy" onClick={() => setOpen(src)}
              style={{ width: "100%", height: images.length === 1 ? "auto" : 180, maxHeight: images.length === 1 ? 520 : 180, objectFit: "cover", cursor: "zoom-in", display: "block" }} />
          ))}
        </div>
      )}
      {open && (
        <div onClick={() => setOpen(null)} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,.88)", display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
          <button onClick={() => setOpen(null)} style={{ position: "absolute", top: 14, right: 14, width: 36, height: 36, borderRadius: "50%", border: "none", background: "rgba(255,255,255,.15)", color: "white", cursor: "pointer" }}><X size={18} /></button>
          <img src={open} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
        </div>
      )}
    </div>
  );
}
