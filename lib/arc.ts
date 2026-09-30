/**
 * Arc Mainnet configuration — single source of truth for chain constants.
 * Import from here rather than hardcoding anywhere else.
 */
import { ethers } from "ethers";

// ── Network ───────────────────────────────────────────────────────
export const ARC_CHAIN_ID   = 5042;
export const ARC_RPC_URL    = process.env.NEXT_PUBLIC_RPC_URL    || "https://rpc.mainnet.arc.io";
export const ARC_EXPLORER   = process.env.NEXT_PUBLIC_EXPLORER_URL || "https://explorer.arc.io";

// ── Token addresses (Arc Mainnet) ─────────────────────────────────
// USDC: fixed predeploy — same address on every Arc network
export const USDC_ADDRESS   = "0x3600000000000000000000000000000000000000";
// EURC on Arc Mainnet
export const EURC_ADDRESS   = "0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1";

// USDC on Arc uses 6 decimals (ERC-20 view)
export const USDC_DECIMALS  = 6;
// Native gas view uses 18 decimals — only for msg.value / openSession deposits
export const NATIVE_DECIMALS = 18;

// ── Contract addresses (set via env after deploy) ─────────────────
export const READLEARC_ADDRESS      = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS      || "";
export const STREAM_PAY_ADDRESS     = process.env.NEXT_PUBLIC_STREAM_PAY_ADDRESS    || "";
export const CONTENT_REG_ADDRESS    = process.env.NEXT_PUBLIC_CONTENT_REG_ADDRESS   || "";
export const CREATOR_TIP_ADDRESS    = process.env.NEXT_PUBLIC_CREATOR_TIP_ADDRESS   || "";
export const TREASURY_ADDRESS       = process.env.NEXT_PUBLIC_TREASURY_ADDRESS      || "";

// ── Provider factory ──────────────────────────────────────────────
export function getProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(ARC_RPC_URL, {
    chainId: ARC_CHAIN_ID,
    name:    "arc",
  });
}

// ── USDC helpers ──────────────────────────────────────────────────
export function parseUsdc(amount: string | number): bigint {
  return ethers.parseUnits(String(amount), USDC_DECIMALS);
}

export function formatUsdc(raw: bigint): string {
  return parseFloat(ethers.formatUnits(raw, USDC_DECIMALS)).toFixed(4);
}

/** Convert native (18-dec) to USDC display (6-dec) */
export function nativeToUsdc(nativeWei: bigint): string {
  return parseFloat(ethers.formatUnits(nativeWei, NATIVE_DECIMALS)).toFixed(6);
}

/** Convert per-second rate from USDC micro (6-dec) to native wei (18-dec) for openSession */
export function usdcRateToNative(usdcPerSec: string): bigint {
  // e.g. "0.0001" USDC/s → native wei per second
  const usdcWei = ethers.parseUnits(usdcPerSec, USDC_DECIMALS);
  // Scale: 1 USDC (6 dec) = 1e12 native wei (18 dec)
  return usdcWei * BigInt(1e12);
}

/** Deposit amount: ratePerSecNative * durationSeconds */
export function calcDeposit(usdcPerSec: string, durationSeconds: number): bigint {
  const rate = usdcRateToNative(usdcPerSec);
  return rate * BigInt(durationSeconds);
}

// ── Explorer URL builders ─────────────────────────────────────────
export function txUrl(hash: string): string {
  return `${ARC_EXPLORER}/tx/${hash}`;
}

export function addressUrl(addr: string): string {
  return `${ARC_EXPLORER}/address/${addr}`;
}
