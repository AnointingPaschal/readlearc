"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { ethers } from "ethers";
import { READLEARC_ADDRESS, READLEARC_ABI, USDC_ADDRESS, USDC_ABI } from "./web3";

interface WalletCtx {
  address: string;
  shortAddress: string;
  isConnected: boolean;
  isConnecting: boolean;
  usdcBalance: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  error: string;
}

const WalletContext = createContext<WalletCtx>({
  address: "",
  shortAddress: "",
  isConnected: false,
  isConnecting: false,
  usdcBalance: "0.00",
  connect: async () => {},
  disconnect: () => {},
  provider: null,
  signer: null,
  error: "",
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState("0.00");
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [error, setError] = useState("");

  const shortAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : "";

  const fetchBalance = useCallback(async (addr: string, prov: ethers.BrowserProvider) => {
    try {
      if (!USDC_ADDRESS) return;
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, prov);
      const bal = await usdc.balanceOf(addr);
      const decimals = await usdc.decimals();
      setUsdcBalance(parseFloat(ethers.formatUnits(bal, decimals)).toFixed(2));
    } catch {
      setUsdcBalance("0.00");
    }
  }, []);

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      setError("No crypto wallet found. Please install MetaMask.");
      return;
    }
    setIsConnecting(true);
    setError("");
    try {
      const prov = new ethers.BrowserProvider((window as any).ethereum);
      await prov.send("eth_requestAccounts", []);
      const sign = await prov.getSigner();
      const addr = await sign.getAddress();
      setProvider(prov);
      setSigner(sign);
      setAddress(addr);
      localStorage.setItem("rl-wallet", addr);
      await fetchBalance(addr, prov);
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  }, [fetchBalance]);

  const disconnect = useCallback(() => {
    setAddress("");
    setProvider(null);
    setSigner(null);
    setUsdcBalance("0.00");
    localStorage.removeItem("rl-wallet");
  }, []);

  // Auto-reconnect if previously connected
  useEffect(() => {
    const saved = localStorage.getItem("rl-wallet");
    if (saved && typeof window !== "undefined" && (window as any).ethereum) {
      const prov = new ethers.BrowserProvider((window as any).ethereum);
      prov.listAccounts().then(accounts => {
        if (accounts.length > 0 && accounts[0].address.toLowerCase() === saved.toLowerCase()) {
          prov.getSigner().then(sign => {
            setProvider(prov);
            setSigner(sign);
            setAddress(accounts[0].address);
            fetchBalance(accounts[0].address, prov);
          });
        }
      }).catch(() => {});
    }
  }, [fetchBalance]);

  // Listen for account changes
  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;
    const handleChange = (accounts: string[]) => {
      if (accounts.length === 0) disconnect();
      else if (accounts[0] !== address) connect();
    };
    (window as any).ethereum.on("accountsChanged", handleChange);
    return () => (window as any).ethereum.removeListener("accountsChanged", handleChange);
  }, [address, connect, disconnect]);

  return (
    <WalletContext.Provider value={{
      address, shortAddress, isConnected: !!address,
      isConnecting, usdcBalance, connect, disconnect,
      provider, signer, error,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
