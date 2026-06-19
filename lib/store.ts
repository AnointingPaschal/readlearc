/**
 * In-memory store (persists within a single Vercel function instance).
 * For true cross-browser persistence, connect Vercel KV by setting
 * KV_URL, KV_REST_API_URL, KV_REST_API_TOKEN in Vercel env vars.
 */

// ─── Types ────────────────────────────────────────────────────────
export interface Comment {
  id: string;
  articleId: string;
  authorAddress: string;
  authorName?: string;
  text: string;
  timestamp: number;
  parentId?: string;
  edited?: boolean;
}

export interface Reaction {
  emoji: string;
  label: string;
  level: 1 | 2 | 3;
  type: "positive" | "negative";
}

export const REACTIONS: Record<string, Reaction> = {
  "🔥": { emoji:"🔥", label:"Fire",        level:1, type:"positive" },
  "⚡": { emoji:"⚡", label:"Electric",    level:2, type:"positive" },
  "💎": { emoji:"💎", label:"Diamond",     level:3, type:"positive" },
  "😤": { emoji:"😤", label:"Meh",         level:1, type:"negative" },
  "🤢": { emoji:"🤢", label:"Disgusted",   level:2, type:"negative" },
  "💀": { emoji:"💀", label:"Dead",        level:3, type:"negative" },
};

export interface ArticleReactionData {
  counts: Record<string, number>;
  voters: Record<string, string>; // address → emoji
}

export interface ModerationStatus {
  status: "live" | "review" | "removed" | "featured";
  updatedAt: number;
  reason?: string;
}

// ─── Global in-memory store ────────────────────────────────────────
declare global {
  var __comments: Map<string, Comment[]>;
  var __reactions: Map<string, ArticleReactionData>;
  var __moderation: Map<string, ModerationStatus>;
  var __follows: Map<string, Set<string>>; // follower → Set<following>
  var __aiState: { key?: string; models: any[]; activeModel?: string; autoApprove: boolean; };
}

if (!global.__comments)   global.__comments   = new Map();
if (!global.__reactions)  global.__reactions  = new Map();
if (!global.__moderation) global.__moderation = new Map();
if (!global.__follows)    global.__follows    = new Map();
if (!global.__aiState)    global.__aiState    = { models:[], autoApprove:false };

// ─── Comments ──────────────────────────────────────────────────────
export function getComments(articleId: string): Comment[] {
  return global.__comments.get(articleId) || [];
}

export function addComment(comment: Comment): Comment {
  const list = getComments(comment.articleId);
  list.push(comment);
  global.__comments.set(comment.articleId, list);
  return comment;
}

export function deleteComment(articleId: string, commentId: string): boolean {
  const list = getComments(articleId).filter(c => c.id !== commentId);
  global.__comments.set(articleId, list);
  return true;
}

export function editComment(articleId: string, commentId: string, text: string): boolean {
  const list = getComments(articleId).map(c => c.id === commentId ? { ...c, text, edited:true } : c);
  global.__comments.set(articleId, list);
  return true;
}

// ─── Reactions ────────────────────────────────────────────────────
export function getReactions(articleId: string): ArticleReactionData {
  return global.__reactions.get(articleId) || { counts:{}, voters:{} };
}

export function setReaction(articleId: string, address: string, emoji: string | null): ArticleReactionData {
  const data = getReactions(articleId);
  const prev = data.voters[address];
  if (prev) { data.counts[prev] = Math.max(0, (data.counts[prev]||0) - 1); delete data.voters[address]; }
  if (emoji && emoji !== prev) { data.counts[emoji] = (data.counts[emoji]||0) + 1; data.voters[address] = emoji; }
  global.__reactions.set(articleId, data);
  return data;
}

// ─── Moderation ───────────────────────────────────────────────────
export function getModerationStatus(articleId: string): ModerationStatus {
  return global.__moderation.get(articleId) || { status:"live", updatedAt:Date.now() };
}

export function getAllHidden(): string[] {
  const hidden: string[] = [];
  for (const [id, s] of global.__moderation) { if (s.status === "removed") hidden.push(id); }
  return hidden;
}

export function getAllFeatured(): string[] {
  const featured: string[] = [];
  for (const [id, s] of global.__moderation) { if (s.status === "featured") featured.push(id); }
  return featured;
}

export function setModerationStatus(articleId: string, status: ModerationStatus["status"], reason?: string): void {
  global.__moderation.set(articleId, { status, updatedAt:Date.now(), reason });
}

export function getAllModerationStatuses(): Record<string, ModerationStatus> {
  const result: Record<string, ModerationStatus> = {};
  for (const [id, s] of global.__moderation) result[id] = s;
  return result;
}

// ─── Follows ─────────────────────────────────────────────────────
export function getFollowing(address: string): string[] {
  return Array.from(global.__follows.get(address.toLowerCase()) || []);
}

export function getFollowers(address: string): string[] {
  const result: string[] = [];
  const target = address.toLowerCase();
  for (const [follower, following] of global.__follows) { if (following.has(target)) result.push(follower); }
  return result;
}

export function toggleFollow(follower: string, target: string): boolean {
  const f = follower.toLowerCase(); const t = target.toLowerCase();
  if (!global.__follows.has(f)) global.__follows.set(f, new Set());
  const set = global.__follows.get(f)!;
  if (set.has(t)) { set.delete(t); return false; }
  else { set.add(t); return true; }
}

// ─── AI State ────────────────────────────────────────────────────
export function getAIState() { return { ...global.__aiState }; }

export function setAIState(patch: Partial<typeof global.__aiState>) {
  global.__aiState = { ...global.__aiState, ...patch };
}
