"use client";
/**
 * Readlearc Auth — Internal wallet-only authentication.
 * No MetaMask, no WalletConnect. User's platform wallet IS their identity.
 *
 * Flow:
 *  1. New user → see articles, read 50% free → action → AuthModal (create/import)
 *  2. Returning user → AuthModal shows "Unlock" (password to decrypt)
 *  3. Unlocked → signer in memory → all txs signed internally, broadcast to Arc
 *  4. Auto-lock after 15 min idle
 */
import {
  createContext, useContext, useState, useEffect, useCallback,
  useRef, ReactNode,
} from "react";
import { ethers } from "ethers";
import {
  loadWallets, getActiveIndex, setActiveIndex,
  decryptKey, getUsdcBalance, StoredWallet,
  getProvider, USDC_ADDR, USDC_ABI, ARC_RPC, ARC_CHAIN_ID,
} from "./internal-wallet";

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
export const EXPLORER_URL     = "https://testnet.arcscan.app";

export const CONTRACT_ABI = [
  "function payToRead(uint256 articleId, address writer, uint256 price, address referrer) external",
  "function tip(address writer, uint256 amount) external",
  "function hasPaid(uint256 articleId, address reader) external view returns (bool)",
  "function writerBps() view returns (uint256)",
  "function platformBps() view returns (uint256)",
  "function roles(address) view returns (uint8)",
  "function verified(address) view returns (bool)",
  "function setRole(address user, uint8 role) external",
  "function setVerified(address writer, bool status) external",
  "event ArticlePaid(uint256 indexed articleId, address indexed reader, address indexed writer, uint256 amount)",
  "event Tipped(address indexed from, address indexed to, uint256 amount)",
];

// ── Context types ─────────────────────────────────────────────────
interface AuthCtx {
  // State
  address:       string;
  short:         string;
  isAuth:        boolean;   // logged in + unlocked
  isLocked:      boolean;   // wallet exists but locked (session expired)
  hasWallet:     boolean;   // wallet created/imported
  balance:       string;    // USDC balance
  wallets:       StoredWallet[];
  activeWallet:  StoredWallet | null;
  // Signer (internal ethers.Wallet connected to Arc)
  signer:        ethers.Wallet | null;
  // Modal
  authModal:     boolean;
  setAuthModal:  (v: boolean) => void;
  requireAuth:   () => void;  // opens modal if not authed
  // Actions
  unlock:        (password: string) => Promise<void>;
  lock:          () => void;
  disconnect:    () => void;
  switchWallet:  (idx: number) => void;
  refresh:       () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  address:"", short:"", isAuth:false, isLocked:false, hasWallet:false,
  balance:"0.00", wallets:[], activeWallet:null, signer:null,
  authModal:false, setAuthModal:()=>{}, requireAuth:()=>{},
  unlock:async()=>{}, lock:()=>{}, disconnect:()=>{}, switchWallet:()=>{}, refresh:async()=>{},
});

const LOCK_AFTER = 15 * 60 * 1000; // 15 minutes

export function AuthProvider({ children }: { children: ReactNode }) {
  const [wallets,     setWallets]     = useState<StoredWallet[]>([]);
  const [activeIdx,   setActiveIdx_]  = useState(0);
  const [signer,      setSigner]      = useState<ethers.Wallet|null>(null);
  const [balance,     setBalance]     = useState("0.00");
  const [authModal,   setAuthModal]   = useState(false);
  const idleTimer = useRef<any>(null);

  // Load wallets from localStorage on mount
  useEffect(() => {
    const ws  = loadWallets();
    const idx = getActiveIndex();
    setWallets(ws);
    setActiveIdx_(Math.min(idx, Math.max(0, ws.length-1)));
  }, []);

  // Reset idle timer
  const resetIdle = useCallback(() => {
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      setSigner(null); // auto-lock
    }, LOCK_AFTER);
  }, []);

  useEffect(() => {
    if (!signer) return;
    const events = ["mousemove","keydown","click","touchstart"];
    events.forEach(e => window.addEventListener(e, resetIdle));
    resetIdle();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetIdle));
      clearTimeout(idleTimer.current);
    };
  }, [signer, resetIdle]);

  // Load balance when signer changes
  useEffect(() => {
    if (!signer) return;
    getUsdcBalance(signer.address).then(setBalance);
  }, [signer]);

  // Unlock wallet
  const unlock = useCallback(async (password: string) => {
    const ws = loadWallets();
    const idx = getActiveIndex();
    const w   = ws[idx];
    if (!w) throw new Error("No wallet found");
    const pk     = await decryptKey(w.encryptedKey, password);
    const prov   = getProvider();
    const wallet = new ethers.Wallet(pk, prov);
    setSigner(wallet);
    setWallets(ws);
    setActiveIdx_(idx);
    setAuthModal(false);
  }, []);

  const disconnect = useCallback(() => {
    setSigner(null);
    localStorage.removeItem("rl-addr");
    clearTimeout(idleTimer.current);
  }, []);

  const lock = useCallback(() => {
    setSigner(null);
    clearTimeout(idleTimer.current);
  }, []);

  const requireAuth = useCallback(() => {
    setAuthModal(true);
  }, []);

  const switchWallet = useCallback((idx: number) => {
    setActiveIdx_(idx);
    setActiveIndex(idx);
    setSigner(null); // require re-unlock for new wallet
  }, []);

  const refresh = useCallback(async () => {
    if (!signer) return;
    const bal = await getUsdcBalance(signer.address);
    setBalance(bal);
  }, [signer]);

  // Sync wallets when localStorage changes (e.g., after create/import)
  const syncWallets = useCallback(() => {
    const ws = loadWallets();
    setWallets(ws);
    if (ws.length > 0 && !signer) {
      // New wallet just created — try to auto-unlock if possible
      // (handled by AuthModal which calls unlock)
    }
  }, [signer]);

  // Listen for wallet storage changes
  useEffect(() => {
    window.addEventListener("rl-wallet-created", syncWallets);
    return () => window.removeEventListener("rl-wallet-created", syncWallets);
  }, [syncWallets]);

  const activeWallet = wallets[activeIdx] || null;
  const address      = signer?.address || "";
  const short        = address ? `${address.slice(0,6)}…${address.slice(-4)}` : "";
  const hasWallet    = wallets.length > 0;
  const isLocked     = hasWallet && !signer;
  const isAuth       = !!signer;

  return (
    <Ctx.Provider value={{
      address, short, isAuth, isLocked, hasWallet, balance,
      wallets, activeWallet, signer, authModal, setAuthModal,
      requireAuth, unlock, lock, disconnect, switchWallet, refresh,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
