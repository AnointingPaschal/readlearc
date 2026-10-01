import type { ReactNode } from "react";
import { X } from "lucide-react";

export const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".07em", display: "block", marginBottom: 5, fontFamily: "Outfit,sans-serif" };

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 520, maxHeight: "92vh", overflowY: "auto", background: "var(--bg-card)", borderRadius: "var(--r-xl) var(--r-xl) 0 0", padding: "22px 20px 36px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h3 style={{ fontFamily: "Outfit,sans-serif", fontSize: 18, fontWeight: 900, color: "var(--text)" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-4)" }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const ErrBox = ({ msg }: { msg: string }) => msg ? <div style={{ padding: "8px 12px", background: "rgba(220,38,38,.06)", border: "1px solid rgba(220,38,38,.18)", borderRadius: "var(--r)", fontSize: 12, color: "#dc2626" }}>{msg}</div> : null;

export const Spinner = () => <div style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "white", borderRadius: "50%" }} className="spin" />;

const COLORS: Record<string, [string, string]> = {
  success: ["#059669", "rgba(5,150,105,.1)"], complete: ["#059669", "rgba(5,150,105,.1)"],
  processing: ["#d97706", "rgba(217,119,6,.1)"], pending: ["#d97706", "rgba(217,119,6,.1)"],
  failed: ["#dc2626", "rgba(220,38,38,.1)"], reversed: ["#dc2626", "rgba(220,38,38,.1)"],
};
export function StatusChip({ s }: { s: string }) {
  const [fg, bg] = COLORS[s] || ["var(--text-4)", "var(--bg-alt)"];
  return <span style={{ fontSize: 10, fontWeight: 800, color: fg, background: bg, padding: "2px 8px", borderRadius: 99, textTransform: "capitalize" }}>{s}</span>;
}
