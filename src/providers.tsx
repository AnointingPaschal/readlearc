import type { ReactNode } from "react";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import { BrandProvider } from "@/lib/brand";
import AuthModal from "@/components/ui/AuthModal";
import TxModal from "@/components/ui/TxModal";
import ChainActivity from "@/components/ui/ChainActivity";
import UsernameModal from "@/components/ui/UsernameModal";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <BrandProvider>
      <ThemeProvider>
        <AuthProvider>
          <AuthModal />
          <TxModal />
          <UsernameModal />
          <ChainActivity />
          {children}
        </AuthProvider>
      </ThemeProvider>
    </BrandProvider>
  );
}
