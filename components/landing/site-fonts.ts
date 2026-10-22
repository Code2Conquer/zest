import { Inter, Noto_Sans_Devanagari } from "next/font/google";

// The public website's type (homepage and /restaurants): Inter, with Noto Sans Devanagari for Hindi.
// Declared here rather than in the root layout, so only these pages preload Inter and the owner app
// never downloads it. Devanagari isn't preloaded: English readers never need it.
export const site = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-site", display: "swap" });
export const siteDeva = Noto_Sans_Devanagari({ subsets: ["devanagari"], variable: "--font-site-deva", display: "swap", preload: false });
export const siteFonts = `${site.variable} ${siteDeva.variable}`;
