"use client";
/**
 * Thin wrapper around Wagmi/RainbowKit hooks that keeps the same
 * useWallet() API the rest of the app depends on.
 * ethers.js is used for contract interactions; viem handles the connection.
 */
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { ethers } from "ethers";
import { useAccount, useConnect, useDisconnect, useWalletClient, usePublicClient, useSwitchChain } from "wagmi";
import { USDC_ADDRESS, USDC_ABI } from "./chain";
import { arcTestnet } from "./wagmi";

interface WalletCtx {
  address:      string;
  shortAddress: string;
  isConnected:  boolean;
  usdcBalance:  string;
  signer:       ethers.Signer | null;
  provider:     ethers.Provider | null;
  chainId:      number | undefined;
  isWrongNetwork: boolean;
  connect:      () => void;
  disconnect:   () => void;
  switchToArc:  () => Promise<void>;
  refreshBalance: () => Promise<void>;
}

const Ctx = createContext<WalletCtx>({
  address:"", shortAddress:"", isConnected:false, usdcBalance:"0.00",
  signer:null, provider:null, chainId:undefined, isWrongNetwork:false,
  connect:()=>{}, disconnect:()=>{}, switchToArc:async()=>{}, refreshBalance:async()=>{},
});

function WalletContextBridge({ children }: { children: ReactNode }) {
  const { address, isConnected, chainId } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { disconnectAsync }           = useDisconnect();
  const { data: walletClient }        = useWalletClient();
  const publicClient                  = usePublicClient();
  const { switchChainAsync }          = useSwitchChain();

  const [signer,      setSigner]      = useState<ethers.Signer | null>(null);
  const [provider,    setProvider]    = useState<ethers.Provider | null>(null);
  const [usdcBalance, setUsdcBalance] = useState("0.00");

  const isWrongNetwork = isConnected && chainId !== arcTestnet.id;

  // Build ethers signer from wagmi walletClient
  useEffect(() => {
    if (!walletClient) { setSigner(null); return; }
    try {
      const { account, chain, transport } = walletClient;
      const network = { chainId: chain.id, name: chain.name };
      const ethProv = new ethers.BrowserProvider(transport as any, network);
      ethProv.getSigner(account.address).then(s => setSigner(s)).catch(() => setSigner(null));
    } catch { setSigner(null); }
  }, [walletClient]);

  // Build ethers provider from publicClient
  useEffect(() => {
    if (!publicClient) { setProvider(null); return; }
    try {
      const { chain, transport } = publicClient;
      const network = { chainId: chain.id, name: chain.name };
      const prov = new ethers.BrowserProvider(transport as any, network);
      setProvider(prov);
    } catch { setProvider(null); }
  }, [publicClient]);

  // Fetch USDC balance
  const refreshBalance = useCallback(async () => {
    if (!address || !USDC_ADDRESS || !provider) return;
    try {
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);
      const bal  = await usdc.balanceOf(address);
      const dec  = await usdc.decimals();
      setUsdcBalance(parseFloat(ethers.formatUnits(bal, dec)).toFixed(4));
    } catch { setUsdcBalance("0.00"); }
  }, [address, provider, USDC_ADDRESS]);

  useEffect(() => { refreshBalance(); }, [refreshBalance]);

  const connect = useCallback(() => {
    const injected = connectors.find(c => c.id === "injected" || c.id === "metaMask" || c.name?.toLowerCase().includes("injected"));
    const target   = injected || connectors[0];
    if (target) connectAsync({ connector: target }).catch(() => {});
  }, [connectors, connectAsync]);

  const disconnect = useCallback(() => {
    disconnectAsync().catch(() => {});
    setUsdcBalance("0.00");
  }, [disconnectAsync]);

  const switchToArc = useCallback(async () => {
    try {
      await switchChainAsync?.({ chainId: arcTestnet.id });
    } catch (e: any) {
      // If switchChain fails, try wallet_addEthereumChain directly
      if (typeof window !== "undefined" && (window as any).ethereum) {
        try {
          await (window as any).ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId:         `0x${arcTestnet.id.toString(16)}`,
              chainName:       arcTestnet.name,
              nativeCurrency:  arcTestnet.nativeCurrency,
              rpcUrls:         arcTestnet.rpcUrls.default.http,
              blockExplorerUrls: [arcTestnet.blockExplorers?.default.url],
            }],
          });
        } catch {}
      }
    }
  }, [switchChainAsync]);

  const shortAddress = address ? `${address.slice(0,6)}…${address.slice(-4)}` : "";

  return (
    <Ctx.Provider value={{
      address: address || "", shortAddress, isConnected, usdcBalance,
      signer, provider, chainId, isWrongNetwork,
      connect, disconnect, switchToArc, refreshBalance,
    }}>
      {children}
    </Ctx.Provider>
  );
}

// We export WalletProvider as a wrapper that must be placed inside
// RainbowKit/Wagmi providers (see app/layout.tsx)
export function WalletProvider({ children }: { children: ReactNode }) {
  return <WalletContextBridge>{children}</WalletContextBridge>;
}

export const useWallet = () => useContext(Ctx);
