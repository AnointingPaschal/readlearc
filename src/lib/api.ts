/**
 * `apiFetch` — drop-in replacement for `fetch("/api/…")`.
 *
 * Data routes (articles, videos, profiles, follows, comments, reactions, communities, roles…) are
 * answered straight from the blockchain and return the same JSON shapes the pages always used, so
 * there is no database. Writes are signed by the user's in-browser wallet.
 *
 * Only a handful of routes still hit the network — the Cloudflare Pages Functions in /functions
 * (KV-backed admin settings & branding, AI proxy, content-key release, config). Those are called
 * with a wallet-signed `Authorization` header when they mutate admin state.
 */
import { C, lc, shortAddr } from "@/lib/chain";
import { cfg, isConfigured } from "@/lib/config";
import { getActiveSigner, requireSigner } from "@/lib/signer";
import { authHeader } from "@/lib/onchain/auth";
import { withActivity } from "@/lib/activity";
import { onWrite } from "@/lib/freshness";
import * as content from "@/lib/onchain/content";
import * as social from "@/lib/onchain/social";
import * as money from "@/lib/onchain/money";
import { IFACES, scan, topic, blockTimes } from "@/lib/onchain/logs";

type Ctx = { path: string; method: string; params: string[]; q: URLSearchParams; body: any };
type Handler = (c: Ctx) => Promise<unknown | Response>;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
const err = (message: string, status = 400) => json({ error: message }, status);
const num = (s: string) => Number(s);

// ── drafts live on this device only (they are private work-in-progress, not publications) ──
const draftKey = (a: string) => `rl-drafts:${lc(a)}`;
const readDrafts = (a: string): any[] => { try { return JSON.parse(localStorage.getItem(draftKey(a)) || "[]"); } catch { return []; } };
const writeDrafts = (a: string, d: any[]) => { try { localStorage.setItem(draftKey(a), JSON.stringify(d)); } catch { /* quota */ } };
const draftOwner = (id: string): string | null => {
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)!;
    if (k.startsWith("rl-drafts:") && readDrafts(k.slice(10)).some((d) => String(d.id) === id)) return k.slice(10);
  }
  return null;
};

const FILLER = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.";

async function articleDetail(id: number, reader: string | null, admin: boolean) {
  const c = await content.getContent(id);
  if (!c || c.kind !== 0) return err("Not found", 404);
  const signer = getActiveSigner();
  const readerAddr = reader || signer?.address || "";
  const free = c.price === 0n;
  const access = free || (await content.hasAccess(id, readerAddr)) || (admin && !!signer);
  let body: string | null = null;
  if (c.finalized && access) {
    try { body = await content.readArticleBody(c, signer); } catch (e) { if (!admin) console.warn("body:", (e as Error).message); }
  }
  const base = content.articleJson(c);
  const split = body ? Math.floor(body.length * 0.55) : 0;
  return json({
    ...base,
    content: body,
    contentPreview: body ? content.makePreview(body) : c.preview,
    contentBlur: body ? body.slice(split, split + 1400) : FILLER,
    hasPaid: access && body !== null,
    authorMonetized: await C.mon().isMonetized(c.author).catch(() => false),
  });
}

const routes: [RegExp, Handler][] = [];
const on = (re: RegExp, h: Handler) => routes.push([re, h]);

