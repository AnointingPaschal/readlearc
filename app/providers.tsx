"use client";
import { ReactNode } from "react";
import { ThemeProvider } from "../lib/theme";
import { WalletProvider } from "../lib/wallet";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <WalletProvider>{children}</WalletProvider>
    </ThemeProvider>
  );
}
