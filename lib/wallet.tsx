"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { ethers } from "ethers";

// ── Arc Testnet ───────────────────────────────────────────────────
export const ARC = {
  chainId:  5042002,
  chainHex: "0x" + (5042002).toString(16),   // 0x4cef52
  name:     "Arc Testnet",
  rpc:      "https://rpc.testnet.arc.network",
  explorer: "https://testnet.arcscan.app",
  currency: { name: "USDC", symbol: "USDC", decimals: 6 },
};

export const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS ||
  "0x3600000000000000000000000000000000000000";

export const USDC_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function transfer(address, uint256) returns (bool)",
  "function approve(address, uint256) returns (bool)",
  "function allowance(address, address) view returns (uint256)",
];

// ── EIP-6963: discovered wallet providers ─────────────────────────
export interface WalletInfo {
  uuid:     string;
  name:     string;
  icon:     string;   // data URL
  rdns:     string;
  provider: any;
}

// ── Wallet state ──────────────────────────────────────────────────
interface WalletCtx {
  address:       string;
  short:         string;
  connected:     boolean;
  wrongNetwork:  boolean;
  chainId:       number | null;
  balance:       string;
  signer:        ethers.JsonRpcSigner | null;
  provider:      ethers.BrowserProvider | null;
  hasWallet:     boolean;
  busy:          boolean;
  wallets:       WalletInfo[];       // discovered wallets
  modalOpen:     boolean;
  setModalOpen:  (v: boolean) => void;
  connectWith:   (wallet: WalletInfo) => Promise<void>;
  connect:       () => void;          // opens modal
  disconnect:    () => void;
  addArc:        () => Promise<void>;
  refresh:       () => Promise<void>;
}

const Ctx = createContext<WalletCtx>({
  address:"", short:"", connected:false, wrongNetwork:false,
  chainId:null, balance:"0.00", signer:null, provider:null,
  hasWallet:false, busy:false, wallets:[], modalOpen:false,
  setModalOpen:()=>{}, connectWith:async()=>{}, connect:()=>{},
  disconnect:()=>{}, addArc:async()=>{}, refresh:async()=>{},
});

// ── Built-in wallet fallbacks (EIP-1193) ──────────────────────────
const BUILTIN_WALLETS = [
  { rdns:"io.metamask",          name:"MetaMask",        color:"#F6851B", icon:"M" },
  { rdns:"com.coinbase.wallet",  name:"Coinbase Wallet", color:"#0052FF", icon:"C" },
  { rdns:"com.brave.wallet",     name:"Brave Wallet",    color:"#FF2050", icon:"B" },
  { rdns:"io.rabby",             name:"Rabby",           color:"#7B3FE4", icon:"R" },
  { rdns:"me.rainbow",           name:"Rainbow",         color:"#FF6B6B", icon:"W" },
];

function detectLegacyWallet(): WalletInfo | null {
  const eth = (window as any).ethereum;
  if (!eth) return null;
  let name = "Browser Wallet";
  let color = "#6d28d9";
  if (eth.isMetaMask)      { name = "MetaMask";        color = "#F6851B"; }
  else if (eth.isBraveWallet){ name = "Brave Wallet";  color = "#FF2050"; }
  else if (eth.isCoinbaseWallet){ name = "Coinbase Wallet"; color = "#0052FF"; }
  return { uuid:"legacy", name, icon:"", rdns:"legacy", provider: eth };
}

