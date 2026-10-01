/**
 * Transaction approval — nothing is signed silently.
 *
 * Every transaction sent by the site wallet (ApprovalWallet.sendTransaction) first goes through
 * `approveTransaction`, which opens the <TxApproval/> sheet with a decoded summary and waits for the person to
 * press "Approve & Sign". Rejecting aborts the action.
 *
 * Multi-transaction jobs (uploading an article, deploying contracts, bulk publishing…) call `runBatch`, which asks
 * ONCE, describing the whole job; transactions sent inside it are then signed without further prompts until it ends.
 */
import { ethers } from "ethers";
import { cfg } from "@/lib/config";
import RolesAbi from "@/abi/Roles.json";
import ContentStoreAbi from "@/abi/ContentStore.json";
import SocialAbi from "@/abi/Social.json";
import MonetizationAbi from "@/abi/Monetization.json";
import PaymentsAbi from "@/abi/Payments.json";
import StreamPayAbi from "@/abi/StreamPay.json";
import { activity } from "@/lib/activity";

export interface ApprovalRequest {
  id: number;
  kind: "tx" | "batch";
  title: string;
  /** decoded call, e.g. post(groupId: 3, content: "Hello…") */
  action?: string;
  contract?: string;
  to?: string;
  from?: string;
  value?: bigint;
  fee?: bigint;
  detail?: string;
  /** rough number of transactions for a batch */
  count?: number;
}
type Pending = ApprovalRequest & { resolve: (ok: boolean) => void };

let seq = 0;
let queue: Pending[] = [];
const subs = new Set<(q: ApprovalRequest[]) => void>();
const emit = () => subs.forEach((s) => s(queue));

export const approvals = {
  subscribe(fn: (q: ApprovalRequest[]) => void) { subs.add(fn); fn(queue); return () => { subs.delete(fn); }; },
  respond(id: number, ok: boolean) {
    const p = queue.find((x) => x.id === id);
    if (!p) return;
    queue = queue.filter((x) => x.id !== id);
    emit();
    p.resolve(ok);
  },
};

const rejected = () => Object.assign(new Error("You rejected the transaction."), { code: "ACTION_REJECTED" });

function ask(req: Omit<ApprovalRequest, "id">): Promise<boolean> {
  if (!subs.size) return Promise.resolve(false); // no UI mounted → never sign silently
  return new Promise((resolve) => {
    queue = [...queue, { ...req, id: ++seq, resolve }];
    emit();
  });
}

// ───────── decoding ─────────
const ERC20 = ["function approve(address spender,uint256 amount)", "function transfer(address to,uint256 amount)", "function transferFrom(address from,address to,uint256 amount)"];
function known(): { name: string; address: string; iface: ethers.Interface }[] {
  const mk = (name: string, address: string, abi: unknown) => (address ? [{ name, address: address.toLowerCase(), iface: new ethers.Interface(abi as ethers.InterfaceAbi) }] : []);
  return [
    ...mk("Roles", cfg.roles, RolesAbi), ...mk("ContentStore", cfg.contentStore, ContentStoreAbi), ...mk("Social", cfg.social, SocialAbi),
    ...mk("Monetization", cfg.monetization, MonetizationAbi), ...mk("Payments", cfg.payments, PaymentsAbi), ...mk("StreamPay", cfg.streamPay, StreamPayAbi),
    ...mk("USDC", cfg.usdc, ERC20),
  ];
}

function fmtArg(v: unknown): string {
  if (typeof v === "bigint") return v.toString();
  if (typeof v === "string") {
    if (/^0x[0-9a-fA-F]{80,}$/.test(v)) return `0x… (${(v.length - 2) / 2} bytes)`;
    return v.length > 48 ? `"${v.slice(0, 44).replace(/\s+/g, " ")}…" (${v.length} chars)` : v.startsWith("0x") ? v : JSON.stringify(v);
  }
  if (Array.isArray(v)) return v.length > 3 ? `[${v.length} items]` : `[${v.map(fmtArg).join(", ")}]`;
  if (v && typeof v === "object") return "{…}";
  return String(v);
}

function decode(to: string | null, data: string, value: bigint): { contract?: string; action: string } {
  if (!to) return { action: `Deploy a new contract (${Math.max(0, (data.length - 2) / 2).toLocaleString()} bytes of code)` };
  const k = known().find((c) => c.address === to.toLowerCase());
  if (k && data && data !== "0x") {
    try {
      const p = k.iface.parseTransaction({ data, value });
      if (p) return { contract: k.name, action: `${p.name}(${p.fragment.inputs.map((inp, i) => `${inp.name || "arg" + i}: ${fmtArg(p.args[i])}`).join(", ")})` };
    } catch { /* unknown selector */ }
  }
  return { contract: k?.name, action: !data || data === "0x" ? "Send native USDC" : `Contract call ${data.slice(0, 10)}…` };
}

// ───────── single transaction ─────────
let batchDepth = 0;

export async function approveTransaction(tx: ethers.TransactionRequest, wallet: ethers.Wallet): Promise<void> {
  if (batchDepth > 0) return; // covered by an approved batch
  const to = tx.to ? await ethers.resolveAddress(tx.to) : null;
  const data = (tx.data as string) || "0x";
  const value = tx.value != null ? BigInt(tx.value) : 0n;
  const d = decode(to, data, value);

  let fee: bigint | undefined;
  try {
    const p = wallet.provider!;
    const gas = tx.gasLimit != null ? BigInt(tx.gasLimit) : await p.estimateGas({ from: wallet.address, to: to ?? undefined, data, value });
    const fd = await p.getFeeData();
    const price = fd.maxFeePerGas ?? fd.gasPrice;
    if (price) fee = gas * price;
  } catch { /* fee unknown */ }

  const running = (activityLabel() || "").trim();
  const ok = await ask({ kind: "tx", title: running || (d.contract ? `${d.contract} transaction` : "Transaction"), action: d.action, contract: d.contract, to: to ?? undefined, from: wallet.address, value, fee });
  if (!ok) throw rejected();
}

function activityLabel(): string | undefined { return activity.current(); }

// ───────── batch (one approval for a whole multi-transaction job) ─────────
export async function runBatch<T>(opts: { title: string; detail?: string; count?: number; from?: string }, fn: () => Promise<T>): Promise<T> {
  if (batchDepth > 0) return fn();
  const ok = await ask({ kind: "batch", title: opts.title, detail: opts.detail, count: opts.count, from: opts.from });
  if (!ok) throw rejected();
  batchDepth++;
  try { return await fn(); } finally { batchDepth--; }
}
