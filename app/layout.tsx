import type { Metadata } from "next";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Readlearc — Pay per word. Own every read.",
  description: "A pay-per-read publishing platform on Arc blockchain. Writers earn 85% in USDC instantly. Readers hold cryptographic proof of every article unlocked.",
  keywords: ["pay-per-read","Arc","USDC","Circle","web3","blockchain","articles"],
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
        <script dangerouslySetInnerHTML={{ __html:
          `try{var t=localStorage.getItem('rl-theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark')}catch(e){}`
        }}/>
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
