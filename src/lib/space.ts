/** Every account gets a default space ("<Name>'s Space") to post in; they can create more from their profile. */
import { apiFetch } from "@/lib/api";

export const defaultSpaceName = (name: string) => `${name.trim()}'s Space`;

/** Creates the user's default space unless they already own one. Resolves with the space id (existing or new). */
export async function ensureDefaultSpace(address: string, name: string): Promise<{ id: string; created: boolean }> {
  const me = address.toLowerCase();
  const list = await apiFetch(`/api/groups?member=${me}&limit=100`).then((r) => r.json()).catch(() => []);
  const owned = (Array.isArray(list) ? list : []).find((g: any) => String(g.owner_address || "").toLowerCase() === me);
  if (owned) return { id: String(owned.id), created: false };
  const r = await apiFetch("/api/groups", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: defaultSpaceName(name), description: `Posts and updates from ${name.trim()}.`, category: "General", type: "public", tags: [] }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Couldn't create your space.");
  return { id: String(d.id), created: true };
}
