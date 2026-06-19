import { Settings } from "lucide-react";

export default function Page() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>Content Overview</h1>
        <p style={{ color: "var(--text-4)", fontSize: 12, marginTop: 3 }}>Admin · Content Overview</p>
      </div>
      <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
        <Settings size={32} style={{ color: "var(--text-4)", marginBottom: 14 }} />
        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-3)", marginBottom: 6 }}>Content Overview</p>
        <p style={{ fontSize: 13, color: "var(--text-4)", maxWidth: 400, margin: "0 auto" }}>
          This section is ready for configuration. Connect your owner wallet and use the controls to manage platform settings.
        </p>
      </div>
    </div>
  );
}
