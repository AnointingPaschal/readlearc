/** Monetization rules, payments (unlock / subscribe / tip), earnings and roles. */
import { ethers } from "ethers";
import { C, lc, send, ensureAllowance, parseUsdc, fmtUsdc } from "@/lib/chain";
import { cfg } from "@/lib/config";
import { IFACES, scan, topic, pad, blockTimes } from "@/lib/onchain/logs";

const P = IFACES.pay;
const M = IFACES.mon;

// ═══════════════ Monetization ═══════════════
export const MON_STATUS = ["none", "pending", "approved", "rejected", "blocked"] as const;
export const MON_REASON = ["not monetized", "blocked by admin", "approved by admin (manual)", "enabled for everyone", "meets auto requirements"] as const;

export interface MonRules { all: boolean; auto: boolean; minFollowers: number; minPosts: number; minAccountDays: number }
export interface MonState {
  monetized: boolean;
  reason: number;
  status: number;
  rules: MonRules;
  progress: { followers: number; followersOk: boolean; posts: number; postsOk: boolean; ageDays: number; ageOk: boolean };
  plan: { monthly: string; yearly: string; enabled: boolean };
}

export async function getRules(): Promise<MonRules> {
  const r = await C.mon().rules();
  return { all: r[0], auto: r[1], minFollowers: Number(r[2]), minPosts: Number(r[3]), minAccountDays: Number(r[4]) };
}

export async function monetizationState(addr: string): Promise<MonState> {
  const mon = C.mon();
  const [monetized, reason, status, rules, prog, followers, posts, created, plan] = await Promise.all([
    mon.isMonetized(addr), mon.reason(addr), mon.status(addr), getRules(), mon.autoProgress(addr),
    C.social().followerCount(addr), C.store().approvedCount(addr), C.social().profileCreatedAt(addr), mon.planOf(addr),
  ]);
  const ageDays = Number(created) ? Math.floor((Date.now() / 1000 - Number(created)) / 86400) : 0;
  return {
    monetized, reason: Number(reason), status: Number(status), rules,
    progress: { followers: Number(followers), followersOk: prog[0], posts: Number(posts), postsOk: prog[1], ageDays, ageOk: prog[2] },
    plan: { monthly: fmtUsdc(plan.monthly, 2), yearly: fmtUsdc(plan.yearly, 2), enabled: plan.enabled },
  };
}

export const applyForMonetization = (s: ethers.Signer, note = "") => send(C.mon(s).apply_(note));
export const savePlan = (s: ethers.Signer, monthly: string, yearly: string, enabled: boolean) =>
  send(C.mon(s).setPlan(parseUsdc(monthly || "0"), parseUsdc(yearly || "0"), enabled));

// admin
export const adminSetAll = (s: ethers.Signer, on: boolean) => send(C.mon(s).setEnabledForAll(on));
export const adminSetAuto = (s: ethers.Signer, r: Omit<MonRules, "all">) => send(C.mon(s).setAutoRules(r.auto, r.minFollowers, r.minPosts, r.minAccountDays));
export const adminSetCreator = (s: ethers.Signer, who: string[], status: number) =>
  who.length === 1 ? send(C.mon(s).setStatus(who[0], status)) : send(C.mon(s).setStatusBatch(who, status));

export interface CreatorMon { address: string; status: number; note?: string; at: number }
/** Everyone the admin has touched or who applied, with their *current* status. */
export async function listCreatorStatuses(): Promise<CreatorMon[]> {
  const [changes, applied] = await Promise.all([
    scan(cfg.monetization, [topic(M, "StatusChanged")]),
    scan(cfg.monetization, [topic(M, "Applied")]),
  ]);
  const notes = new Map<string, string>();
  for (const l of applied) { const p = M.parseLog(l)!; notes.set(lc(p.args.creator), p.args.note); }
  const last = new Map<string, number>();
  for (const l of changes) { const p = M.parseLog(l)!; last.set(lc(p.args.creator), l.blockNumber); }
  const addrs = [...last.keys()];
  const statuses = await Promise.all(addrs.map((a) => C.mon().status(a)));
  const times = await blockTimes([...last.values()]);
  return addrs.map((a, i) => ({ address: a, status: Number(statuses[i]), note: notes.get(a), at: times.get(last.get(a)!) || 0 }));
}

// ═══════════════ Payments ═══════════════
export async function payForArticle(signer: ethers.Signer, id: number, referrer?: string): Promise<{ txHash: string }> {
  const me = await signer.getAddress();
  const { price } = await C.store().core(id).then((r: ethers.Result) => ({ price: BigInt(r.price) }));
  const bal: bigint = await C.usdc().balanceOf(me);
  if (bal < price) throw new Error(`Insufficient USDC. You have $${fmtUsdc(bal)} but need $${fmtUsdc(price)}. Get testnet USDC at ${cfg.faucetUrl}`);
  await ensureAllowance(signer, cfg.payments, price);
  const rc = await send(C.pay(signer).payToRead(id, referrer && referrer !== me ? referrer : ethers.ZeroAddress));
  return { txHash: rc.hash };
}

