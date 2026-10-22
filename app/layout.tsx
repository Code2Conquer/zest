import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Anek_Devanagari, Anek_Latin, IBM_Plex_Mono, Kalam } from "next/font/google";
import { AppStateProvider } from "@/lib/state";
import "./globals.css";

// One family, two scripts: Anek (Ek Type) draws Latin and Devanagari to the same
// proportions, so Hindi and English sit together without a font switch.
const latin = Anek_Latin({ subsets: ["latin", "latin-ext"], variable: "--font-anek-latin", display: "swap", axes: ["wdth"], preload: false });
// Devanagari is large (~700 KB with the width axis), so it isn't preloaded: English readers never
// download it, and Hindi readers get it as soon as the page shows Devanagari.
const deva = Anek_Devanagari({ subsets: ["devanagari"], variable: "--font-anek-deva", display: "swap", axes: ["wdth"], preload: false });
// The public website's fonts live in components/landing/site-fonts.ts.
// Thermal-printer type, used only inside KOT tickets and receipts.
// Handwriting (Indian Type Foundry, Latin and Devanagari), only for the seller's handwritten menu note.
const hand = Kalam({ subsets: ["latin", "devanagari"], weight: ["400", "700"], variable: "--font-hand", display: "swap", preload: false });
const kot = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-kot", display: "swap", preload: false });

export const metadata: Metadata = {
  title: "Zest · Online orders for home kitchens and stalls",
  description: "Get online orders for your home kitchen, tiffin service or stall. Your own ordering page, WhatsApp orders, UPI payments, and delivery by you or by Zomato riders. Free to start.",
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
    <html lang="en" className={`${latin.variable} ${deva.variable} ${kot.variable} ${hand.variable}`} suppressHydrationWarning>
      <body>
        {/* Apply the saved light/dark choice before hydration, so the page doesn't flash. */}
        <Script id="zest-theme" strategy="beforeInteractive">{`try{var t=localStorage.getItem("zest:theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`}</Script>
        <AppStateProvider>{children}</AppStateProvider>
      </body>
    </html>
  );
}
