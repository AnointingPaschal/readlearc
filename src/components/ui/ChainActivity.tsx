import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import { activity, type ActivityItem } from "@/lib/activity";

/** Bottom-left toasts for on-chain operations in flight (publishing, uploading video, etc.). */
export default function ChainActivity() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  useEffect(() => activity.subscribe(setItems), []);
  if (!items.length) return null;
  return (
    <div style={{ position: "fixed", left: 14, bottom: 84, zIndex: 400, display: "flex", flexDirection: "column", gap: 8, maxWidth: "min(360px, calc(100vw - 28px))" }}>
      {items.map((i) => (
        <div key={i.id} className="card" style={{ padding: "10px 12px", display: "flex", gap: 10, alignItems: "flex-start", boxShadow: "var(--shadow)" }}>
          {i.state === "run" && <Loader2 size={16} className="spin" style={{ color: "var(--brand)", flexShrink: 0, marginTop: 1 }} />}
          {i.state === "done" && <CheckCircle2 size={16} style={{ color: "var(--accent)", flexShrink: 0, marginTop: 1 }} />}
          {i.state === "fail" && <AlertCircle size={16} style={{ color: "#dc2626", flexShrink: 0, marginTop: 1 }} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{i.label}</div>
            {i.detail && <div style={{ fontSize: 11, color: i.state === "fail" ? "#dc2626" : "var(--text-3)", marginTop: 2, wordBreak: "break-word" }}>{i.detail}</div>}
            {i.state === "run" && typeof i.pct === "number" && (
              <div style={{ height: 3, borderRadius: 3, background: "var(--bg-alt)", marginTop: 6, overflow: "hidden" }}>
                <div style={{ width: `${Math.max(2, Math.min(100, i.pct))}%`, height: "100%", background: "var(--brand)", transition: "width .2s" }} />
              </div>
            )}
          </div>
          {i.state !== "run" && (
            <button onClick={() => activity.dismiss(i.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-4)", padding: 0 }}><X size={13} /></button>
          )}
        </div>
      ))}
    </div>
  );
}