export async function subscribeTo(signer: ethers.Signer, creator: string, plan: 0 | 1): Promise<{ txHash: string; expiry: number }> {
  const p = await C.mon().planOf(creator);
  const price = BigInt(plan === 0 ? p.monthly : p.yearly);
  const me = await signer.getAddress();
  const bal: bigint = await C.usdc().balanceOf(me);
  if (bal < price) throw new Error(`Insufficient USDC. You have $${fmtUsdc(bal)} but need $${fmtUsdc(price)}.`);
  await ensureAllowance(signer, cfg.payments, price);
  const rc = await send(C.pay(signer).subscribe(creator, plan));
  const expiry = Number(await C.pay().subscriptionExpiry(creator, me));
  return { txHash: rc.hash, expiry };
}

export async function subscriptionInfo(creator: string, subscriber?: string) {
  const plan = await C.mon().planOf(creator);
  const monetized: boolean = await C.mon().isMonetized(creator);
  let expiry = 0;
  if (subscriber) expiry = Number(await C.pay().subscriptionExpiry(creator, subscriber));
  return {
    config: {
      monthly_price_usdc: fmtUsdc(plan.monthly, 6), yearly_price_usdc: fmtUsdc(plan.yearly, 6),
      enabled: plan.enabled && monetized && (BigInt(plan.monthly) > 0n || BigInt(plan.yearly) > 0n),
    },
    subscribed: expiry * 1000 > Date.now(),
    expiry: expiry ? new Date(expiry * 1000).toISOString() : null,
  };
}

export async function sendTip(signer: ethers.Signer, creator: string, amountUsdc: string, contentId = 0): Promise<{ txHash: string }> {
  const amt = parseUsdc(amountUsdc);
  const me = await signer.getAddress();
  const bal: bigint = await C.usdc().balanceOf(me);
  if (bal < amt) throw new Error(`Insufficient USDC. You have $${fmtUsdc(bal)}.`);
  await ensureAllowance(signer, cfg.payments, amt);
  const rc = await send(C.pay(signer).tip(creator, amt, contentId));
  return { txHash: rc.hash };
}

// ═══════════════ Earnings ═══════════════
export interface EarningRow { type: "read" | "subscription" | "tip" | "video"; amount: number; gross: number; contentId?: number; counterparty: string; hash: string; block: number; at?: number }

/** Everything a creator has received on-chain (article unlocks, subscriptions, tips, video seconds). */
export async function creatorEarnings(creator: string): Promise<EarningRow[]> {
  const c = pad(creator);
  const [reads, subs, tips, streams] = await Promise.all([
    scan(cfg.payments, [topic(P, "ArticlePaid"), null, null, c]),
    scan(cfg.payments, [topic(P, "Subscribed"), c]),
    scan(cfg.payments, [topic(P, "Tipped"), null, c]),
    cfg.streamPay ? scan(cfg.streamPay, [topic(IFACES.stream, "SessionClosed"), null, c]) : Promise.resolve([] as ethers.Log[]),
  ]);
  const u = (v: bigint) => Number(v) / 1e6;
  const rows: EarningRow[] = [];
  for (const l of reads) { const p = P.parseLog(l)!; rows.push({ type: "read", amount: u(p.args.writerShare), gross: u(p.args.amount), contentId: Number(p.args.contentId), counterparty: p.args.reader, hash: l.transactionHash, block: l.blockNumber }); }
  for (const l of subs) { const p = P.parseLog(l)!; rows.push({ type: "subscription", amount: u(p.args.creatorShare), gross: u(p.args.amount), counterparty: p.args.subscriber, hash: l.transactionHash, block: l.blockNumber }); }
  for (const l of tips) { const p = P.parseLog(l)!; rows.push({ type: "tip", amount: u(p.args.creatorShare), gross: u(p.args.amount), contentId: Number(p.args.contentId) || undefined, counterparty: p.args.from, hash: l.transactionHash, block: l.blockNumber }); }
  for (const l of streams) {
    const p = IFACES.stream.parseLog(l)!;
    rows.push({ type: "video", amount: Number(p.args.creatorAmount) / 1e18, gross: Number(p.args.creatorAmount + p.args.platformAmount) / 1e18, counterparty: "", hash: l.transactionHash, block: l.blockNumber });
  }
  const times = await blockTimes(rows.map((r) => r.block));
  rows.forEach((r) => (r.at = times.get(r.block)));
  return rows.sort((a, b) => b.block - a.block);
}

