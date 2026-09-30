/** Profiles, followers, comments, reactions and communities — all read from / written to the Social contract. */
import { ethers } from "ethers";
import { C, lc, send } from "@/lib/chain";
import { cfg } from "@/lib/config";
import { IFACES, scan, topic, pad, blockTimes } from "@/lib/onchain/logs";

const Z = ethers.ZeroAddress;
const S = IFACES.social;
const T = (n: string) => topic(S, n);

// ═══════════════ Profiles ═══════════════
export interface ProfileRow {
  wallet_address: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_color: string;
  website: string | null;
  twitter: string | null;
  created_at?: string;
  saved_to_chain: boolean;
  articleCount?: number;
  followerCount?: number;
  followingCount?: number;
}

const profCache = new Map<string, ProfileRow>();
const rowFrom = (addr: string, p: ethers.Result): ProfileRow => ({
  wallet_address: addr,
  username: p.username || null,
  display_name: p.displayName || null,
  bio: p.bio || null,
  avatar_color: p.avatarColor || "#6d28d9",
  website: p.website || null,
  twitter: p.twitter || null,
  created_at: Number(p.createdAt) ? new Date(Number(p.createdAt) * 1000).toISOString() : undefined,
  saved_to_chain: !!p.username,
});

export async function getProfiles(addrs: string[]): Promise<Map<string, ProfileRow>> {
  const uniq = [...new Set(addrs.map(lc))].filter(Boolean);
  const need = uniq.filter((a) => !profCache.has(a));
  if (need.length) {
    const rows = await C.social().profilesOf(need);
    need.forEach((a, i) => profCache.set(a, rowFrom(a, rows[i])));
  }
  return new Map(uniq.map((a) => [a, profCache.get(a)!]));
}

export async function getProfile(addr: string, withStats = true): Promise<ProfileRow> {
  const a = lc(addr);
  profCache.delete(a);
  const row = (await getProfiles([a])).get(a)!;
  if (!withStats) return row;
  const [articleCount, followerCount, followingCount] = await Promise.all([
    C.store().approvedCount(addr).then(Number).catch(() => 0),
    C.social().followerCount(addr).then(Number).catch(() => 0),
    C.social().followingCount(addr).then(Number).catch(() => 0),
  ]);
  return { ...row, articleCount, followerCount, followingCount };
}

export async function saveProfile(
  signer: ethers.Signer,
  p: { username: string; displayName?: string; bio?: string; avatarColor?: string; website?: string; twitter?: string },
) {
  await send(C.social(signer).setProfile(p.username.toLowerCase(), p.displayName || "", p.bio || "", p.avatarColor || "#6d28d9", p.website || "", p.twitter || ""));
  profCache.delete(lc(await signer.getAddress()));
}

export async function usernameAvailable(name: string, me?: string): Promise<boolean> {
  const holder: string = await C.social().addressOfUsername(name.toLowerCase());
  return holder === Z || (!!me && lc(holder) === lc(me));
}

// ═══════════════ Follows ═══════════════
export async function isFollowing(follower: string, target: string): Promise<boolean> {
  try { return await C.social().isFollowing(follower, target); } catch { return false; }
}

export async function toggleFollow(signer: ethers.Signer, target: string): Promise<{ following: boolean; followers: number }> {
  const me = await signer.getAddress();
  const social = C.social(signer);
  const now = await social.isFollowing(me, target);
  await send(now ? social.unfollow(target) : social.follow(target));
  return { following: !now, followers: Number(await social.followerCount(target)) };
}

/** Fold Followed/Unfollowed logs into a live set. */
async function foldFollows(a: { follower?: string; target?: string }): Promise<string[]> {
  const f = a.follower ? pad(a.follower) : null;
  const t = a.target ? pad(a.target) : null;
  const [fw, un] = await Promise.all([
    scan(cfg.social, [T("Followed"), f, t]),
    scan(cfg.social, [T("Unfollowed"), f, t]),
  ]);
  const evs = [...fw.map((l) => ({ l, on: true })), ...un.map((l) => ({ l, on: false }))].sort(
    (x, y) => x.l.blockNumber - y.l.blockNumber || x.l.index - y.l.index,
  );
  const set = new Map<string, boolean>();
  for (const { l, on } of evs) {
    const p = S.parseLog(l)!;
    const other = a.target ? p.args.follower : p.args.target;
    set.set(lc(other), on);
  }
  return [...set.entries()].filter(([, v]) => v).map(([k]) => k);
}

export async function listFollowers(target: string) {
  const addrs = await foldFollows({ target });
  const profs = await getProfiles(addrs);
  return addrs.map((a) => ({ follower_address: a, profiles: pub(profs.get(a)) }));
}
export async function listFollowing(follower: string) {
  const addrs = await foldFollows({ follower });
  const profs = await getProfiles(addrs);
  return addrs.map((a) => ({ following_address: a, profiles: pub(profs.get(a)) }));
}
const pub = (p?: ProfileRow) => ({ username: p?.username ?? null, display_name: p?.display_name ?? null, avatar_color: p?.avatar_color ?? "#6d28d9" });

