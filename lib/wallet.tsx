"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { ethers } from "ethers";
import { USDC_ADDRESS, USDC_ABI } from "./chain";

// ── Arc Testnet constants ─────────────────────────────────────────
export const ARC_CHAIN_ID  = 5042002;
export const ARC_CHAIN_HEX = "0x" + ARC_CHAIN_ID.toString(16); // 0x4cef52

export const ARC_NETWORK_PARAMS = [{
  chainId:           ARC_CHAIN_HEX,
  chainName:         "Arc Testnet",
  nativeCurrency:    { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls:           ["https://rpc.testnet.arc.network"],
  blockExplorerUrls: ["https://testnet.arcscan.app"],
}];

// ── Get window.ethereum safely ────────────────────────────────────
function getEthereum(): any {
  if (typeof window === "undefined") return null;
  return (window as any).ethereum ?? null;
}

// ── Context types ─────────────────────────────────────────────────
interface WalletCtx {
  address:        string;
  shortAddress:   string;
  isConnected:    boolean;
  isWrongNetwork: boolean;
  chainId:        number | null;
  usdcBalance:    string;
  provider:       ethers.BrowserProvider | null;
  signer:         ethers.JsonRpcSigner   | null;
  hasWallet:      boolean;
  connecting:     boolean;
  connect:        () => Promise<void>;
  disconnect:     () => void;
  switchToArc:    () => Promise<void>;
  refreshBalance: () => Promise<void>;
}

const defaultCtx: WalletCtx = {
  address:"", shortAddress:"", isConnected:false, isWrongNetwork:false,
  chainId:null, usdcBalance:"0.00", provider:null, signer:null,
  hasWallet:false, connecting:false,
  connect:async()=>{}, disconnect:()=>{},
  switchToArc:async()=>{}, refreshBalance:async()=>{},
};

const Ctx = createContext<WalletCtx>(defaultCtx);

// ── Provider ──────────────────────────────────────────────────────
export function WalletProvider({ children }: { children: ReactNode }) {
  const [address,    setAddress]    = useState("");
  const [chainId,    setChainId]    = useState<number|null>(null);
  const [balance,    setBalance]    = useState("0.00");
  const [provider,   setProvider]   = useState<ethers.BrowserProvider|null>(null);
  const [signer,     setSigner]     = useState<ethers.JsonRpcSigner|null>(null);
  const [connecting, setConnecting] = useState(false);
  const [hasWallet,  setHasWallet]  = useState(false);

  // ── Build provider + signer for a given address ───────────────
  const setupSigner = useCallback(async (acc: string) => {
    const ethereum = getEthereum();
    if (!ethereum || !acc) return;
    try {
      const prov = new ethers.BrowserProvider(ethereum);
      const s    = await prov.getSigner(acc);
      const net  = await prov.getNetwork();
      setProvider(prov);
      setSigner(s);
      setChainId(Number(net.chainId));
      // Fetch USDC balance
      if (USDC_ADDRESS) {
        const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, prov);
        const [bal, dec] = await Promise.all([usdc.balanceOf(acc), usdc.decimals()]);
        setBalance(parseFloat(ethers.formatUnits(bal, dec)).toFixed(4));
      }
    } catch (e) {
      console.error("setupSigner:", e);
    }
  }, []);

  // ── Boot: detect wallet, get current chain, auto-reconnect ────
  useEffect(() => {
    const ethereum = getEthereum();
    setHasWallet(!!ethereum);
    if (!ethereum) return;

    // Get current chain immediately (even before connecting)
    ethereum.request({ method: "eth_chainId" })
      .then((hex: string) => setChainId(parseInt(hex, 16)))
      .catch(() => {});

    // Auto-reconnect if previously connected
    const saved = localStorage.getItem("rl-wallet");
    if (saved) {
      ethereum.request({ method: "eth_accounts" })
        .then((accounts: string[]) => {
          const match = accounts.find(
            (a: string) => a.toLowerCase() === saved.toLowerCase()
          );
          if (match) {
            setAddress(match);
            setupSigner(match);
          } else {
            localStorage.removeItem("rl-wallet");
          }
        })
        .catch(() => {});
    }

    // ── Listeners ──────────────────────────────────────────────
    function onAccountsChanged(accounts: string[]) {
      if (accounts.length === 0) {
        setAddress(""); setSigner(null); setProvider(null);
        setBalance("0.00"); localStorage.removeItem("rl-wallet");
      } else {
        setAddress(accounts[0]);
        localStorage.setItem("rl-wallet", accounts[0]);
        setupSigner(accounts[0]);
      }
    }

    function onChainChanged(hex: string) {
      const id = parseInt(hex, 16);
      setChainId(id);
      // Rebuild provider for new chain
      if (address) setupSigner(address);
    }

    ethereum.on("accountsChanged", onAccountsChanged);
    ethereum.on("chainChanged",    onChainChanged);
    return () => {
      ethereum.removeListener("accountsChanged", onAccountsChanged);
      ethereum.removeListener("chainChanged",    onChainChanged);
    };
  }, [setupSigner, address]);

  // ── Connect ──────────────────────────────────────────────────
  const connect = useCallback(async () => {
    const ethereum = getEthereum();
    if (!ethereum) {
      alert("No wallet found. Please install MetaMask from metamask.io");
      return;
    }
    setConnecting(true);
    try {
      const accounts: string[] = await ethereum.request({
        method: "eth_requestAccounts",
      });
      if (accounts[0]) {
        setAddress(accounts[0]);
        localStorage.setItem("rl-wallet", accounts[0]);
        await setupSigner(accounts[0]);
      }
    } catch (e: any) {
      if (e.code !== 4001) console.error("connect:", e);
    } finally {
      setConnecting(false);
    }
  }, [setupSigner]);

  // ── Disconnect ───────────────────────────────────────────────
  const disconnect = useCallback(() => {
    setAddress(""); setSigner(null); setProvider(null);
    setBalance("0.00"); localStorage.removeItem("rl-wallet");
  }, []);

  // ── Switch / Add Arc Testnet ─────────────────────────────────
  const switchToArc = useCallback(async () => {
    const ethereum = getEthereum();
    if (!ethereum) throw new Error("No wallet found");

    try {
      // Try switching first (works if network is already added)
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ARC_CHAIN_HEX }],
      });
    } catch (switchErr: any) {
      // 4902 = chain not added yet; -32603 = same on some wallets
      if (switchErr.code === 4902 || switchErr.code === -32603) {
        try {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: ARC_NETWORK_PARAMS,
          });
        } catch (addErr: any) {
          // User rejected add → rethrow so UI can show message
          throw addErr;
        }
      } else {
        throw switchErr;
      }
    }
  }, []);

  // ── Refresh balance ──────────────────────────────────────────
  const refreshBalance = useCallback(async () => {
    if (!address || !provider || !USDC_ADDRESS) return;
    try {
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);
      const [bal, dec] = await Promise.all([usdc.balanceOf(address), usdc.decimals()]);
      setBalance(parseFloat(ethers.formatUnits(bal, dec)).toFixed(4));
    } catch {}
  }, [address, provider]);

  const isConnected    = !!address;
  const isWrongNetwork = isConnected && chainId !== null && chainId !== ARC_CHAIN_ID;
  const shortAddress   = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : "";

  return (
    <Ctx.Provider value={{
      address, shortAddress, isConnected, isWrongNetwork, chainId,
      usdcBalance: balance, provider, signer, hasWallet, connecting,
      connect, disconnect, switchToArc, refreshBalance,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useWallet = () => useContext(Ctx);