// ═══════════════════════ Articles ═══════════════════════
on(/^\/api\/(?:admin\/)?articles$/, async (c) => {
  if (c.method === "GET") {
    const admin = c.path.startsWith("/api/admin/");
    const author = c.q.get("author");
    const st = c.q.get("status");
    let status: content.ListOpts["status"];
    if (admin) status = st && st !== "all" ? (st as content.StatusName) : "all";
    else if (author) status = st ? (st as content.StatusName) : "all";
    else status = st === "featured" ? "featured" : st === "pending" ? "pending" : "public";
    const cards = await content.listCards({
      kind: 0, author: author || undefined, category: c.q.get("category") || undefined, q: c.q.get("q") || undefined,
      status, isResearch: c.q.get("isResearch") === "true" ? true : undefined, limit: Math.min(num(c.q.get("limit") || "50"), 500),
    });
    return cards.map((x) => content.articleJson(x));
  }
  if (c.method === "POST") {
    const b = c.body;
    if (!b?.title || !b?.content) return err("title and content required");
    const signer = await requireSigner();
    const r = await withActivity("Publishing article on-chain", (u) =>
      content.publishArticle(signer, { title: b.title, blurb: b.blurb, content: b.content, price: b.price, category: b.category, readTime: b.readTime, isResearch: b.isResearch }, u),
      { batch: "Publishes your article on-chain. It is written in several transactions, all signed automatically once you approve." });
    return json({ id: String(r.id), txHash: r.txHash, ok: true }, 201);
  }
  if (c.method === "PUT") {
    const b = c.body || {};
    if (b.readerAddress && b.txHash) return json({ ok: true, recorded: false }); // payments are recorded by the contract itself
    if (!b.id) return err("id required");
    const signer = await requireSigner();
    if (b.status !== undefined || b.featured !== undefined) await content.setStatus(signer, num(b.id), b.status ?? "approved", b.featured);
    return json({ ok: true });
  }
  return err("Method not allowed", 405);
});

on(/^\/api\/articles\/(\d+)$/, async (c) => {
  const id = num(c.params[0]);
  if (c.method === "GET") return articleDetail(id, c.q.get("reader"), c.q.get("admin") === "1");
  const signer = await requireSigner();
  if (c.method === "DELETE") { await content.removeContent(signer, id); return json({ ok: true }); }
  if (c.method === "PUT") {
    const b = c.body || {};
    if (b.status === "pending" && Object.keys(b).length === 1) {
      const { send } = await import("@/lib/chain");
      await send(C.store(signer).resubmit(id));
      content.invalidateContent();
      return json({ ok: true });
    }
    await withActivity("Updating article on-chain", (u) =>
      content.updateArticle(signer, id, { title: b.title, blurb: b.blurb, content: b.content, price: b.price, category: b.category, isResearch: b.isResearch, readTime: b.readTime }, u),
      { batch: "Updates your article on-chain in several transactions, all signed automatically once you approve." });
    return json({ ok: true });
  }
  return err("Method not allowed", 405);
});

on(/^\/api\/articles\/(\d+)\/pay$/, async (c) => {
  const id = num(c.params[0]);
  const reader = c.q.get("reader") || "";
  if (c.method === "GET") return { paid: await content.hasAccess(id, reader) };
  return { ok: true }; // payment is executed on-chain by the wallet; nothing to record
});

on(/^\/api\/admin\/articles\/(\d+)$/, async (c) => {
  const id = num(c.params[0]);
  const signer = await requireSigner();
  if (c.method === "PATCH") {
    await withActivity("Updating status on-chain", async () => content.setStatus(signer, id, c.body?.status ?? "approved", c.body?.featured));
    return json({ ok: true });
  }
  if (c.method === "DELETE") { await content.removeContent(signer, id); return json({ ok: true }); }
  return err("Method not allowed", 405);
});

on(/^\/api\/moderation$/, async (c) => {
  if (c.method === "GET") {
    if (c.q.get("action") === "featured") return (await content.listCards({ kind: 0, featured: true })).map((x) => String(x.id));
    const id = c.q.get("id");
    if (id) { const x = await content.getContent(num(id)); return { status: x ? (x.featured && x.status === 1 ? "featured" : content.STATUS[x.status]) : "live" }; }
    return {};
  }
  const signer = await requireSigner();
  await content.setStatus(signer, num(c.body.articleId), c.body.status);
  return { ok: true };
});

