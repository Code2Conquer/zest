import type { Metadata, Viewport } from "next";
import { Anek_Devanagari, Anek_Latin, IBM_Plex_Mono } from "next/font/google";
import { AppStateProvider } from "@/lib/state";
import "./globals.css";

// One family, two scripts: Anek (Ek Type) draws Latin and Devanagari to the same
// proportions, so Hindi and English sit together without a font switch.
const latin = Anek_Latin({ subsets: ["latin"], variable: "--font-anek-latin", display: "swap", axes: ["wdth"] });
const deva = Anek_Devanagari({ subsets: ["devanagari"], variable: "--font-anek-deva", display: "swap", axes: ["wdth"] });
// Thermal-printer type, used only inside KOT tickets and receipts.
const kot = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-kot", display: "swap" });

export const metadata: Metadata = {
  title: "Zest",
  description: "Your kitchen, online in a minute. Your own ordering page, WhatsApp orders, UPI payments and delivery by Zomato riders, run by Zest's AI agents.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf6" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1f23" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${latin.variable} ${deva.variable} ${kot.variable}`} suppressHydrationWarning>
      <head>
        {/* Apply the saved light/dark choice before the first paint, so the page never flashes. */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem("zest:theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}` }} />
      </head>
      <body>
        <AppStateProvider>{children}</AppStateProvider>
      </body>
    </html>
  );
}
