import type { ethers } from "ethers";
import { signedJson } from "@/lib/onchain/auth";

export interface BankConfig { circle: boolean; ngn: boolean; ngnConfigured: boolean; rate: number; feePct: number; minUsd: number; maxUsd: number; treasury: string; sandbox: boolean }
export interface NgBank { name: string; code: string }
export interface NgAccount { id: string; bankCode: string; bankName: string; accountName: string; last4: string; recipientCode: string; createdAt: number }
export interface Cashout { id: string; txHash: string; address: string; amountUsd: number; feeUsd: number; rate: number; ngn: number; bankName: string; accountName: string; last4: string; status: "processing" | "success" | "failed" | "reversed"; error?: string; createdAt: number }
export interface WireLink { id: string; description: string; trackingRef?: string; status?: string; holder?: string; createdAt: number }
export interface Money { amount: string; currency: string }
export interface Deposit { id: string; amount?: Money | null; fee?: Money; status: "pending" | "complete" | "failed"; errorCode?: string | null; createDate: string; source?: { type: string; name?: string }; trackingRef?: string }
export interface Withdrawal { id: string; amount: Money; toAmount?: Money; fees?: Money; status: "pending" | "complete" | "failed"; errorCode?: string | null; destination?: { type: string; name?: string }; trackingRef?: string | null; createDate: string }
export interface WireInstructions {
  trackingRef?: string; virtualAccountEnabled?: boolean;
  beneficiary?: { name?: string; address1?: string; address2?: string };
  beneficiaryBank?: { name?: string; swiftCode?: string; routingNumber?: string; accountNumber?: string; currency?: string; address?: string; city?: string; postalCode?: string; country?: string };
}

export class ApiError extends Error { constructor(m: string, public status: number) { super(m); } }

/** Wallet-signed call to a /api/bank route. Throws ApiError with the server's message. */
export async function bankCall<T = any>(signer: ethers.Signer | null, method: string, path: string, payload?: unknown): Promise<T> {
  const r = await signedJson<any>(signer, method, path, payload);
  if (!r.ok) throw new ApiError(r.data?.error || `Request failed (${r.status})`, r.status);
  return r.data as T;
}

let cfgCache: Promise<BankConfig> | null = null;
export function loadBankConfig(force = false): Promise<BankConfig> {
  if (!cfgCache || force) cfgCache = fetch("/api/bank/config").then((r) => r.json()).catch(() => ({ circle: false, ngn: false, ngnConfigured: false, rate: 0, feePct: 0, minUsd: 1, maxUsd: 1000, treasury: "", sandbox: true }));
  return cfgCache;
}

let banksCache: Promise<NgBank[]> | null = null;
export const loadNgBanks = () => (banksCache ??= fetch("/api/bank/ng/banks").then((r) => r.json()).then((d) => d.data as NgBank[]).catch(() => []));

export const fmtNgn = (n: number) => "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmtUsd = (n: number | string) => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const ago = (t: number | string) => {
  const s = Math.max(0, (Date.now() - (typeof t === "number" ? t : Date.parse(t))) / 1000);
  return s < 60 ? "just now" : s < 3600 ? `${Math.floor(s / 60)}m ago` : s < 86400 ? `${Math.floor(s / 3600)}h ago` : `${Math.floor(s / 86400)}d ago`;
};

/** Quote for a cash-out: what the user gets in NGN after the platform fee. */
export function quoteCashout(usd: number, c: Pick<BankConfig, "rate" | "feePct">) {
  const fee = +(usd * c.feePct / 100).toFixed(6);
  return { fee, ngn: Math.floor((usd - fee) * c.rate * 100) / 100 };
}

// ── address book (local to the browser) ──
export interface Contact { name: string; address: string }
const CK = "rl-contacts-v1";
export const loadContacts = (): Contact[] => { try { return JSON.parse(localStorage.getItem(CK) || "[]"); } catch { return []; } };
export const saveContacts = (c: Contact[]) => { try { localStorage.setItem(CK, JSON.stringify(c.slice(0, 100))); } catch { /* storage blocked */ } };

/** Runs Circle's device check (needed for wire-account creation) and returns the deviceId. */
export async function runDeviceCheck(signer: ethers.Signer): Promise<{ deviceId: string; sessionId: string }> {
  const t = await bankCall<{ token: string; sandbox: boolean }>(signer, "POST", "/api/bank/device-token", {});
  const { checkDevice } = await import("@circle-fin/device-checks");
  const { deviceId } = await checkDevice({ token: t.token, environment: t.sandbox ? "sandbox" : "production" });
  return { deviceId, sessionId: crypto.randomUUID() };
}