// ═══════════════════════ Videos ═══════════════════════
on(/^\/api\/videos$/, async (c) => {
  if (c.method !== "GET") return err("Upload videos from Contribute → Video (on-chain upload).", 400);
  const cards = await content.listCards({
    kind: 1, category: c.q.get("category") || undefined, author: c.q.get("creator") || undefined,
    featured: c.q.get("featured") === "true" || undefined, status: "public",
    limit: num(c.q.get("limit") || "20"), offset: num(c.q.get("offset") || "0"),
  });
  const vids = await Promise.all(cards.map(async (x) => content.videoJson(x, await content.thumbDataUrl(x).catch(() => null))));
  return { videos: vids };
});
on(/^\/api\/(?:videos|stream\/meta)\/([a-z0-9-]+)$/, async (c) => {
  const slug = c.params[0];
  const v = await content.getContentBySlug(slug);
  if (!v || v.kind !== 1) return err("Video not found", 404);
  if (c.method === "DELETE") { await content.removeContent(await requireSigner(), v.id); return { ok: true }; }
  return { video: content.videoJson(v, await content.thumbDataUrl(v).catch(() => null)) };
});

// ═══════════════════════ Profiles ═══════════════════════
on(/^\/api\/profiles$/, async (c) => {
  if (c.method === "GET") { const a = c.q.get("address"); return a ? await social.getProfile(a, false) : err("address required"); }
  const b = c.body || {};
  const signer = await requireSigner();
  if (!b.username) return err("username required");
  await withActivity("Saving profile on-chain", () =>
    social.saveProfile(signer, { username: b.username, displayName: b.displayName, bio: b.bio, avatarColor: b.avatarColor, website: b.website, twitter: b.twitter }));
  return social.getProfile(signer.address, false);
});
on(/^\/api\/profiles\/check-username$/, async (c) => ({ available: await social.usernameAvailable(c.q.get("username") || "", getActiveSigner()?.address) }));
on(/^\/api\/profiles\/(0x[0-9a-fA-F]{40})$/, async (c) => {
  const p = await social.getProfile(c.params[0], true);
  return p.username || p.followerCount || p.articleCount ? p : { wallet_address: c.params[0], username: null, followerCount: 0, followingCount: 0, articleCount: 0, avatar_color: "#6d28d9" };
});

// ═══════════════════════ Follows ═══════════════════════
on(/^\/api\/social\/follow$/, async (c) => {
  if (c.method === "GET") {
    const a = c.q.get("address") || "";
    return c.q.get("action") === "followers" ? social.listFollowers(a) : social.listFollowing(a);
  }
  return social.toggleFollow(await requireSigner(), c.body.target);
});

// ═══════════════════════ Comments & reactions ═══════════════════════
on(/^\/api\/social\/comments\/(\d+)$/, async (c) => {
  const id = num(c.params[0]);
  if (c.method === "GET") return (await social.listComments(id)).map((x) => ({ ...x, id: String(x.id), parentId: x.parentId ? String(x.parentId) : null }));
  const signer = await requireSigner();
  if (c.method === "POST") {
    const text = c.body.text || c.body.content || "";
    const r = await social.addComment(signer, id, text, c.body.parentId ? num(c.body.parentId) : 0);
    return { id: String(r.id), articleId: String(id), authorAddress: signer.address, authorName: c.body.authorName, text, parentId: c.body.parentId || null, edited: false, timestamp: Math.floor(Date.now() / 1000) };
  }
  if (c.method === "PATCH") { await social.editComment(signer, num(c.body.commentId), c.body.text); return { ok: true }; }
  if (c.method === "DELETE") { await social.deleteComment(signer, num(c.q.get("commentId") || "0")); return { ok: true }; }
  return err("Method not allowed", 405);
});
on(/^\/api\/social\/reactions\/(\d+)$/, async (c) => {
  const id = num(c.params[0]);
  if (c.method === "GET") return social.getReactions(id);
  return social.setReaction(await requireSigner(), id, c.body.emoji || null);
});

