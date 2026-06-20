"use client";
import { ReactNode } from "react";
import { WagmiProvider }       from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { ThemeProvider, useTheme } from "../lib/theme";
import { WalletProvider }      from "../lib/wallet";
import { wagmiConfig }         from "../lib/wagmi";

const queryClient = new QueryClient();

// Custom RainbowKit theme matching Readlearc brand
const rlLight = lightTheme({
  accentColor:          "#6d28d9",
  accentColorForeground:"#ffffff",
  borderRadius:         "medium",
  fontStack:            "system",
});

const rlDark = darkTheme({
  accentColor:          "#8b5cf6",
  accentColorForeground:"#ffffff",
  borderRadius:         "medium",
  fontStack:            "system",
  overlayBlur:          "small",
});

// Inner component so we can read theme from context
function RainbowWrapper({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  return (
    <RainbowKitProvider
      theme={theme === "dark" ? rlDark : rlLight}
      locale="en-US"
      showRecentTransactions={false}
    >
      <WalletProvider>
        {children}
      </WalletProvider>
    </RainbowKitProvider>
  );
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <RainbowWrapper>
            {children}
          </RainbowWrapper>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
