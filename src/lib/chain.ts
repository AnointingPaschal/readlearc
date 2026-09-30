/**
 * Chain access: provider, typed contract factories and small helpers.
 * All addresses come from lib/config (KV-backed, admin editable).
 */
import { ethers } from "ethers";
import { cfg, isConfigured, txUrl as _txUrl, addressUrl as _addressUrl } from "@/lib/config";
import RolesAbi from "@/abi/Roles.json";
import ContentStoreAbi from "@/abi/ContentStore.json";
import SocialAbi from "@/abi/Social.json";
import MonetizationAbi from "@/abi/Monetization.json";
import PaymentsAbi from "@/abi/Payments.json";
import StreamPayAbi from "@/abi/StreamPay.json";

export { cfg };
export const IS_CONFIGURED = isConfigured();
export const EXPLORER_URL = cfg.explorerUrl;
export const USDC_ADDRESS = cfg.usdc;
export const ARC_CHAIN_ID = cfg.chainId;
export const txUrl = _txUrl;
export const addressUrl = _addressUrl;

export const USDC_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
];

export const USDC_DECIMALS = 6;
export const parseUsdc = (v: string | number) => ethers.parseUnits(String(v), USDC_DECIMALS);
export const fmtUsdc = (v: bigint, dp = 4) => parseFloat(ethers.formatUnits(v, USDC_DECIMALS)).toFixed(dp);
/** Native (18-dec) view of USDC used for msg.value deposits (StreamPay). 1 USDC(6) = 1e12 native wei. */
export const usdcRateToNative = (usdcPerSec: string | number) => parseUsdc(usdcPerSec) * 10n ** 12n;
export const nativeToUsdc = (n: bigint) => parseFloat(ethers.formatUnits(n, 18)).toFixed(6);

let _provider: ethers.JsonRpcProvider | null = null;
export function readProvider(): ethers.JsonRpcProvider {
  if (!_provider) {
    _provider = new ethers.JsonRpcProvider(cfg.rpcUrl, { chainId: cfg.chainId, name: cfg.chainName }, { staticNetwork: true, batchMaxCount: 20 });
  }
  return _provider;
}
export const getProvider = readProvider;

type Runner = ethers.ContractRunner | undefined;
const mk = (addr: string, abi: ethers.InterfaceAbi, r?: Runner) => new ethers.Contract(addr, abi, r ?? readProvider());

export const C = {
  roles: (r?: Runner) => mk(cfg.roles, RolesAbi as ethers.InterfaceAbi, r),
  store: (r?: Runner) => mk(cfg.contentStore, ContentStoreAbi as ethers.InterfaceAbi, r),
  social: (r?: Runner) => mk(cfg.social, SocialAbi as ethers.InterfaceAbi, r),
  mon: (r?: Runner) => mk(cfg.monetization, MonetizationAbi as ethers.InterfaceAbi, r),
  pay: (r?: Runner) => mk(cfg.payments, PaymentsAbi as ethers.InterfaceAbi, r),
  stream: (r?: Runner) => mk(cfg.streamPay, StreamPayAbi as ethers.InterfaceAbi, r),
  usdc: (r?: Runner) => mk(cfg.usdc, USDC_ABI, r),
};

export const ABIS = {
  roles: RolesAbi, store: ContentStoreAbi, social: SocialAbi, mon: MonetizationAbi, pay: PaymentsAbi, stream: StreamPayAbi,
};

export const shortAddr = (a: string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "Unknown");
export const lc = (a?: string | null) => (a || "").toLowerCase();

/** Revert reasons → human text. */
export function explainError(e: unknown, fallback = "Transaction failed"): string {
  const err = e as { code?: string | number; shortMessage?: string; reason?: string; message?: string; revert?: { name?: string } };
  const name = err?.revert?.name || "";
  const map: Record<string, string> = {
    NotMonetized: "Monetization isn’t enabled for this account yet. Apply from your dashboard or ask an admin.",
    NotForSale: "This item isn’t for sale (it’s free, unpublished, or the creator isn’t monetized).",
    AlreadyUnlocked: "You already have access to this.",
    NoPlan: "This creator hasn’t enabled subscriptions.",
    UsernameTaken: "That username is taken.",
    SlugTaken: "That video address is already taken.",
    NotAuthor: "Only the author can do that.",
    NotMod: "Moderator access required.",
    NotAdmin: "Admin access required.",
    NotMember: "You need to join this community first.",
    AlreadyDone: "Already done.",
    BadInput: "Invalid input.",
  };
  if (name && map[name]) return map[name];
  const msg = err?.shortMessage || err?.reason || err?.message || "";
  if (err?.code === "ACTION_REJECTED" || err?.code === 4001 || /rejected/i.test(msg)) return "Transaction cancelled.";
  if (/insufficient funds|exceeds balance|transfer amount exceeds/i.test(msg)) {
    return `Insufficient USDC balance. Get testnet USDC at ${cfg.faucetUrl}`;
  }
  if (/network|timeout|ECONN|fetch/i.test(msg)) return "Network error — check your connection and try again.";
  return msg ? `${fallback}: ${msg.slice(0, 160)}` : fallback;
}

/** Send a tx and wait for it, surfacing decoded errors. */
export async function send(tx: Promise<ethers.ContractTransactionResponse>): Promise<ethers.ContractTransactionReceipt> {
  const t = await tx;
  const rc = await t.wait();
  if (!rc || rc.status === 0) throw new Error("Transaction reverted");
  return rc;
}

/** Ensure `spender` can pull `amount` USDC from the signer; approves the exact shortfall. */
export async function ensureAllowance(signer: ethers.Signer, spender: string, amount: bigint) {
  const usdc = C.usdc(signer);
  const owner = await signer.getAddress();
  const cur: bigint = await usdc.allowance(owner, spender);
  if (cur < amount) await send(usdc.approve(spender, amount));
}

export async function usdcBalance(address: string): Promise<bigint> {
  try { return await C.usdc().balanceOf(address); } catch { return 0n; }
}