// ═══════════════════════ Communities ═══════════════════════
on(/^\/api\/groups$/, async (c) => {
  if (c.method === "GET") return social.listGroups({ member: c.q.get("member") || undefined, type: c.q.get("type") || undefined, q: c.q.get("q") || undefined, limit: num(c.q.get("limit") || "60") });
  const b = c.body;
  if (!b?.name) return err("name required");
  const signer = await requireSigner();
  const r = await withActivity("Creating community on-chain", () => social.createGroup(signer, b));
  return json({ id: r.id, ...b }, 201);
});
on(/^\/api\/groups\/(\d+)$/, async (c) => {
  const id = num(c.params[0]);
  if (c.method === "GET") { const g = await social.getGroup(id); return g ?? err("Not found", 404); }
  const signer = await requireSigner();
  if (c.method === "DELETE") { await social.deleteGroup(signer, id); return { ok: true }; }
  if (c.method === "PUT") {
    const b = c.body || {};
    if (b.type) { const { send } = await import("@/lib/chain"); await send(C.social(signer).setPrivate(id, b.type === "private")); return { ok: true }; }
    await social.updateGroup(signer, id, { name: b.name, description: b.description, bannerImage: b.bannerImage, rules: b.rules, tags: b.tags });
    return { ok: true };
  }
  return err("Method not allowed", 405);
});
on(/^\/api\/groups\/(\d+)\/posts$/, async (c) => {
  const id = num(c.params[0]);
  if (c.method === "GET") return social.listGroupPosts(id);
  const signer = await requireSigner();
  await withActivity("Posting on-chain", () => social.postToGroup(signer, id, c.body.content, c.body.articleId, c.body.type));
  return json({ ok: true }, 201);
});
on(/^\/api\/groups\/(\d+)\/members$/, async (c) => {
  const id = num(c.params[0]);
  const signer = await requireSigner();
  const who = lc(c.body.memberAddress);
  const me = lc(signer.address);
  if (c.method === "POST") { who === me ? await social.joinGroup(signer, id) : await social.approveMember(signer, id, c.body.memberAddress); return { ok: true }; }
  if (c.method === "PUT") { who === me ? await social.leaveGroup(signer, id) : await social.removeMember(signer, id, c.body.memberAddress); return { ok: true }; }
  return err("Method not allowed", 405);
});
on(/^\/api\/admin\/group-posts\/(\d+)$/, async (c) => {
  await social.deleteGroupPost(await requireSigner(), num(c.params[0]));
  return { ok: true };
});

// ═══════════════════════ Monetization / payments ═══════════════════════
on(/^\/api\/pay\/subscribe\/config$/, async (c) => {
  if (c.method === "GET") return { config: (await money.subscriptionInfo(c.q.get("creator") || "")).config };
  const b = c.body;
  await money.savePlan(await requireSigner(), String(b.monthlyPrice ?? 0), String(b.yearlyPrice ?? 0), b.enabled ?? true);
  return { ok: true };
});
on(/^\/api\/pay\/subscribe$/, async (c) => {
  const { subscribed, expiry } = await money.subscriptionInfo(c.q.get("creator") || "", c.q.get("subscriber") || undefined);
  return { subscribed, expiry };
});
on(/^\/api\/pay\/tip$/, async () => ({ ok: true }));

// ═══════════════════════ Roles & admin lists ═══════════════════════
on(/^\/api\/admin\/roles\/check$/, async (c) => {
  const role = await money.roleOf(c.q.get("address") || "");
  return { role, roleName: money.ROLE_NAMES[role] };
});
on(/^\/api\/admin\/roles$/, async (c) => {
  if (c.method === "GET") {
    const list = await money.listRoles();
    const profs = await social.getProfiles(list.map((r) => r.walletAddress));
    return list.map((r) => ({ ...r, username: profs.get(lc(r.walletAddress))?.username, displayName: profs.get(lc(r.walletAddress))?.display_name }));
  }
  const b = c.body;
  await withActivity("Updating role on-chain", () => money.setRole(requireSignerSync(), b.walletAddress, b.role));
  return { ok: true };
});
function requireSignerSync() { const s = getActiveSigner(); if (!s) throw new Error("Connect your wallet to continue."); return s; }

