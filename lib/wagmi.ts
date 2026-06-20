import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";

// ─── Arc Testnet ─────────────────────────────────────────────────
export const arcTestnet = defineChain({
  id:   5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.arc.network"] },
    public:  { http: ["https://rpc.testnet.arc.network"] },
  },
  blockExplorers: {
    default: { name: "ArcScan", url: "https://testnet.arcscan.app" },
  },
  testnet: true,
});

// ─── Wagmi + RainbowKit config ────────────────────────────────────
// Get a free WalletConnect Project ID at: https://cloud.walletconnect.com
// Set as NEXT_PUBLIC_WC_PROJECT_ID in Vercel env vars
export const wagmiConfig = getDefaultConfig({
  appName:   "Readlearc",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "readlearc",
  chains:    [arcTestnet],
  ssr:       true,
});