// ═══════════════ Comments ═══════════════
export interface CommentRow {
  id: number; articleId: string; authorAddress: string; authorName?: string; text: string;
  parentId: number | null; edited: boolean; timestamp: number;
}

export async function listComments(contentId: number, fromBlock?: number): Promise<CommentRow[]> {
  const cid = pad(contentId);
  const [made, edits, dels] = await Promise.all([
    scan(cfg.social, [T("Commented"), cid], fromBlock),
    scan(cfg.social, [T("CommentEdited"), cid], fromBlock),
    scan(cfg.social, [T("CommentDeleted"), cid], fromBlock),
  ]);
  const rows = new Map<number, CommentRow>();
  const blocks: number[] = [];
  for (const l of made) {
    const p = S.parseLog(l)!;
    blocks.push(l.blockNumber);
    rows.set(Number(p.args.id), {
      id: Number(p.args.id), articleId: String(contentId), authorAddress: p.args.author, text: p.args.text,
      parentId: Number(p.args.parentId) || null, edited: false, timestamp: l.blockNumber,
    });
  }
  for (const l of edits) {
    const p = S.parseLog(l)!; const r = rows.get(Number(p.args.id));
    if (r) { r.text = p.args.text; r.edited = true; }
  }
  for (const l of dels) rows.delete(Number(S.parseLog(l)!.args.id));
  const list = [...rows.values()];
  const [times, profs] = await Promise.all([blockTimes(blocks), getProfiles(list.map((r) => r.authorAddress))]);
  for (const r of list) {
    r.timestamp = times.get(r.timestamp) ?? 0;
    r.authorName = profs.get(lc(r.authorAddress))?.username || undefined;
  }
  return list.sort((a, b) => a.id - b.id);
}

export async function addComment(signer: ethers.Signer, contentId: number, text: string, parentId?: number | null) {
  const rc = await send(C.social(signer).comment(contentId, text, parentId || 0));
  const ev = rc.logs.map((l) => { try { return S.parseLog(l); } catch { return null; } }).find((p) => p?.name === "Commented");
  return { id: Number(ev?.args.id ?? 0), txHash: rc.hash };
}
export const editComment = (signer: ethers.Signer, id: number, text: string) => send(C.social(signer).editComment(id, text));
export const deleteComment = (signer: ethers.Signer, id: number) => send(C.social(signer).deleteComment(id));

// ═══════════════ Reactions ═══════════════
export const REACTION_KEYS = ["", "flame", "zap", "gem", "thumbsdown", "cloudrain", "xoctagon"] as const;

export async function getReactions(contentId: number) {
  const counts: Record<string, number> = {};
  const c = await C.social().reactionCounts(contentId);
  REACTION_KEYS.forEach((k, i) => { if (i && Number(c[i])) counts[k] = Number(c[i]); });
  const logs = await scan(cfg.social, [T("Reacted"), pad(contentId)]);
  const voters: Record<string, string> = {};
  for (const l of logs) {
    const p = S.parseLog(l)!;
    const k = REACTION_KEYS[Number(p.args.key)];
    if (k) voters[lc(p.args.user)] = k; else delete voters[lc(p.args.user)];
  }
  return { counts, voters };
}

export async function setReaction(signer: ethers.Signer, contentId: number, key: string | null) {
  const idx = key ? REACTION_KEYS.indexOf(key as (typeof REACTION_KEYS)[number]) : 0;
  await send(C.social(signer).react(contentId, Math.max(0, idx)));
  return getReactions(contentId);
}

// ═══════════════ Communities ═══════════════
export interface GroupRow {
  id: number; name: string; description: string; type: "public" | "private"; category: string;
  owner_address: string; banner_image: string | null; member_addresses: string[]; member_count: number;
  post_count: number; rules: string; tags: string[]; created_at: string; active: boolean;
}

const groupFrom = (id: number, g: ethers.Result, members: string[] = []): GroupRow => ({
  id, name: g.name, description: g.description, type: g.isPrivate ? "private" : "public", category: g.category,
  owner_address: g.owner, banner_image: g.banner || null, member_addresses: members, member_count: Number(g.memberCount),
  post_count: Number(g.postCount), rules: g.rules, tags: g.tags ? String(g.tags).split(",").map((s: string) => s.trim()).filter(Boolean) : [],
  created_at: new Date(Number(g.createdAt) * 1000).toISOString(), active: g.active,
});

export async function getGroupMembers(id: number): Promise<string[]> {
  const gid = pad(id);
  const [j, l] = await Promise.all([scan(cfg.social, [T("Joined"), gid]), scan(cfg.social, [T("Left"), gid])]);
  const evs = [...j.map((x) => ({ x, on: true })), ...l.map((x) => ({ x, on: false }))].sort(
    (a, b) => a.x.blockNumber - b.x.blockNumber || a.x.index - b.x.index,
  );
  const set = new Map<string, boolean>();
  for (const { x, on } of evs) set.set(lc(S.parseLog(x)!.args.member), on);
  return [...set.entries()].filter(([, v]) => v).map(([k]) => k);
}