on(/^\/api\/admin\/readers$/, async () => {
  const pays = await money.allPayments();
  const readers = new Map<string, { address: string; reads: number; spent: number }>();
  const logs = await scan(cfg.payments, [topic(IFACES.pay, "ArticlePaid")]);
  for (const l of logs) {
    const p = IFACES.pay.parseLog(l)!;
    const a = lc(p.args.reader);
    const r = readers.get(a) || { address: a, reads: 0, spent: 0 };
    r.reads += 1; r.spent += Number(p.args.amount) / 1e6;
    readers.set(a, r);
  }
  void pays;
  const profs = await social.getProfiles([...readers.keys()]);
  return [...readers.values()].map((r) => ({ ...r, username: profs.get(r.address)?.username ?? null }));
});

on(/^\/api\/admin\/earnings$/, async () => {
  const rows = await money.allPayments();
  const by = new Map<string, { address: string; total: number; pending: number; paid: number; count: number }>();
  for (const r of rows) {
    const a = lc(r.counterparty);
    const e = by.get(a) || { address: a, total: 0, pending: 0, paid: 0, count: 0 };
    e.total += r.amount; e.paid += r.amount; e.count += 1; by.set(a, e);
  }
  return { writers: [...by.values()], total: rows.reduce((s, r) => s + r.gross, 0), pending: 0, rows };
});
on(/^\/api\/admin\/payout$/, async (c) => (c.method === "GET" ? [] : { ok: true }));

on(/^\/api\/activity$/, async (c) => {
  const limit = Math.min(num(c.q.get("limit") || "40"), 100);
  const specs: [string, ethers_Interface, string][] = [
    [cfg.contentStore, IFACES.store, "ContentCreated"],
    [cfg.payments, IFACES.pay, "ArticlePaid"],
    [cfg.payments, IFACES.pay, "Subscribed"],
    [cfg.payments, IFACES.pay, "Tipped"],
    [cfg.social, IFACES.social, "Followed"],
    [cfg.social, IFACES.social, "GroupCreated"],
  ];
  const all = (await Promise.all(specs.map(async ([addr, iface, name]) => (await scan(addr, [topic(iface, name)])).map((l) => ({ l, iface, name }))))).flat();
  all.sort((a, b) => b.l.blockNumber - a.l.blockNumber);
  const top = all.slice(0, limit);
  const times = await blockTimes(top.map((t) => t.l.blockNumber));
  const titles = new Map((await content.loadCards()).map((x) => [x.id, x.title]));
  return top.map(({ l, iface, name }, i) => {
    const p = iface.parseLog(l)!;
    const a = p.args;
    const actor = a.author ?? a.reader ?? a.subscriber ?? a.from ?? a.follower ?? a.owner ?? "";
    const target = a.writer ?? a.creator ?? a.target ?? null;
    const cid = a.contentId ?? a.id;
    return {
      id: i, actor_address: actor, action_type: ({ ContentCreated: "publish", ArticlePaid: "read", Subscribed: "subscribe", Tipped: "tip", Followed: "follow", GroupCreated: "group" } as Record<string, string>)[name],
      target_address: target, article_id: name === "ArticlePaid" || name === "ContentCreated" ? String(cid) : null,
      created_at: new Date((times.get(l.blockNumber) || 0) * 1000).toISOString(),
      articles: name === "ArticlePaid" || name === "ContentCreated" ? { id: String(cid), title: titles.get(Number(cid)) || `#${cid}` } : null, tx: l.transactionHash,
    };
  });
});

