import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zest for restaurants · Never miss an order",
  description: "For restaurants on Zomato and Swiggy: the Zest Soundbox speaks every order, your own ordering page brings regulars to you, and a morning summary tells you how each app did.",
};

export default function RestaurantsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
