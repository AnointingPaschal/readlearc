import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-[#0a0a0f] text-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
