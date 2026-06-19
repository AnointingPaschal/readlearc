import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "../lib/theme";
import { WalletProvider } from "../lib/wallet";

export const metadata: Metadata = {
  title: "Readlearc — Pay per word. Own every read.",
  description: "A pay-per-read publishing platform built on Arc blockchain. Writers earn USDC instantly. Readers own every article they unlock.",
  keywords: ["pay-per-read","Arc","USDC","Circle","web3","articles","blockchain"],
  openGraph: {
    title: "Readlearc — Pay per word. Own every read.",
    description: "Pay-per-read articles on Arc. USDC nanopayments. Sub-second settlement.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('rl-theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark')}catch(e){}` }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <WalletProvider>
            {children}
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
