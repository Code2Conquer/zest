import { Noto_Sans_Devanagari, Plus_Jakarta_Sans } from "next/font/google";

// The website's type (homepage, /restaurants and onboarding): Plus Jakarta Sans for everything, a friendly
// geometric sans in the spirit of Airbnb's Cereal; Noto Sans Devanagari for Hindi. Headlines use its 800.
export const site = Plus_Jakarta_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-site", display: "swap", weight: ["400", "500", "600", "700", "800"] });
export const siteDeva = Noto_Sans_Devanagari({ subsets: ["devanagari"], variable: "--font-site-deva", display: "swap", preload: false });
export const siteFonts = `${site.variable} ${siteDeva.variable}`;