// ── Provider ──────────────────────────────────────────────────────
export function WalletProvider({ children }: { children: ReactNode }) {
  const [address,    setAddress]    = useState("");
  const [chainId,    setChainId]    = useState<number|null>(null);
  const [balance,    setBalance]    = useState("0.00");
  const [provider,   setProvider]   = useState<ethers.BrowserProvider|null>(null);
  const [signer,     setSigner]     = useState<ethers.JsonRpcSigner|null>(null);
  const [busy,       setBusy]       = useState(false);
  const [hasWallet,  setHasWallet]  = useState(false);
  const [wallets,    setWallets]    = useState<WalletInfo[]>([]);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [activeProvider, setActiveProvider] = useState<any>(null);

  // EIP-6963: discover wallets
  useEffect(() => {
    if (typeof window === "undefined") return;

    const discovered: WalletInfo[] = [];

    function onAnnounce(event: any) {
      const { info, provider } = event.detail;
      if (!discovered.find(w => w.uuid === info.uuid)) {
        discovered.push({ ...info, provider });
        setWallets([...discovered]);
      }
    }
    window.addEventListener("eip6963:announceProvider", onAnnounce as EventListener);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    // After 500ms, check if any wallets were found, if not use legacy
    const t = setTimeout(() => {
      if (discovered.length === 0) {
        const legacy = detectLegacyWallet();
        if (legacy) { setWallets([legacy]); setHasWallet(true); }
        else setHasWallet(false);
      } else {
        setHasWallet(true);
      }
    }, 500);

    return () => {
      window.removeEventListener("eip6963:announceProvider", onAnnounce as EventListener);
      clearTimeout(t);
    };
  }, []);

  // Hydrate: build ethers objects from a raw provider
  const hydrate = useCallback(async (rawProvider: any, addr: string) => {
    try {
      const prov = new ethers.BrowserProvider(rawProvider);
      const net  = await prov.getNetwork();
      const id   = Number(net.chainId);
      const s    = await prov.getSigner(addr);
      setProvider(prov); setSigner(s); setChainId(id);
      setActiveProvider(rawProvider);
      // USDC balance
      try {
        const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, prov);
        const [b, d] = await Promise.all([usdc.balanceOf(addr), usdc.decimals()]);
        setBalance(parseFloat(ethers.formatUnits(b, d)).toFixed(4));
      } catch { setBalance("0.00"); }
    } catch (e) { console.error("hydrate:", e); }
  }, []);

  // Boot: auto-reconnect
  useEffect(() => {
    if (typeof window === "undefined") return;
    const eth = (window as any).ethereum;
    if (eth) {
      eth.request({ method: "eth_chainId" })
        .then((h: string) => setChainId(parseInt(h, 16))).catch(()=>{});
    }
    const saved = localStorage.getItem("rl-addr");
    const savedProvider = localStorage.getItem("rl-provider") || "legacy";
    if (saved && eth) {
      eth.request({ method: "eth_accounts" }).then((accs: string[]) => {
        if (accs.find((a: string) => a.toLowerCase() === saved.toLowerCase())) {
          setAddress(accs[0]);
          hydrate(eth, accs[0]);
        } else { localStorage.removeItem("rl-addr"); }
      }).catch(()=>{});
    }

    // Listeners
    function onAccounts(accs: string[]) {
      if (!accs.length) { disconnect(); return; }
      setAddress(accs[0]);
      localStorage.setItem("rl-addr", accs[0]);
      const prov = (window as any).ethereum;
      if (prov) hydrate(prov, accs[0]);
    }
    function onChain(h: string) {
      const id = parseInt(h, 16);
      setChainId(id);
    }
    eth?.on("accountsChanged", onAccounts);
    eth?.on("chainChanged", onChain);
    return () => { eth?.removeListener("accountsChanged", onAccounts); eth?.removeListener("chainChanged", onChain); };
  // eslint-disable-next-line
  }, []);

  // Connect with a specific wallet
  const connectWith = useCallback(async (wallet: WalletInfo) => {
    setBusy(true); setModalOpen(false);
    try {
      const accs: string[] = await wallet.provider.request({ method: "eth_requestAccounts" });
      if (accs[0]) {
        setAddress(accs[0]);
        localStorage.setItem("rl-addr", accs[0]);
        localStorage.setItem("rl-provider", wallet.rdns);
        await hydrate(wallet.provider, accs[0]);
      }
    } catch (e: any) { if (e.code !== 4001) console.error(e); }
    finally { setBusy(false); }
  }, [hydrate]);

  // Connect: open modal (or connect directly if only one wallet)
  const connect = useCallback(() => {
    const legacy = detectLegacyWallet();
    const available = wallets.length > 0 ? wallets : (legacy ? [legacy] : []);
    if (available.length === 1) { connectWith(available[0]); return; }
    if (available.length === 0) { alert("No wallet found. Install MetaMask from metamask.io"); return; }
    setModalOpen(true);
  }, [wallets, connectWith]);

  const disconnect = useCallback(() => {
    setAddress(""); setSigner(null); setProvider(null);
    setBalance("0.00"); setActiveProvider(null);
    localStorage.removeItem("rl-addr");
    localStorage.removeItem("rl-provider");
  }, []);

  const addArc = useCallback(async () => {
    const rawProvider = activeProvider || (window as any)?.ethereum;
    if (!rawProvider) throw new Error("No wallet connected");
    try {
      await rawProvider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ARC.chainHex }],
      });
    } catch (err: any) {
      if (err.code === 4902 || err.code === -32603 ||
          (err.message && err.message.includes("Unrecognized chain"))) {
        await rawProvider.request({
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
  }, [activeProvider]);

  const refresh = useCallback(async () => {
    const rawProvider = activeProvider || (window as any)?.ethereum;
    if (address && rawProvider) await hydrate(rawProvider, address);
  }, [address, activeProvider, hydrate]);

  const connected    = !!address;
  const wrongNetwork = connected && chainId !== null && chainId !== ARC.chainId;
  const short        = address ? `${address.slice(0,6)}…${address.slice(-4)}` : "";

  return (
    <Ctx.Provider value={{
      address, short, connected, wrongNetwork, chainId, balance, signer, provider,
      hasWallet, busy, wallets, modalOpen, setModalOpen,
      connectWith, connect, disconnect, addArc, refresh,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useWallet = () => useContext(Ctx);
