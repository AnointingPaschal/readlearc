"use client";
import {
  createContext, useContext, useState, useEffect,
  useCallback, useRef, ReactNode,
} from "react";
import { ethers } from "ethers";
import {
  loadWallets, getActiveIndex, setActiveIndex,
  decryptKey, getUsdcBalance, StoredWallet,
  getProvider, USDC_ADDR, USDC_ABI,
} from "./internal-wallet";
import { saveSession, restoreSession, clearSession } from "./session";

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
export const EXPLORER_URL     = "https://testnet.arcscan.app";

export const CONTRACT_ABI = [
  "function payToRead(uint256 articleId, address writer, uint256 price, address referrer) external",
  "function tip(address writer, uint256 amount) external",
  "function hasPaid(uint256 articleId, address reader) external view returns (bool)",
  "function writerBps() view returns (uint256)",
  "function roles(address) view returns (uint8)",
  "event ArticlePaid(uint256 indexed articleId, address indexed reader, address indexed writer, uint256 amount)",
];

// ── Transaction preview (for signing modal) ───────────────────────
export interface TxPreview {
  title:       string;       // e.g. "Pay to Read"
  description: string;       // e.g. article title
  to:          string;       // recipient address
  amount:      string;       // e.g. "$0.020"
  token:       string;       // e.g. "USDC"
  type:        string;       // e.g. "USDC Transfer"
}

// ── Context ───────────────────────────────────────────────────────
interface AuthCtx {
  address:      string;
  short:        string;
  isAuth:       boolean;
  isLocked:     boolean;
  hasWallet:    boolean;
  isAdmin:      boolean;
  balance:      string;
  wallets:      StoredWallet[];
  activeWallet: StoredWallet | null;
  signer:       ethers.Wallet | null;
  // Auth modal
  authModal:    boolean;
  setAuthModal: (v: boolean) => void;
  requireAuth:  (cb?: () => void) => void;
  // Actions
  unlock:       (password: string) => Promise<void>;
  lock:         () => void;
  disconnect:   () => void;
  switchWallet: (idx: number) => void;
  refresh:      () => Promise<void>;
  // Tx signing modal
  txModal:      { open: boolean; preview: TxPreview | null };
  requestSign:  (preview: TxPreview) => Promise<boolean>;
  confirmTx:    () => void;
  cancelTx:     () => void;
}

