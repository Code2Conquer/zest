import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zest for restaurants · Orders Zomato and Swiggy never see",
  description: "For restaurants on Zomato and Swiggy: take phone, WhatsApp and party orders on your own page, delivered by Zomato riders, and hear every order from Zomato, Swiggy and your page on the Zest Soundbox.",
};

export default function RestaurantsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
