"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { ethers } from "ethers";
import { USDC_ADDRESS, USDC_ABI } from "./chain";

// ── Arc Testnet ────────────────────────────────────────────────────
export const ARC_CHAIN_ID  = 5042002;
export const ARC_CHAIN_HEX = `0x${ARC_CHAIN_ID.toString(16)}`;
export const ARC_PARAMS    = {
  chainId:           ARC_CHAIN_HEX,
  chainName:         "Arc Testnet",
  nativeCurrency:    { name:"USDC", symbol:"USDC", decimals:6 },
  rpcUrls:           ["https://rpc.testnet.arc.network"],
  blockExplorerUrls: ["https://testnet.arcscan.app"],
};

function eth() { return typeof window !== "undefined" ? (window as any).ethereum ?? null : null; }

// ── Context ────────────────────────────────────────────────────────
interface WalletCtx {
  address:       string;
  shortAddress:  string;
  isConnected:   boolean;
  isWrongNetwork:boolean;
  chainId:       number | null;
  usdcBalance:   string;
  provider:      ethers.BrowserProvider | null;
  signer:        ethers.JsonRpcSigner | null;
  hasWallet:     boolean;
  connecting:    boolean;
  connect:       () => Promise<void>;
  disconnect:    () => void;
  switchToArc:   () => Promise<void>;
  refreshBalance:() => Promise<void>;
}

const Ctx = createContext<WalletCtx>({
  address:"", shortAddress:"", isConnected:false, isWrongNetwork:false,
  chainId:null, usdcBalance:"0.00", provider:null, signer:null,
  hasWallet:false, connecting:false,
  connect:async()=>{}, disconnect:()=>{}, switchToArc:async()=>{}, refreshBalance:async()=>{},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address,    setAddress]    = useState("");
  const [chainId,    setChainId]    = useState<number|null>(null);
  const [balance,    setBalance]    = useState("0.00");
  const [provider,   setProvider]   = useState<ethers.BrowserProvider|null>(null);
  const [signer,     setSigner]     = useState<ethers.JsonRpcSigner|null>(null);
  const [connecting, setConnecting] = useState(false);
  const [hasWallet,  setHasWallet]  = useState(false);

  // Initialise provider from ethereum object
  const buildProvider = useCallback(() => {
    const e = eth();
    if (!e) return null;
    return new ethers.BrowserProvider(e);
  }, []);

  const refreshBalance = useCallback(async (addr = address, prov = provider) => {
    if (!addr || !prov || !USDC_ADDRESS) return;
    try {
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, prov);
      const [bal, dec] = await Promise.all([usdc.balanceOf(addr), usdc.decimals()]);
      setBalance(parseFloat(ethers.formatUnits(bal, dec)).toFixed(4));
    } catch { setBalance("0.00"); }
  }, [address, provider]);

  // Apply new address + provider
  const applyAccount = useCallback(async (acc: string) => {
    if (!acc) { setAddress(""); setSigner(null); setBalance("0.00"); return; }
    setAddress(acc);
    const prov = buildProvider();
    setProvider(prov);
    if (prov) {
      try {
        const s = await prov.getSigner(acc);
        setSigner(s);
        const net = await prov.getNetwork();
        setChainId(Number(net.chainId));
        await refreshBalance(acc, prov);
      } catch {}
    }
    localStorage.setItem("rl-wallet", acc);
  }, [buildProvider, refreshBalance]);

  // Boot — auto-reconnect if previously connected
  useEffect(() => {
    const e = eth();
    setHasWallet(!!e);
    if (!e) return;

    const saved = localStorage.getItem("rl-wallet");
    if (saved) {
      // Silently check if still authorised
      e.request({ method:"eth_accounts" }).then((accounts: string[]) => {
        if (accounts.includes(saved) || accounts.some((a:string)=>a.toLowerCase()===saved.toLowerCase())) {
          applyAccount(accounts[0]);
        } else {
          localStorage.removeItem("rl-wallet");
        }
      }).catch(()=>{});
    }

    // Listeners
    const onAccounts = (accounts: string[]) => {
      if (accounts.length) applyAccount(accounts[0]);
      else { setAddress(""); setSigner(null); setBalance("0.00"); localStorage.removeItem("rl-wallet"); }
    };
    const onChain = (hex: string) => setChainId(parseInt(hex, 16));

    e.on("accountsChanged", onAccounts);
    e.on("chainChanged",    onChain);
    return () => { e.removeListener("accountsChanged", onAccounts); e.removeListener("chainChanged", onChain); };
  }, [applyAccount]);

  const connect = useCallback(async () => {
    const e = eth();
    if (!e) { alert("No wallet found. Please install MetaMask."); return; }
    setConnecting(true);
    try {
      const accounts: string[] = await e.request({ method:"eth_requestAccounts" });
      if (accounts[0]) await applyAccount(accounts[0]);
    } catch (err: any) {
      if (err.code !== 4001) console.error("connect:", err);
    } finally { setConnecting(false); }
  }, [applyAccount]);

  const disconnect = useCallback(() => {
    setAddress(""); setSigner(null); setProvider(null); setBalance("0.00");
    localStorage.removeItem("rl-wallet");
  }, []);

  const switchToArc = useCallback(async () => {
    const e = eth();
    if (!e) return;
    try {
      await e.request({ method:"wallet_switchEthereumChain", params:[{chainId:ARC_CHAIN_HEX}] });
    } catch (err: any) {
      if (err.code === 4902 || err.code === -32603) {
        await e.request({ method:"wallet_addEthereumChain", params:[ARC_PARAMS] });
      }
    }
  }, []);

  const isConnected   = !!address;
  const isWrongNetwork= isConnected && chainId !== null && chainId !== ARC_CHAIN_ID;
  const shortAddress  = address ? `${address.slice(0,6)}…${address.slice(-4)}` : "";

  return (
    <Ctx.Provider value={{ address, shortAddress, isConnected, isWrongNetwork, chainId, usdcBalance:balance, provider, signer, hasWallet, connecting, connect, disconnect, switchToArc, refreshBalance }}>
      {children}
    </Ctx.Provider>
  );
}

export const useWallet = () => useContext(Ctx);
