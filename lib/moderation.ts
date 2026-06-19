/**
 * Client-side moderation state — persists via localStorage.
 * Since admin and site share the same domain, localStorage is shared across all pages.
 * This means article removals take effect instantly in the same browser session.
 *
 * For cross-user/cross-browser persistence (production), connect Vercel KV:
 * vercel.com → Storage → Create KV Database → env vars auto-added → swap this module.
 */

export type ModStatus = "live" | "review" | "removed" | "featured";

const KEY = "rl-mod-v1";

export function getMod(): Record<string, ModStatus> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); }
  catch { return {}; }
}

export function getStatus(id: string): ModStatus {
  return getMod()[id] || "live";
}

export function setStatus(id: string, status: ModStatus): void {
  if (typeof window === "undefined") return;
  const all = getMod();
  if (status === "live") delete all[id]; // default — saves space
  else all[id] = status;
  localStorage.setItem(KEY, JSON.stringify(all));
  // Also sync to API (best-effort, for same-instance cross-tab benefit)
  fetch("/api/moderation", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ articleId: id, status }),
  }).catch(() => {});
  // Fire custom event so other components on the same page can react
  window.dispatchEvent(new CustomEvent("rl-mod-change", { detail: { id, status } }));
}

export function getHidden(): string[] {
  const all = getMod();
  return Object.keys(all).filter(id => all[id] === "removed");
}

export function getFeatured(): string[] {
  const all = getMod();
  return Object.keys(all).filter(id => all[id] === "featured");
}

export function isVisible(id: string): boolean {
  const s = getStatus(id);
  return s !== "removed";
}

export function exportConfig(): string {
  return localStorage.getItem(KEY) || "{}";
}

export function importConfig(json: string): void {
  try { JSON.parse(json); localStorage.setItem(KEY, json); } catch {}
}
