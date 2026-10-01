import { Component, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

const STALE = /dynamically imported module|importing a module script|Loading chunk|Unable to preload|error loading dynamically/i;

/** A deploy changes the hashed file names, so a tab opened before it can fail to load a page chunk. Reload once to pick up the new build. */
export function reloadOnce(): boolean {
  try {
    const last = Number(sessionStorage.getItem("rl-stale-reload") || 0);
    if (Date.now() - last < 30000) return false;
    sessionStorage.setItem("rl-stale-reload", String(Date.now()));
  } catch { /* storage blocked: still reload once per call site */ }
  location.reload();
  return true;
}
if (typeof window !== "undefined") window.addEventListener("vite:preloadError", (e) => { if (reloadOnce()) e.preventDefault(); });

/** Catches render errors so a bug never leaves a blank white page; resets itself when you navigate. */
class Boundary extends Component<{ children: ReactNode; path: string }, { error: Error | null; path: string }> {
  state = { error: null as Error | null, path: this.props.path };
  static getDerivedStateFromError(error: Error) { return { error }; }
  static getDerivedStateFromProps(p: { path: string }, s: { error: Error | null; path: string }) {
    return p.path !== s.path ? { error: null, path: p.path } : null;
  }
  componentDidCatch(error: Error, info: unknown) { console.error("UI error:", error, info); if (STALE.test(String(error?.message || error))) reloadOnce(); }
  render() {
    const e = this.state.error;
    if (!e) return this.props.children;
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--bg, #faf9f7)" }}>
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <div style={{ fontFamily: "Outfit,sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 8, color: "var(--text, #111)" }}>Something went wrong on this page</div>
          <p style={{ fontSize: 13, color: "var(--text-3, #666)", lineHeight: 1.6, marginBottom: 14 }}>Your work is safe. Reload to try again.</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button className="btn btn-primary" onClick={() => location.reload()}>Reload</button>
            <a className="btn btn-secondary" href="/">Home</a>
          </div>
          <pre style={{ marginTop: 14, fontSize: 10.5, color: "var(--text-4, #999)", whiteSpace: "pre-wrap", wordBreak: "break-word", textAlign: "left" }}>{String(e.message || e).slice(0, 300)}</pre>
        </div>
      </div>
    );
  }
}

export default function ErrorBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return <Boundary path={pathname}>{children}</Boundary>;
}
