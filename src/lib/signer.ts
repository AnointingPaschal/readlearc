/** Holds the currently unlocked wallet so non-React code (api adapter, onchain modules) can sign. */
import type { ethers } from "ethers";

let current: ethers.Wallet | null = null;
const listeners = new Set<() => void>();

export const setActiveSigner = (s: ethers.Wallet | null) => { current = s; listeners.forEach((l) => l()); };
export const getActiveSigner = () => current;
export const onSignerChange = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };

/** Set by AuthProvider: opens the unlock modal and resolves once a signer exists (or null if dismissed). */
let requester: (() => Promise<ethers.Wallet | null>) | null = null;
export const setSignerRequester = (fn: typeof requester) => { requester = fn; };

export async function requireSigner(): Promise<ethers.Wallet> {
  if (current) return current;
  if (requester) {
    const s = await requester();
    if (s) return s;
  }
  throw new Error("Connect your wallet to continue.");
}
