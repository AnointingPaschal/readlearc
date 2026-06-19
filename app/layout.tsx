import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "../lib/theme";
import { WalletProvider } from "../lib/web3Context";

export const metadata: Metadata = {
  title: "Readlearc — Pay per word. Own every read.",
  description:
    "A pay-per-read article blog platform built on Arc blockchain. Writers publish content locked behind USDC micro-payments. Readers pay to unlock articles. All payments settle on-chain in under 1 second.",
  keywords: ["pay-per-read", "Arc blockchain", "USDC", "nanopayments", "Circle", "web3 articles"],
  openGraph: {
    title: "Readlearc — Pay per word. Own every read.",
    description: "Pay-per-read articles on Arc blockchain. USDC nanopayments. Sub-second settlement.",
    type: "website",
    url: "https://readlearc.io",
  },
  twitter: {
    card: "summary_large_image",
    title: "Readlearc",
    description: "Pay per word. Own every read.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('rl-theme');
                  if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased" style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
        <ThemeProvider>
          <WalletProvider>
            {children}
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
