/** StreamPay voucher helpers (session key signs; contract verifies on close, key server verifies to release segments). */
import { ethers } from "ethers";
import { cfg } from "@/lib/config";

export const DOMAIN_TAG = "READLEARC_STREAM";

export function generateSessionKey() {
  const w = ethers.Wallet.createRandom();
  return { privateKey: w.privateKey, publicAddress: w.address };
}

/** keccak256(abi.encodePacked(DOMAIN_TAG, chainId, streamPay, sessionId, amountOwed)) — eth-sign wrapped by signMessage. */
export function voucherDigest(sessionId: string, amountOwed: bigint, chainId = cfg.chainId, streamPay = cfg.streamPay): Uint8Array {
  return ethers.getBytes(
    ethers.solidityPackedKeccak256(["string", "uint256", "address", "bytes32", "uint256"], [DOMAIN_TAG, chainId, streamPay, sessionId, amountOwed]),
  );
}

export async function signVoucher(sessionKeyPriv: string, sessionId: string, amountOwed: bigint): Promise<string> {
  return new ethers.Wallet(sessionKeyPriv).signMessage(voucherDigest(sessionId, amountOwed));
}

export const calcAmountOwed = (ratePerSecNative: bigint, seconds: number) => ratePerSecNative * BigInt(Math.max(0, Math.floor(seconds)));
