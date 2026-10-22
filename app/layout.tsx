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
  description: "AI agents that run your restaurant online: your website, Google, Zomato, Swiggy, payouts and reviews, around the clock.",
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
    <html lang="en" className={`${latin.variable} ${deva.variable}`} suppressHydrationWarning>
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
