"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { ethers } from "ethers";

// ── Arc Testnet (5042002 = 0x4cef52) ─────────────────────────────
export const ARC = {
  chainId:    5042002,
  chainHex:   "0x4cef52",
  name:       "Arc Testnet",
  currency:   { name: "USDC", symbol: "USDC", decimals: 6 },
  rpc:        "https://rpc.testnet.arc.network",
  explorer:   "https://testnet.arcscan.app",
};

const eth = (): any =>
  typeof window !== "undefined" ? (window as any).ethereum ?? null : null;

// ── Types ─────────────────────────────────────────────────────────
interface WalletState {
  address:      string;
  short:        string;
  connected:    boolean;
  wrongNetwork: boolean;
  chainId:      number | null;
  balance:      string;          // USDC balance
  signer:       ethers.JsonRpcSigner | null;
  provider:     ethers.BrowserProvider | null;
  hasWallet:    boolean;
  busy:         boolean;
}
interface WalletActions {
  connect:    () => Promise<void>;
  disconnect: () => void;
  addArc:     () => Promise<void>;
  refresh:    () => Promise<void>;
}

const defaultState: WalletState = {
  address:"", short:"", connected:false, wrongNetwork:false,
  chainId:null, balance:"0.00", signer:null, provider:null,
  hasWallet:false, busy:false,
};

const Ctx = createContext<WalletState & WalletActions>({
  ...defaultState,
  connect:async()=>{}, disconnect:()=>{}, addArc:async()=>{}, refresh:async()=>{},
});

// ── USDC contract address ─────────────────────────────────────────
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS ||
  "0x3600000000000000000000000000000000000000";
const USDC_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function transfer(address, uint256) returns (bool)",
  "function approve(address, uint256) returns (bool)",
  "function allowance(address, address) view returns (uint256)",
];

// ── Provider ──────────────────────────────────────────────────────
export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>(defaultState);

  // Helper: merge state
  const patch = (s: Partial<WalletState>) =>
    setState(prev => ({ ...prev, ...s }));

  // Build provider + signer + balance for an account
  async function hydrate(address: string) {
    const e = eth();
    if (!e || !address) return;
    try {
      const prov    = new ethers.BrowserProvider(e);
      const net     = await prov.getNetwork();
      const chainId = Number(net.chainId);
      const signer  = await prov.getSigner(address);
      let   bal     = "0.00";
      try {
        const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, prov);
        const [b, d] = await Promise.all([usdc.balanceOf(address), usdc.decimals()]);
        bal = parseFloat(ethers.formatUnits(b, d)).toFixed(4);
      } catch {}
      patch({
        address, short: `${address.slice(0,6)}…${address.slice(-4)}`,
        connected: true, chainId,
        wrongNetwork: chainId !== ARC.chainId,
        signer, provider: prov, balance: bal,
      });
    } catch (e) { console.error("hydrate:", e); }
  }

  // Boot
  useEffect(() => {
    const e = eth();
    patch({ hasWallet: !!e });
    if (!e) return;

    // Get current chain immediately
    e.request({ method: "eth_chainId" })
      .then((hex: string) => patch({ chainId: parseInt(hex, 16) }))
      .catch(() => {});

    // Auto-reconnect
    const saved = localStorage.getItem("rl-addr");
    if (saved) {
      e.request({ method: "eth_accounts" }).then((accs: string[]) => {
        if (accs.find((a: string) => a.toLowerCase() === saved.toLowerCase()))
          hydrate(accs[0]);
        else localStorage.removeItem("rl-addr");
      }).catch(() => {});
    }

    // Listeners
    const onAccounts = (accs: string[]) => {
      if (!accs.length) {
        localStorage.removeItem("rl-addr");
        setState(prev => ({ ...prev, ...defaultState, hasWallet: true }));
      } else {
        localStorage.setItem("rl-addr", accs[0]);
        hydrate(accs[0]);
      }
    };
    const onChain = (hex: string) => {
      const id = parseInt(hex, 16);
      patch({ chainId: id, wrongNetwork: !!state.connected && id !== ARC.chainId });
      if (state.address) hydrate(state.address);
    };

    e.on("accountsChanged", onAccounts);
    e.on("chainChanged",    onChain);
    return () => {
      e.removeListener("accountsChanged", onAccounts);
      e.removeListener("chainChanged",    onChain);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Connect
  const connect = async () => {
    const e = eth();
    if (!e) { alert("Please install MetaMask from metamask.io"); return; }
    patch({ busy: true });
    try {
      const accs: string[] = await e.request({ method: "eth_requestAccounts" });
      if (accs[0]) {
        localStorage.setItem("rl-addr", accs[0]);
        await hydrate(accs[0]);
      }
    } catch (err: any) {
      if (err.code !== 4001) console.error(err);
    } finally { patch({ busy: false }); }
  };

  // Disconnect
  const disconnect = () => {
    localStorage.removeItem("rl-addr");
    setState(prev => ({ ...prev, ...defaultState, hasWallet: prev.hasWallet }));
  };

  // Add/Switch to Arc
  const addArc = async () => {
    const e = eth();
    if (!e) throw new Error("No wallet");
    try {
      await e.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ARC.chainHex }],
      });
    } catch (err: any) {
      if (err.code === 4902 || err.code === -32603) {
        await e.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId:           ARC.chainHex,
            chainName:         ARC.name,
            nativeCurrency:    ARC.currency,
            rpcUrls:           [ARC.rpc],
            blockExplorerUrls: [ARC.explorer],
          }],
        });
      } else throw err;
    }
  };

  // Refresh balance
  const refresh = async () => {
    if (state.address) await hydrate(state.address);
  };

  return (
    <Ctx.Provider value={{ ...state, connect, disconnect, addArc, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export const useWallet = () => useContext(Ctx);
export { USDC_ADDRESS, USDC_ABI };