// ═══════════════════════ Drafts (local) ═══════════════════════
on(/^\/api\/drafts$/, async (c) => {
  if (c.method === "GET") { const a = c.q.get("address") || c.q.get("author") || ""; return readDrafts(a).sort((x, y) => y.last_saved.localeCompare(x.last_saved)); }
  const b = c.body || {};
  const a = lc(b.authorAddress || b.author_address || getActiveSigner()?.address);
  if (!a) return err("author required");
  const now = new Date().toISOString();
  const d = { id: Date.now(), author_address: a, title: b.title || "", sections: b.sections || [], refs: b.refs || [], keywords: b.keywords || [], status: "draft", last_saved: now, created_at: now };
  writeDrafts(a, [d, ...readDrafts(a)]);
  return json(d, 201);
});
on(/^\/api\/drafts\/(\d+)$/, async (c) => {
  const id = c.params[0];
  const a = draftOwner(id);
  if (!a) return err("Not found", 404);
  const all = readDrafts(a);
  if (c.method === "DELETE") { writeDrafts(a, all.filter((d) => String(d.id) !== id)); return { ok: true }; }
  if (c.method === "PUT") {
    const next = all.map((d) => (String(d.id) === id ? { ...d, ...c.body, id: d.id, last_saved: new Date().toISOString() } : d));
    writeDrafts(a, next);
    return next.find((d) => String(d.id) === id);
  }
  return all.find((d) => String(d.id) === id) ?? err("Not found", 404);
});

// AI analysis: the browser reads the (maybe encrypted) article from the chain and hands plain text to the KV-keyed function.
on(/^\/api\/admin\/analyze\/(\d+)$/, async (c) => {
  if (c.method === "GET") return passthrough(c.path, "GET", undefined);
  const id = num(c.params[0]);
  const signer = await requireSigner();
  const item = await content.getContent(id);
  if (!item) return err("Article not found", 404);
  const text = await content.readArticleBody(item, signer);
  const res = await passthrough(c.path, "POST", JSON.stringify({ title: item.title, content: text }));
  const d = await res.clone().json().catch(() => null);
  if (res.ok && d?.autoApprove && item.status === 0) await content.setStatus(signer, id, "approved");
  return res;
});

on(/^\/api\/admin\/notifications$/, async () => {
  const feed = (await (await apiFetch("/api/activity?limit=60")).json()) as any[];
  const names = await social.getProfiles(feed.map((f) => f.actor_address).filter(Boolean));
  const who = (a: string) => names.get(lc(a))?.username ? `@${names.get(lc(a))!.username}` : shortAddr(a);
  return feed.map((f) => {
    const title = f.articles?.title ? `“${f.articles.title}”` : "";
    const m: Record<string, { type: string; title: string; body: string; link?: string }> = {
      publish: { type: "article_approved", title: "New content published", body: `${who(f.actor_address)} published ${title}`, link: f.article_id ? `/article/${f.article_id}` : undefined },
      read: { type: "sale", title: "Article unlocked", body: `${who(f.actor_address)} paid to read ${title}`, link: `/article/${f.article_id}` },
      subscribe: { type: "sale", title: "New subscription", body: `${who(f.actor_address)} subscribed to ${f.target_address ? who(f.target_address) : "a creator"}` },
      tip: { type: "sale", title: "Tip sent", body: `${who(f.actor_address)} tipped ${f.target_address ? who(f.target_address) : "a creator"}` },
      follow: { type: "follow", title: "New follow", body: `${who(f.actor_address)} followed ${f.target_address ? who(f.target_address) : "someone"}` },
      group: { type: "comment", title: "Community created", body: `${who(f.actor_address)} started a community` },
    };
    const x = m[f.action_type] || { type: "comment", title: f.action_type, body: "" };
    return { id: `${f.tx}:${f.id}`, read: true, created_at: f.created_at, ...x };
  });
});

// retired server-side routes
on(/^\/api\/(?:seed|admin\/migrate|setup|debug)$/, async () => ({ ok: true, info: "Database-free: nothing to seed or migrate." }));

type ethers_Interface = import("ethers").Interface;

// Routes that really are served by Cloudflare Pages Functions and need a wallet signature.
const NEEDS_AUTH = (path: string, method: string) =>
  /^\/api\/admin\//.test(path) || path === "/api/openrouter/models" || path.startsWith("/api/content/") ||
  (path === "/api/brand" && method !== "GET") || (path === "/api/config" && method !== "GET");

