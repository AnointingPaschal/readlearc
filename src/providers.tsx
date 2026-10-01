import type { ReactNode } from "react";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import { BrandProvider } from "@/lib/brand";
import AuthModal from "@/components/ui/AuthModal";
import TxApproval from "@/components/ui/TxApproval";
import ChainActivity from "@/components/ui/ChainActivity";
import ErrorBoundary from "@/components/ErrorBoundary";
import UsernameModal from "@/components/ui/UsernameModal";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <BrandProvider>
      <ThemeProvider>
        <AuthProvider>
          <AuthModal />
          <TxApproval />
          <UsernameModal />
          <ChainActivity />
          <ErrorBoundary>{children}</ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </BrandProvider>
  );
}
