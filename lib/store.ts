/**
 * In-memory store — persists within a single Vercel function instance.
 * All social data: comments, reactions, follows, AI state.
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

// Icon-based reactions (no emoji)
export type ReactionKey = "flame" | "zap" | "gem" | "thumbsdown" | "cloudrain" | "xoctagon";

export interface Reaction {
  key:   ReactionKey;
  label: string;
  level: 1 | 2 | 3;
  type:  "positive" | "negative";
  color: string;
}

export const REACTIONS: Record<ReactionKey, Reaction> = {
  flame:     { key:"flame",     label:"Fire",          level:1, type:"positive", color:"#ea580c" },
  zap:       { key:"zap",       label:"Electric",      level:2, type:"positive", color:"#ca8a04" },
  gem:       { key:"gem",       label:"Gem",           level:3, type:"positive", color:"#7c3aed" },
  thumbsdown:{ key:"thumbsdown",label:"Not for me",    level:1, type:"negative", color:"#6b7280" },
  cloudrain: { key:"cloudrain", label:"Disappointing", level:2, type:"negative", color:"#0284c7" },
  xoctagon:  { key:"xoctagon",  label:"No way",        level:3, type:"negative", color:"#dc2626" },
};

export const POSITIVE_REACTIONS = (Object.values(REACTIONS) as Reaction[]).filter(r => r.type === "positive");
export const NEGATIVE_REACTIONS = (Object.values(REACTIONS) as Reaction[]).filter(r => r.type === "negative");

export interface ArticleReactionData {
  counts:  Record<string, number>;
  voters:  Record<string, ReactionKey>;
}

export interface ModerationStatus {
  status:    "live" | "review" | "removed" | "featured";
  updatedAt: number;
  reason?:   string;
}

// ─── Global in-memory store ────────────────────────────────────────
declare global {
  var __comments:   Map<string, Comment[]>;
  var __reactions:  Map<string, ArticleReactionData>;
  var __moderation: Map<string, ModerationStatus>;
  var __follows:    Map<string, Set<string>>;
  var __aiState:    { key?: string; models: any[]; activeModel?: string; autoApprove: boolean };
}

if (!global.__comments)   global.__comments   = new Map();
if (!global.__reactions)  global.__reactions  = new Map();
if (!global.__moderation) global.__moderation = new Map();
if (!global.__follows)    global.__follows    = new Map();
if (!global.__aiState)    global.__aiState    = { models: [], autoApprove: false };

// ─── Comments ─────────────────────────────────────────────────────
export function getComments(articleId: string): Comment[] {
  return global.__comments.get(articleId) || [];
}
export function addComment(c: Comment): Comment {
  const list = getComments(c.articleId);
  list.push(c);
  global.__comments.set(c.articleId, list);
  return c;
}
export function deleteComment(articleId: string, commentId: string): void {
  global.__comments.set(articleId, getComments(articleId).filter(c => c.id !== commentId));
}
export function editComment(articleId: string, commentId: string, text: string): void {
  global.__comments.set(articleId, getComments(articleId).map(c => c.id === commentId ? { ...c, text, edited: true } : c));
}

// ─── Reactions ────────────────────────────────────────────────────
export function getReactions(articleId: string): ArticleReactionData {
  return global.__reactions.get(articleId) || { counts: {}, voters: {} };
}
export function setReaction(articleId: string, address: string, key: ReactionKey | null): ArticleReactionData {
  const data = getReactions(articleId);
  const prev = data.voters[address];
  if (prev) { data.counts[prev] = Math.max(0, (data.counts[prev] || 0) - 1); delete data.voters[address]; }
  if (key && key !== prev) { data.counts[key] = (data.counts[key] || 0) + 1; data.voters[address] = key; }
  global.__reactions.set(articleId, data);
  return data;
}

// ─── Moderation ───────────────────────────────────────────────────
export function getModerationStatus(articleId: string): ModerationStatus {
  return global.__moderation.get(articleId) || { status: "live", updatedAt: Date.now() };
}
export function setModerationStatus(articleId: string, status: ModerationStatus["status"], reason?: string): void {
  global.__moderation.set(articleId, { status, updatedAt: Date.now(), reason });
}
export function getAllHidden(): string[] {
  return [...global.__moderation.entries()].filter(([,s]) => s.status === "removed").map(([id]) => id);
}
export function getAllFeatured(): string[] {
  return [...global.__moderation.entries()].filter(([,s]) => s.status === "featured").map(([id]) => id);
}
export function getAllModerationStatuses(): Record<string, ModerationStatus> {
  const r: Record<string, ModerationStatus> = {};
  for (const [id, s] of global.__moderation) r[id] = s;
  return r;
}

// ─── Follows ─────────────────────────────────────────────────────
export function getFollowing(address: string): string[] {
  return [...(global.__follows.get(address.toLowerCase()) || [])];
}
export function getFollowers(address: string): string[] {
  const t = address.toLowerCase();
  return [...global.__follows.entries()].filter(([,s]) => s.has(t)).map(([f]) => f);
}
export function toggleFollow(follower: string, target: string): boolean {
  const f = follower.toLowerCase(); const t = target.toLowerCase();
  if (!global.__follows.has(f)) global.__follows.set(f, new Set());
  const set = global.__follows.get(f)!;
  if (set.has(t)) { set.delete(t); return false; }
  set.add(t); return true;
}

// ─── AI State ────────────────────────────────────────────────────
export function getAIState() { return { ...global.__aiState }; }
export function setAIState(patch: Partial<typeof global.__aiState>) {
  global.__aiState = { ...global.__aiState, ...patch };
}
