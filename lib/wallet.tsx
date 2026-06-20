"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { ethers } from "ethers";

export const ARC = {
  chainId:  5042002,
  chainHex: "0x" + (5042002).toString(16),
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

export interface WalletInfo {
  uuid:     string;
  name:     string;
  icon:     string;
  rdns:     string;
  provider: any;
}

interface WalletCtx {
  address:      string;
  short:        string;
  connected:    boolean;
  wrongNetwork: boolean;
  chainId:      number | null;
  balance:      string;
  signer:       ethers.JsonRpcSigner | null;
  provider:     ethers.BrowserProvider | null;
  hasWallet:    boolean;
  isMobile:     boolean;
  busy:         boolean;
  wallets:      WalletInfo[];
  modalOpen:    boolean;
  setModalOpen: (v: boolean) => void;
  connectWith:  (w: WalletInfo) => Promise<void>;
  connect:      () => void;
  disconnect:   () => void;
  addArc:       () => Promise<void>;
  refresh:      () => Promise<void>;
}

const Ctx = createContext<WalletCtx>({
  address:"", short:"", connected:false, wrongNetwork:false, chainId:null,
  balance:"0.00", signer:null, provider:null, hasWallet:false, isMobile:false,
  busy:false, wallets:[], modalOpen:false,
  setModalOpen:()=>{}, connectWith:async()=>{}, connect:()=>{},
  disconnect:()=>{}, addArc:async()=>{}, refresh:async()=>{},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address,  setAddress]  = useState("");
  const [chainId,  setChainId]  = useState<number|null>(null);
  const [balance,  setBalance]  = useState("0.00");
  const [provider, setProvider] = useState<ethers.BrowserProvider|null>(null);
  const [signer,   setSigner]   = useState<ethers.JsonRpcSigner|null>(null);
  const [busy,     setBusy]     = useState(false);
  const [hasWallet,setHasWallet]= useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [wallets,  setWallets]  = useState<WalletInfo[]>([]);
  const [modalOpen,setModalOpen]= useState(false);
  const [activeRaw,setActiveRaw]= useState<any>(null);

  const hydrate = useCallback(async (raw: any, addr: string) => {
    try {
      const prov = new ethers.BrowserProvider(raw);
      const net  = await prov.getNetwork();
      const s    = await prov.getSigner(addr);
      setProvider(prov); setSigner(s);
      setChainId(Number(net.chainId));
      setActiveRaw(raw);
      if (USDC_ADDRESS) {
        try {
          const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, prov);
          const [b, d] = await Promise.all([usdc.balanceOf(addr), usdc.decimals()]);
          setBalance(parseFloat(ethers.formatUnits(b, d)).toFixed(4));
        } catch { setBalance("0.00"); }
      }
    } catch (e) { console.error("hydrate:", e); }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect mobile
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobile);

    const eth = (window as any).ethereum;
    setHasWallet(!!eth);

    if (eth) {
      eth.request({ method:"eth_chainId" }).then((h:string) => setChainId(parseInt(h,16))).catch(()=>{});
    }

    // EIP-6963 provider discovery
    const discovered: WalletInfo[] = [];
    function onAnnounce(e: any) {
      const { info, provider } = e.detail;
      if (!discovered.find(w => w.uuid === info.uuid)) {
        discovered.push({ ...info, provider });
        setWallets([...discovered]);
        setHasWallet(true);
      }
    }
    window.addEventListener("eip6963:announceProvider", onAnnounce as EventListener);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    // After 600ms fallback to legacy window.ethereum
    const t = setTimeout(() => {
      if (discovered.length === 0 && eth) {
        let name = "Browser Wallet";
        if (eth.isMetaMask)      name = "MetaMask";
        else if (eth.isBraveWallet) name = "Brave Wallet";
        else if (eth.isCoinbaseWallet) name = "Coinbase Wallet";
        setWallets([{ uuid:"legacy", name, icon:"", rdns:"legacy", provider:eth }]);
        setHasWallet(true);
      }
    }, 600);

    // Auto-reconnect
    const saved = localStorage.getItem("rl-addr");
    if (saved && eth) {
      eth.request({ method:"eth_accounts" }).then((accs:string[]) => {
        const match = accs.find((a:string) => a.toLowerCase() === saved.toLowerCase());
        if (match) { setAddress(match); hydrate(eth, match); }
        else localStorage.removeItem("rl-addr");
      }).catch(()=>{});
    }

    // Events
    function onAccounts(accs:string[]) {
      if (!accs.length) {
        setAddress(""); setSigner(null); setProvider(null); setBalance("0.00");
        localStorage.removeItem("rl-addr");
      } else {
        setAddress(accs[0]);
        localStorage.setItem("rl-addr", accs[0]);
        hydrate(eth, accs[0]);
      }
    }
    function onChain(h:string) { setChainId(parseInt(h,16)); }
    eth?.on("accountsChanged", onAccounts);
    eth?.on("chainChanged", onChain);
    return () => {
      window.removeEventListener("eip6963:announceProvider", onAnnounce as EventListener);
      clearTimeout(t);
      eth?.removeListener("accountsChanged", onAccounts);
      eth?.removeListener("chainChanged", onChain);
    };
  }, [hydrate]);

  // ALWAYS open the modal — never use alert()
  const connect = useCallback(() => { setModalOpen(true); }, []);

  const connectWith = useCallback(async (wallet: WalletInfo) => {
    setBusy(true); setModalOpen(false);
    try {
      const accs:string[] = await wallet.provider.request({ method:"eth_requestAccounts" });
      if (accs[0]) {
        setAddress(accs[0]);
        localStorage.setItem("rl-addr", accs[0]);
        await hydrate(wallet.provider, accs[0]);
      }
    } catch (e:any) { if (e.code !== 4001) console.error(e); }
    finally { setBusy(false); }
  }, [hydrate]);

  const disconnect = useCallback(() => {
    setAddress(""); setSigner(null); setProvider(null);
    setBalance("0.00"); setActiveRaw(null);
    localStorage.removeItem("rl-addr");
  }, []);

  const addArc = useCallback(async () => {
    const raw = activeRaw || (window as any)?.ethereum;
    if (!raw) throw new Error("No wallet connected");
    try {
      await raw.request({ method:"wallet_switchEthereumChain", params:[{ chainId:ARC.chainHex }] });
    } catch (err:any) {
      if (err.code === 4902 || err.code === -32603 ||
          (err.message||"").toLowerCase().includes("unrecognized") ||
          (err.message||"").toLowerCase().includes("does not exist")) {
        await raw.request({
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
  }, [activeRaw]);

  const refresh = useCallback(async () => {
    const raw = activeRaw || (window as any)?.ethereum;
    if (address && raw) await hydrate(raw, address);
  }, [address, activeRaw, hydrate]);

  const connected    = !!address;
  const wrongNetwork = connected && chainId !== null && chainId !== ARC.chainId;
  const short        = address ? address.slice(0,6)+"…"+address.slice(-4) : "";

  return (
    <Ctx.Provider value={{
      address, short, connected, wrongNetwork, chainId, balance, signer, provider,
      hasWallet, isMobile, busy, wallets, modalOpen, setModalOpen,
      connectWith, connect, disconnect, addArc, refresh,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useWallet = () => useContext(Ctx);
