import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Readlearc — Pay per word. Own every read.",
  description: "Pay-per-read publishing on Arc blockchain. Writers earn 85% in USDC instantly.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html:
          `try{var t=localStorage.getItem("rl-theme");if(t==="dark")document.documentElement.setAttribute("data-theme","dark")}catch(e){}`
        }}/>
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