/** Call a Pages Function (KV-backed). Signs the request with the unlocked wallet when the route needs it. */
async function passthrough(path: string, method: string, body: string | undefined, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (body !== undefined && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (NEEDS_AUTH(path, method)) {
    const s = getActiveSigner();
    if (s) headers.set("Authorization", await authHeader(s, method, path, body ?? ""));
  }
  return fetch(path + ((init as { __qs?: string }).__qs ?? ""), { ...init, method, headers, body });
}

// ── stale-while-revalidate for public read routes: instant on repeat views, refreshed behind the scenes ──
const SWR = [/^\/api\/(?:articles|videos)$/, /^\/api\/profiles\/0x[0-9a-fA-F]{40}$/, /^\/api\/social\/follow$/, /^\/api\/groups$/, /^\/api\/groups\/\d+$/, /^\/api\/groups\/\d+\/posts$/];
const API_PFX = "rl-api:";
const API_FRESH = 10_000, API_STALE = 10 * 60_000;
const apiMem = new Map<string, { at: number; data: unknown }>();
const apiBusy = new Map<string, Promise<unknown>>();

function dropApiCache() {
  apiMem.clear();
  try { Object.keys(localStorage).filter((k) => k.startsWith(API_PFX)).forEach((k) => localStorage.removeItem(k)); } catch { /* ignore */ }
}
onWrite(dropApiCache);

async function swr(key: string, run: () => Promise<unknown>): Promise<unknown> {
  const k = `${getActiveSigner()?.address ?? ""}|${cfg.contentStore}|${key}`;
  let hit = apiMem.get(k);
  if (!hit) {
    try {
      const raw = localStorage.getItem(API_PFX + k);
      if (raw) { hit = JSON.parse(raw); if (hit) apiMem.set(k, hit); }
    } catch { /* ignore */ }
  }
  const refresh = () => {
    let p = apiBusy.get(k);
    if (!p) {
      p = run().then((out) => {
        if (out instanceof Response) return out;
        const entry = { at: Date.now(), data: out };
        apiMem.set(k, entry);
        try { const str = JSON.stringify(entry); if (str.length < 250_000) localStorage.setItem(API_PFX + k, str); } catch { try { Object.keys(localStorage).filter((x) => x.startsWith(API_PFX)).forEach((x) => localStorage.removeItem(x)); } catch { /* ignore */ } }
        return out;
      }).finally(() => apiBusy.delete(k));
      apiBusy.set(k, p);
    }
    return p;
  };
  const age = hit ? Date.now() - hit.at : Infinity;
  if (hit && age < API_FRESH) return hit.data;
  if (hit && age < API_STALE) { refresh().catch(() => {}); return hit.data; }
  { const o = await refresh(); return o instanceof Response ? o.clone() : o; }
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const raw = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  if (!raw.startsWith("/api/")) return fetch(input, init);
  const url = new URL(raw, location.origin);
  const method = (init.method || "GET").toUpperCase();
  let body: any;
  if (typeof init.body === "string") { try { body = JSON.parse(init.body); } catch { body = init.body; } }

  for (const [re, handler] of routes) {
    const m = url.pathname.match(re);
    if (!m) continue;
    const isFn = re.source.includes("analyze");
    if (!isFn && !isConfigured()) return err("Contracts aren’t configured yet. An admin must set them in Admin → Finance → Contracts.", 503);
    const run = async () => handler({ path: url.pathname, method, params: m.slice(1), q: url.searchParams, body });
    try {
      if (method === "GET" && SWR.some((r) => r.test(url.pathname))) { const v = await swr(url.pathname + url.search, run); return v instanceof Response ? v : json(v); }
      const out = await run();
      if (method !== "GET") dropApiCache();
      return out instanceof Response ? out : json(out);
    } catch (e) {
      const { explainError } = await import("@/lib/chain");
      return err(explainError(e, "Request failed"), 500);
    }
  }
  return passthrough(url.pathname, method, typeof init.body === "string" ? init.body : undefined, Object.assign({}, init, { __qs: url.search }));
}

export { shortAddr };
