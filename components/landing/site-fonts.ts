import { Bricolage_Grotesque, Inter, Noto_Sans_Devanagari } from "next/font/google";

// The public website's type (homepage and /restaurants): Inter, with Noto Sans Devanagari for Hindi.
// Declared here rather than in the root layout, so only these pages preload Inter and the owner app
// never downloads it. Devanagari isn't preloaded: English readers never need it.
export const site = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-site", display: "swap" });
export const siteDeva = Noto_Sans_Devanagari({ subsets: ["devanagari"], variable: "--font-site-deva", display: "swap", preload: false });
// Headlines: Bricolage Grotesque, a grotesque with a little warmth and ink-trap character at heavy weights.
export const siteDisplay = Bricolage_Grotesque({ subsets: ["latin", "latin-ext"], variable: "--font-site-display", display: "swap", weight: ["700", "800"] });
export const siteFonts = `${site.variable} ${siteDeva.variable} ${siteDisplay.variable}`;
