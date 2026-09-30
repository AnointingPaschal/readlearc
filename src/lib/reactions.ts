export interface Comment {
  id: string; articleId: string; authorAddress: string; authorName?: string; text: string;
  timestamp: number; parentId?: string | null; edited?: boolean;
}
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
