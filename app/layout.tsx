import type { Metadata, Viewport } from "next";
import { Anek_Devanagari, Anek_Latin } from "next/font/google";
import { AppStateProvider } from "@/lib/state";
import "./globals.css";

// One family, two scripts: Anek (Ek Type) draws Latin and Devanagari to the same
// proportions, so Hindi and English sit together without a font switch.
const latin = Anek_Latin({ subsets: ["latin"], variable: "--font-anek-latin", display: "swap", axes: ["wdth"] });
const deva = Anek_Devanagari({ subsets: ["devanagari"], variable: "--font-anek-deva", display: "swap", axes: ["wdth"] });

export const metadata: Metadata = {
  title: "Zest",
  description: "Run your restaurant on Zomato, Swiggy and dine-in, with an AI copilot.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef0ed" },
    { media: "(prefers-color-scheme: dark)", color: "#111613" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${latin.variable} ${deva.variable}`}>
      <body>
        <AppStateProvider>{children}</AppStateProvider>
      </body>
    </html>
  );
}
