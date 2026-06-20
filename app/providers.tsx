"use client";
import { ReactNode } from "react";
import { ThemeProvider } from "../lib/theme";
import { WalletProvider } from "../lib/wallet";
import WalletModal from "../components/ui/WalletModal";
import UsernameModal from "../components/ui/UsernameModal";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <WalletProvider>
        <WalletModal/>
        <UsernameModal/>
        {children}
      </WalletProvider>
    </ThemeProvider>
  );
}
