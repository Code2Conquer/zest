"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "./api";
import type { OrderDTO } from "./types";

const POLL_MS = 10_000;
const ERROR_WINDOW_MS = 30_000;

/**
 * Follows order changes live over server-sent events. If the stream fails twice within 30 seconds
 * (some networks and hosts cut it), falls back to fetching the order list every 10 seconds.
 */
export function useOrderStream(onOrders: (orders: OrderDTO[]) => void, enabled = true): { mode: "live" | "polling" } {
  const [mode, setMode] = useState<"live" | "polling">("live");
  const handler = useRef(onOrders);
  handler.current = onOrders;

  useEffect(() => {
    if (!enabled) return;
    if (mode === "polling") {
      const t = setInterval(() => void api<OrderDTO[]>("/api/orders").then((o) => handler.current(o), () => {}), POLL_MS);
      return () => clearInterval(t);
    }
    const es = new EventSource("/api/orders/stream");
    const errors: number[] = [];
    es.addEventListener("orders", (e) => handler.current(JSON.parse((e as MessageEvent<string>).data) as OrderDTO[]));
    es.onerror = () => {
      const now = Date.now();
      errors.push(now);
      if (errors.filter((t) => now - t < ERROR_WINDOW_MS).length >= 2) {
        es.close();
        setMode("polling");
      }
    };
    return () => es.close();
  }, [mode, enabled]);

  return { mode };
}