/** What a reader has paid (article unlocks, subscriptions, tips). */
export async function readerSpending(reader: string): Promise<EarningRow[]> {
  const r = pad(reader);
  const [reads, subs, tips] = await Promise.all([
    scan(cfg.payments, [topic(P, "ArticlePaid"), null, r]),
    scan(cfg.payments, [topic(P, "Subscribed"), null, r]),
    scan(cfg.payments, [topic(P, "Tipped"), r]),
  ]);
  const u = (v: bigint) => Number(v) / 1e6;
  const rows: EarningRow[] = [];
  for (const l of reads) { const p = P.parseLog(l)!; rows.push({ type: "read", amount: u(p.args.amount), gross: u(p.args.amount), contentId: Number(p.args.contentId), counterparty: p.args.writer, hash: l.transactionHash, block: l.blockNumber }); }
  for (const l of subs) { const p = P.parseLog(l)!; rows.push({ type: "subscription", amount: u(p.args.amount), gross: u(p.args.amount), counterparty: p.args.creator, hash: l.transactionHash, block: l.blockNumber }); }
  for (const l of tips) { const p = P.parseLog(l)!; rows.push({ type: "tip", amount: u(p.args.amount), gross: u(p.args.amount), contentId: Number(p.args.contentId) || undefined, counterparty: p.args.creator, hash: l.transactionHash, block: l.blockNumber }); }
  const times = await blockTimes(rows.map((x) => x.block));
  rows.forEach((x) => (x.at = times.get(x.block)));
  return rows.sort((a, b) => b.block - a.block);
}

/** Platform-wide paid events for the admin dashboards. */
export async function allPayments(): Promise<EarningRow[]> {
  const [reads, subs, tips] = await Promise.all([
    scan(cfg.payments, [topic(P, "ArticlePaid")]),
    scan(cfg.payments, [topic(P, "Subscribed")]),
    scan(cfg.payments, [topic(P, "Tipped")]),
  ]);
  const u = (v: bigint) => Number(v) / 1e6;
  const rows: EarningRow[] = [];
  for (const l of reads) { const p = P.parseLog(l)!; rows.push({ type: "read", amount: u(p.args.writerShare), gross: u(p.args.amount), contentId: Number(p.args.contentId), counterparty: p.args.writer, hash: l.transactionHash, block: l.blockNumber }); }
  for (const l of subs) { const p = P.parseLog(l)!; rows.push({ type: "subscription", amount: u(p.args.creatorShare), gross: u(p.args.amount), counterparty: p.args.creator, hash: l.transactionHash, block: l.blockNumber }); }
  for (const l of tips) { const p = P.parseLog(l)!; rows.push({ type: "tip", amount: u(p.args.creatorShare), gross: u(p.args.amount), counterparty: p.args.creator, hash: l.transactionHash, block: l.blockNumber }); }
  return rows.sort((a, b) => b.block - a.block);
}

// ═══════════════ Roles ═══════════════
export const ROLE_NAMES = ["User", "Moderator", "Admin", "Super Admin"];
export async function roleOf(addr: string): Promise<number> {
  try { return Number(await C.roles().roleOf(addr)); } catch { return 0; }
}
export async function listRoles(): Promise<{ walletAddress: string; role: number; roleName: string }[]> {
  const logs = await scan(cfg.roles, [topic(new ethers.Interface(["event RoleSet(address indexed user, uint8 role)"]), "RoleSet")]);
  const addrs = [...new Set(logs.map((l) => lc(ethers.getAddress("0x" + l.topics[1].slice(26)))))];
  const owner: string = await C.roles().owner();
  if (!addrs.includes(lc(owner))) addrs.push(lc(owner));
  const roles = await Promise.all(addrs.map((a) => roleOf(a)));
  return addrs.map((a, i) => ({ walletAddress: a, role: roles[i], roleName: ROLE_NAMES[roles[i]] })).filter((r) => r.role > 0).sort((a, b) => b.role - a.role);
}
export const setRole = (s: ethers.Signer, who: string, role: number) => send(C.roles(s).setRole(who, role));

// ═══════════════ Wallet history ═══════════════
const LABEL: Record<EarningRow["type"], string> = { read: "Article", subscription: "Subscription", tip: "Tip", video: "Video" };
/** What this wallet earned and spent through Readlearc, straight from contract events. */
export async function fetchWalletHistory(address: string) {
  if (!address || !cfg.payments) return [];
  const [earned, spent] = await Promise.all([creatorEarnings(address).catch(() => []), readerSpending(address).catch(() => [])]);
  const cards = new Map((await import("@/lib/onchain/content").then((m) => m.loadCards())).map((c) => [c.id, c.title]));
  const title = (r: EarningRow) => (r.contentId ? `“${(cards.get(r.contentId) || `#${r.contentId}`).slice(0, 40)}”` : "");
  const rows = [
    ...earned.map((r) => ({ type: "earn", label: `Earned — ${LABEL[r.type]} ${title(r)}`.trim(), amount: r.amount, hash: r.hash, blockNumber: r.block })),
    ...spent.map((r) => ({ type: "read", label: `${r.type === "read" ? "Read" : r.type === "tip" ? "Tipped" : "Subscribed"} ${title(r)}`.trim(), amount: -r.amount, hash: r.hash, blockNumber: r.block })),
  ];
  return rows.sort((a, b) => b.blockNumber - a.blockNumber);
}
