"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-reads the order every 20 seconds while it's still on its way, so the page follows it without a reload. */
export function Refresh({ live }: { live: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => router.refresh(), 20_000);
    return () => clearInterval(t);
  }, [live, router]);
  return null;
}
