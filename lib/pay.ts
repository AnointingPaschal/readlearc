/**
 * Readlearc Payment Engine
 * Handles USDC payments for article access.
 * 
 * Flow:
 *  1. Check USDC balance ≥ price
 *  2. If CONTRACT_ADDRESS set: approve → payToRead (atomic splits)
 *  3. Else: direct usdc.transfer(writer, price) — simpler, no approval needed
 *  4. Record in Supabase → return content
 */
import { ethers } from "ethers";
import { USDC_ADDR, USDC_ABI } from "./internal-wallet";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./auth";

export interface PayResult {
  txHash:  string;
  content: string | null;
}

export class PaymentError extends Error {
  constructor(msg: string, public code?: string) { super(msg); }
}

/** Convert any address to EIP-55 checksum (or lowercase fallback) */
export function toAddr(raw: string): string {
  try { return ethers.getAddress(raw.trim()); }
  catch { return raw.toLowerCase(); }
}

/** Get USDC balance for address (6 decimals) */
export async function getBalance(signer: ethers.Wallet): Promise<bigint> {
  const usdc = new ethers.Contract(USDC_ADDR, USDC_ABI, signer);
  return await usdc.balanceOf(signer.address);
}

/** Check if user can afford the price */
export async function canAfford(signer: ethers.Wallet, price: string): Promise<boolean> {
  const bal   = await getBalance(signer);
  const needed = ethers.parseUnits(price, 6);
  return bal >= needed;
}

/** Format USDC amount for display */
export function formatUsdc(raw: bigint): string {
  return parseFloat(ethers.formatUnits(raw, 6)).toFixed(4);
}

/**
 * Execute payment for article.
 * Uses smart contract if CONTRACT_ADDRESS env var is set,
 * otherwise direct USDC transfer to writer.
 */
export async function payForArticle(
  signer:     ethers.Wallet,
  articleId:  string,
  writerRaw:  string,
  price:      string,
): Promise<PayResult> {
  const writer  = toAddr(writerRaw);
  const priceWei = ethers.parseUnits(price, 6);
  const usdc    = new ethers.Contract(USDC_ADDR, USDC_ABI, signer);

  // ── Pre-flight: balance check ────────────────────────────────
  const balance = await getBalance(signer);
  if (balance < priceWei) {
    const have = formatUsdc(balance);
    throw new PaymentError(
      `Insufficient USDC. You have $${have} but need $${price}. ` +
      `Get test USDC at faucet.circle.com → select Arc Testnet.`,
      "INSUFFICIENT_BALANCE"
    );
  }

  // ── Route 1: Direct USDC transfer (no contract needed) ───────
  if (!CONTRACT_ADDRESS) {
    try {
      const tx = await usdc.transfer(writer, priceWei);
      const receipt = await tx.wait();
      if (!receipt || receipt.status === 0) throw new PaymentError("Transaction reverted");
      return { txHash: tx.hash, content: null };
    } catch (e: any) {
      throw translateError(e, "transfer");
    }
  }

  // ── Route 2: Smart contract (approval + payToRead) ────────────
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

  // Check current allowance — only approve if needed
  const allowance = await usdc.allowance(signer.address, CONTRACT_ADDRESS);
  if (allowance < priceWei) {
    try {
      // Approve exact amount (not unlimited)
      const approveTx = await usdc.approve(CONTRACT_ADDRESS, priceWei);
      const approveRx = await approveTx.wait();
      if (!approveRx || approveRx.status === 0) throw new PaymentError("Approval transaction reverted");
    } catch (e: any) {
      throw translateError(e, "approve");
    }
  }

  // payToRead
  try {
    const tx = await contract.payToRead(
      parseInt(articleId),
      writer,
      priceWei,
      ethers.ZeroAddress,
    );
    const receipt = await tx.wait();
    if (!receipt || receipt.status === 0) throw new PaymentError("payToRead reverted");
    return { txHash: tx.hash, content: null };
  } catch (e: any) {
    throw translateError(e, "payToRead");
  }
}

/** Translate ethers errors into user-friendly messages */
function translateError(e: any, step: string): PaymentError {
  const msg = e?.message || e?.reason || String(e);

  if (msg.includes("insufficient funds") || msg.includes("balance"))
    return new PaymentError("Insufficient USDC balance. Get test USDC from faucet.circle.com → Arc Testnet.", "INSUFFICIENT_BALANCE");

  if (msg.includes("AlreadyPaid") || msg.includes("already paid"))
    return new PaymentError("You already paid for this article.", "ALREADY_PAID");

  if (msg.includes("user rejected") || msg.includes("rejected") || e?.code === 4001)
    return new PaymentError("Transaction cancelled.", "REJECTED");

  if (msg.includes("estimateGas") || msg.includes("revert")) {
    if (step === "payToRead")
      return new PaymentError(
        "Contract call failed. The smart contract may not be deployed on Arc Testnet yet. " +
        "Remove NEXT_PUBLIC_CONTRACT_ADDRESS from Vercel env vars to use direct transfer.",
        "CONTRACT_ERROR"
      );
    return new PaymentError(`Transaction failed at ${step}: ${msg.slice(0, 120)}`, "REVERT");
  }

  if (msg.includes("network") || msg.includes("timeout") || msg.includes("connection"))
    return new PaymentError("Network error. Check your internet connection and try again.", "NETWORK");

  return new PaymentError(`Payment failed: ${msg.slice(0, 120)}`, "UNKNOWN");
}
