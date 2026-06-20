"use client";
import { ReactNode } from "react";
import { ThemeProvider } from "../lib/theme";
import { WalletProvider } from "../lib/wallet";
import { BrandProvider } from "../lib/brand";
import WalletModal from "../components/ui/WalletModal";
import UsernameModal from "../components/ui/UsernameModal";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <BrandProvider>
      <ThemeProvider>
        <WalletProvider>
          <WalletModal/>
          <UsernameModal/>
          {children}
        </WalletProvider>
      </ThemeProvider>
    </BrandProvider>
  );
}
