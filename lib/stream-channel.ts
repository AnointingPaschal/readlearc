/**
 * StreamPay channel helpers — voucher signing and session key management.
 * Used by the frontend video player and the backend heartbeat verifier.
 */
import { ethers } from "ethers";
import { ARC_CHAIN_ID, STREAM_PAY_ADDRESS, usdcRateToNative } from "./arc";

export const DOMAIN_TAG = "READLEARC_STREAM";

// ── Types ─────────────────────────────────────────────────────────

export interface SessionKey {
  privateKey: string;
  publicAddress: string;
}

export interface VoucherPayload {
  sessionId:   string;  // bytes32 hex
  amountOwed:  bigint;  // native USDC (18 dec)
  secondsWatched: number;
}

export interface SignedVoucher extends VoucherPayload {
  signature: string;
}

// ── Session key ───────────────────────────────────────────────────

/** Generate a fresh throwaway key pair for this streaming session */
export function generateSessionKey(): SessionKey {
  const wallet = ethers.Wallet.createRandom();
  return {
    privateKey:    wallet.privateKey,
    publicAddress: wallet.address,
  };
}

// ── Voucher digest ────────────────────────────────────────────────

/**
 * Construct the voucher digest — matches the Solidity:
 * keccak256(abi.encodePacked(DOMAIN_TAG, chainId, contract, sessionId, amountOwed))
 * then eth_sign wrapped.
 */
export function voucherDigest(sessionId: string, amountOwed: bigint): Uint8Array {
  const domainHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["bytes32", "uint256", "address", "bytes32", "uint256"],
      [
        ethers.id(DOMAIN_TAG),
        BigInt(ARC_CHAIN_ID),
        STREAM_PAY_ADDRESS,
        sessionId,
        amountOwed,
      ]
    )
  );
  // Matches Solidity's keccak256(abi.encodePacked(...)) — use solidityPackedKeccak256
  const packed = ethers.solidityPackedKeccak256(
    ["string", "uint256", "address", "bytes32", "uint256"],
    [DOMAIN_TAG, ARC_CHAIN_ID, STREAM_PAY_ADDRESS, sessionId, amountOwed]
  );
  return ethers.getBytes(packed);
}

// ── Sign voucher (client-side, sessionKey signs) ──────────────────

export async function signVoucher(
  sessionKeyPriv: string,
  sessionId:      string,
  amountOwed:     bigint,
  secondsWatched: number,
): Promise<SignedVoucher> {
  const wallet  = new ethers.Wallet(sessionKeyPriv);
  const digest  = voucherDigest(sessionId, amountOwed);
  // eth_sign: prefixes "\x19Ethereum Signed Message:\n32" + digest
  const sig     = await wallet.signMessage(digest);
  return { sessionId, amountOwed, secondsWatched, signature: sig };
}

// ── Verify voucher (server-side) ──────────────────────────────────

export function verifyVoucher(
  voucher:       SignedVoucher,
  expectedKey:   string,
  lastAmountOwed: bigint,
  deposit:       bigint,
): { ok: boolean; reason?: string } {
  // Monotonically increasing check
  if (voucher.amountOwed < lastAmountOwed) {
    return { ok: false, reason: "amountOwed must be monotonically increasing" };
  }
  // Cannot exceed deposit
  if (voucher.amountOwed > deposit) {
    return { ok: false, reason: "amountOwed exceeds deposit" };
  }
  // Signature check
  try {
    const digest    = voucherDigest(voucher.sessionId, voucher.amountOwed);
    const recovered = ethers.recoverAddress(
      ethers.hashMessage(digest),
      voucher.signature,
    );
    if (recovered.toLowerCase() !== expectedKey.toLowerCase()) {
      return { ok: false, reason: "signature does not match sessionKey" };
    }
  } catch {
    return { ok: false, reason: "invalid signature" };
  }
  return { ok: true };
}

// ── Amount helpers ────────────────────────────────────────────────

/**
 * Calculate amountOwed for N seconds at a given per-second rate.
 * Both ratePerSec and result are in native USDC (18 dec).
 */
export function calcAmountOwed(ratePerSecNative: bigint, secondsWatched: number): bigint {
  return ratePerSecNative * BigInt(secondsWatched);
}

/**
 * Convert a USDC-denominated per-second price (e.g. "0.0001")
 * to the native wei rate needed for openSession.
 */
export { usdcRateToNative };
