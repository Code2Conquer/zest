import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Kalam } from "next/font/google";
import { AppStateProvider } from "@/lib/state";
import { siteFonts } from "@/components/landing/site-fonts";
import "./globals.css";

// Plus Jakarta Sans and Noto Sans Devanagari (components/landing/site-fonts.ts) everywhere: website, ordering pages and owner app.
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
  // Zest is dark everywhere: the website, the ordering pages and the owner app.
  themeColor: "#1c1f23",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={`${siteFonts} ${kot.variable} ${hand.variable}`} suppressHydrationWarning>
      <body>
        <AppStateProvider>{children}</AppStateProvider>
      </body>
    </html>
  );
}