export async function listGroups(o: { member?: string; type?: string; q?: string; limit?: number } = {}): Promise<GroupRow[]> {
  const social = C.social();
  const total = Number(await social.groupCount());
  if (!total) return [];
  const [, raw] = await social.getGroups(1, total);
  let rows = (raw as ethers.Result[]).map((g, i) => groupFrom(i + 1, g)).filter((g) => g.active);
  if (o.type && o.type !== "all") rows = rows.filter((g) => g.type === o.type);
  else if (!o.member && !o.type) rows = rows.filter((g) => g.type === "public");
  if (o.q) rows = rows.filter((g) => g.name.toLowerCase().includes(o.q!.toLowerCase()));
  if (o.member) {
    const m = lc(o.member);
    const flags = await Promise.all(rows.map((g) => social.isMember(g.id, o.member).catch(() => false)));
    rows = rows.filter((_, i) => flags[i]);
    rows.forEach((g) => (g.member_addresses = [m]));
  }
  return rows.sort((a, b) => b.id - a.id).slice(0, o.limit || 60);
}

export async function getGroup(id: number): Promise<GroupRow | null> {
  try {
    const g = await C.social().getGroup(id);
    if (!g.active) return null;
    return groupFrom(id, g, await getGroupMembers(id));
  } catch { return null; }
}

export interface GroupPostRow {
  id: number; group_id: number; author_address: string; content: string; article_id: string | null;
  type: string; likes: number; created_at: string;
}

export async function listGroupPosts(groupId: number | null): Promise<GroupPostRow[]> {
  const g = groupId ? pad(groupId) : null;
  const [made, dels, likes] = await Promise.all([
    scan(cfg.social, [T("GroupPosted"), g]),
    scan(cfg.social, [T("GroupPostDeleted"), g]),
    scan(cfg.social, [T("GroupPostLiked"), g]),
  ]);
  const gone = new Set(dels.map((l) => Number(S.parseLog(l)!.args.postId)));
  const likeCount = new Map<number, number>();
  for (const l of likes) { const id = Number(S.parseLog(l)!.args.postId); likeCount.set(id, (likeCount.get(id) || 0) + 1); }
  const times = await blockTimes(made.map((l) => l.blockNumber));
  return made
    .map((l) => ({ l, p: S.parseLog(l)! }))
    .filter(({ p }) => !gone.has(Number(p.args.postId)))
    .map(({ l, p }) => ({
      id: Number(p.args.postId), group_id: Number(p.args.groupId), author_address: p.args.author, content: p.args.content,
      article_id: Number(p.args.articleId) ? String(p.args.articleId) : null, type: p.args.postType || "discussion",
      likes: likeCount.get(Number(p.args.postId)) || 0, created_at: new Date((times.get(l.blockNumber) || 0) * 1000).toISOString(),
    }))
    .sort((a, b) => b.id - a.id);
}

export async function createGroup(
  signer: ethers.Signer,
  g: { name: string; description?: string; type?: string; category?: string; rules?: string; tags?: string[] | string; bannerImage?: string },
) {
  const tags = Array.isArray(g.tags) ? g.tags.join(",") : g.tags || "";
  const rc = await send(C.social(signer).createGroup(g.name.trim(), g.description || "", g.category || "General", g.bannerImage || "", g.rules || "", tags, g.type === "private"));
  const ev = rc.logs.map((l) => { try { return S.parseLog(l); } catch { return null; } }).find((p) => p?.name === "GroupCreated");
  return { id: Number(ev?.args.id ?? 0), txHash: rc.hash };
}
export const joinGroup = (s: ethers.Signer, id: number) => send(C.social(s).join(id));
export const leaveGroup = (s: ethers.Signer, id: number) => send(C.social(s).leave(id));
export const removeMember = (s: ethers.Signer, id: number, who: string) => send(C.social(s).removeMember(id, who));
export const approveMember = (s: ethers.Signer, id: number, who: string) => send(C.social(s).approveMember(id, who));
export const deleteGroup = (s: ethers.Signer, id: number) => send(C.social(s).deleteGroup(id));
export const postToGroup = (s: ethers.Signer, id: number, content: string, articleId?: number | string | null, type = "discussion") =>
  send(C.social(s).post(id, content, Number(articleId) || 0, type));
export const deleteGroupPost = (s: ethers.Signer, postId: number) => send(C.social(s).deletePost(postId));
export const likeGroupPost = (s: ethers.Signer, postId: number) => send(C.social(s).likePost(postId));
export const updateGroup = (s: ethers.Signer, id: number, g: { name: string; description: string; bannerImage?: string; rules?: string; tags?: string[] }) =>
  send(C.social(s).updateGroup(id, g.name, g.description, g.bannerImage || "", g.rules || "", (g.tags || []).join(",")));

export async function joinRequests(groupId: number): Promise<string[]> {
  const logs = await scan(cfg.social, [T("JoinRequested"), pad(groupId)]);
  const users = [...new Set(logs.map((l) => lc(S.parseLog(l)!.args.user)))];
  const flags = await Promise.all(users.map((u) => C.social().hasRequested(groupId, u)));
  return users.filter((_, i) => flags[i]);
}
