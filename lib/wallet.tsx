"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { ethers } from "ethers";
import { USDC_ADDRESS, USDC_ABI, RPC_URL, CONTRACT_ADDRESS, CONTRACT_ABI } from "./chain";

interface WalletCtx {
  address: string;
  shortAddress: string;
  isConnected: boolean;
  isConnecting: boolean;
  usdcBalance: string;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  error: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
}

const Ctx = createContext<WalletCtx>({
  address: "", shortAddress: "", isConnected: false, isConnecting: false,
  usdcBalance: "0.00", provider: null, signer: null, error: "",
  connect: async () => {}, disconnect: () => {}, refreshBalance: async () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address,     setAddress]     = useState("");
  const [isConnecting,setIsConnecting]= useState(false);
  const [usdcBalance, setUsdcBalance] = useState("0.00");
  const [provider,    setProvider]    = useState<ethers.BrowserProvider | null>(null);
  const [signer,      setSigner]      = useState<ethers.JsonRpcSigner | null>(null);
  const [error,       setError]       = useState("");

  const shortAddress = address ? `${address.slice(0,6)}…${address.slice(-4)}` : "";

  const fetchBalance = useCallback(async (addr: string, prov: ethers.BrowserProvider) => {
    if (!USDC_ADDRESS) return;
    try {
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, prov);
      const bal  = await usdc.balanceOf(addr);
      const dec  = await usdc.decimals();
      setUsdcBalance(parseFloat(ethers.formatUnits(bal, dec)).toFixed(4));
    } catch { setUsdcBalance("0.00"); }
  }, []);

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      setError("No wallet found. Please install MetaMask.");
      return;
    }
    setIsConnecting(true); setError("");
    try {
      const prov = new ethers.BrowserProvider((window as any).ethereum);
      await prov.send("eth_requestAccounts", []);
      const sign = await prov.getSigner();
      const addr = await sign.getAddress();
      setProvider(prov); setSigner(sign); setAddress(addr);
      localStorage.setItem("rl-wallet", addr);
      await fetchBalance(addr, prov);
    } catch (e: any) {
      setError(e.message || "Failed to connect");
    } finally { setIsConnecting(false); }
  }, [fetchBalance]);

  const disconnect = useCallback(() => {
    setAddress(""); setProvider(null); setSigner(null); setUsdcBalance("0.00");
    localStorage.removeItem("rl-wallet");
  }, []);

  const refreshBalance = useCallback(async () => {
    if (provider && address) await fetchBalance(address, provider);
  }, [provider, address, fetchBalance]);

  // Auto-reconnect
  useEffect(() => {
    const saved = localStorage.getItem("rl-wallet");
    if (!saved || typeof window === "undefined" || !(window as any).ethereum) return;
    const prov = new ethers.BrowserProvider((window as any).ethereum);
    prov.listAccounts().then(accounts => {
      if (accounts.length > 0 && accounts[0].address.toLowerCase() === saved.toLowerCase()) {
        prov.getSigner().then(sign => {
          setProvider(prov); setSigner(sign); setAddress(accounts[0].address);
          fetchBalance(accounts[0].address, prov);
        }).catch(() => {});
      }
    }).catch(() => {});
  }, [fetchBalance]);

  // Handle account changes
  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;
    const onChange = (accounts: string[]) => {
      if (accounts.length === 0) disconnect();
      else connect();
    };
    (window as any).ethereum.on("accountsChanged", onChange);
    return () => (window as any).ethereum?.removeListener("accountsChanged", onChange);
  }, [connect, disconnect]);

  return (
    <Ctx.Provider value={{
      address, shortAddress, isConnected: !!address,
      isConnecting, usdcBalance, provider, signer, error,
      connect, disconnect, refreshBalance,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useWallet = () => useContext(Ctx);