const Ctx = createContext<AuthCtx>({
  address:"", short:"", isAuth:false, isLocked:false, hasWallet:false,
  isAdmin:false, balance:"0.00", wallets:[], activeWallet:null, signer:null,
  authModal:false, setAuthModal:()=>{}, requireAuth:()=>{},
  unlock:async()=>{}, lock:()=>{}, disconnect:()=>{},
  switchWallet:()=>{}, refresh:async()=>{},
  txModal:{ open:false, preview:null },
  requestSign:async()=>false, confirmTx:()=>{}, cancelTx:()=>{},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [wallets,    setWallets]    = useState<StoredWallet[]>([]);
  const [activeIdx,  setActiveIdx_] = useState(0);
  const [signer,     setSigner]     = useState<ethers.Wallet|null>(null);
  const [balance,    setBalance]    = useState("0.00");
  const [authModal,  setAuthModal]  = useState(false);
  const [isAdmin,    setIsAdmin]    = useState(false);
  const [txModal,    setTxModal]    = useState<{ open:boolean; preview:TxPreview|null }>({ open:false, preview:null });
  const pendingCb    = useRef<(() => void) | undefined>(undefined);
  const txResolveRef = useRef<((v: boolean) => void)|null>(null);
  const booted       = useRef(false);

  // ── Load wallets ──────────────────────────────────────────────
  useEffect(() => {
    const ws  = loadWallets();
    const idx = getActiveIndex();
    setWallets(ws);
    setActiveIdx_(Math.min(idx, Math.max(0, ws.length - 1)));
  }, []);

  // ── Boot: try to restore persistent session ────────────────────
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    restoreSession().then(s => {
      if (!s) return;
      const ws  = loadWallets();
      const idx = Math.min(s.walletIndex, Math.max(0, ws.length - 1));
      const prov = getProvider();
      const w    = new ethers.Wallet(s.privateKey, prov);
      setSigner(w);
      setWallets(ws);
      setActiveIdx_(idx);
      getUsdcBalance(w.address).then(setBalance);
      void checkAdmin(w.address);
    });
  }, []);

  // ── Check admin role ──────────────────────────────────────────
  async function checkAdmin(addr: string) {
    try {
      const r = await fetch(`/api/admin/roles/check?address=${addr.toLowerCase()}`);
      const d = await r.json();
      setIsAdmin(d.role >= 2);
    } catch { setIsAdmin(false); }
  }

  // ── Balance refresh ───────────────────────────────────────────
  const refresh = useCallback(async () => {
    if (!signer) return;
    const bal = await getUsdcBalance(signer.address);
    setBalance(bal);
  }, [signer]);

  // ── Unlock ───────────────────────────────────────────────────
  const unlock = useCallback(async (password: string) => {
    const ws  = loadWallets();
    const idx = getActiveIndex();
    const w   = ws[idx];
    if (!w) throw new Error("No wallet found. Create or import one.");
    // Decrypt with user password
    const pk   = await decryptKey(w.encryptedKey, password);
    const prov = getProvider();
    const wallet = new ethers.Wallet(pk, prov);
    // Save persistent session (no expiry — until logout)
    await saveSession(pk, wallet.address, idx);
    setSigner(wallet);
    setWallets(ws);
    setActiveIdx_(idx);
    setAuthModal(false);
    getUsdcBalance(wallet.address).then(setBalance);
    void checkAdmin(wallet.address);
    // Fire pending callback (e.g. the action that triggered auth)
    if (pendingCb.current) { const cb = pendingCb.current; pendingCb.current = undefined; setTimeout(() => cb(), 100); }
  }, []);

  // ── Lock ─────────────────────────────────────────────────────
  const lock = useCallback(() => {
    clearSession(); // clears persistent session too
    setSigner(null); setIsAdmin(false);
  }, []);

  // ── Disconnect (sign out) ─────────────────────────────────────
  const disconnect = useCallback(() => {
    clearSession();
    setSigner(null); setBalance("0.00"); setIsAdmin(false);
  }, []);

  // ── requireAuth: open modal, optionally queue a callback ──────
  const requireAuth = useCallback((cb?: () => void) => {
    if (cb) pendingCb.current = cb;
    setAuthModal(true);
  }, []);

  // ── Switch wallet ─────────────────────────────────────────────
  const switchWallet = useCallback((idx: number) => {
    setActiveIdx_(idx);
    setActiveIndex(idx);
    clearSession();
    setSigner(null); setBalance("0.00"); setIsAdmin(false);
    setAuthModal(true); // prompt password for new wallet
  }, []);

  // ── Transaction signing modal ─────────────────────────────────
  const requestSign = useCallback((preview: TxPreview): Promise<boolean> => {
    return new Promise(resolve => {
      txResolveRef.current = resolve;
      setTxModal({ open: true, preview });
    });
  }, []);

  const confirmTx = useCallback(() => {
    setTxModal({ open:false, preview:null });
    txResolveRef.current?.(true);
    txResolveRef.current = null;
  }, []);

  const cancelTx = useCallback(() => {
    setTxModal({ open:false, preview:null });
    txResolveRef.current?.(false);
    txResolveRef.current = null;
  }, []);

  // ── Sync wallets after creation ───────────────────────────────
  useEffect(() => {
    function sync() {
      const ws = loadWallets();
      setWallets(ws);
    }
    window.addEventListener("rl-wallet-created", sync);
    return () => window.removeEventListener("rl-wallet-created", sync);
  }, []);

  const activeWallet = wallets[activeIdx] || null;
  const address      = signer?.address || "";
  const short        = address ? `${address.slice(0,6)}…${address.slice(-4)}` : "";
  const hasWallet    = wallets.length > 0;
  const isLocked     = hasWallet && !signer;
  const isAuth       = !!signer;

  return (
    <Ctx.Provider value={{
      address, short, isAuth, isLocked, hasWallet, isAdmin, balance,
      wallets, activeWallet, signer,
      authModal, setAuthModal, requireAuth,
      unlock, lock, disconnect, switchWallet, refresh,
      txModal, requestSign, confirmTx, cancelTx,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
