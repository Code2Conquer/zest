"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "./api";
import type { OrderDTO } from "./types";

const POLL_MS = 10_000;
const ERROR_WINDOW_MS = 30_000;
const CLOSED = 2; // EventSource.CLOSED

/**
 * Whether to give up on the live stream: it closed for good (the server answered with an error, not a
 * stream), or it failed twice within 30 seconds.
 */
export function shouldPoll(readyState: number, errorTimes: number[], now: number): boolean {
  return readyState === CLOSED || errorTimes.filter((t) => now - t < ERROR_WINDOW_MS).length >= 2;
}

/**
 * Follows order changes live over server-sent events, falling back to fetching the order list every
 * 10 seconds when the stream doesn't work. Pauses while the tab is hidden, to save server time.
 */
export function useOrderStream(onOrders: (orders: OrderDTO[]) => void, enabled = true): { mode: "live" | "polling" } {
  const [mode, setMode] = useState<"live" | "polling">("live");
  const [visible, setVisible] = useState(true);
  const handler = useRef(onOrders);
  handler.current = onOrders;

  useEffect(() => {
    const update = () => setVisible(document.visibilityState !== "hidden");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    if (!enabled || !visible) return;
    const poll = () => void api<OrderDTO[]>("/api/orders").then((o) => handler.current(o), () => {});
    if (mode === "polling") {
      poll();
      const t = setInterval(poll, POLL_MS);
      return () => clearInterval(t);
    }
    const es = new EventSource("/api/orders/stream");
    const errors: number[] = [];
    es.addEventListener("orders", (e) => handler.current(JSON.parse((e as MessageEvent<string>).data) as OrderDTO[]));
    es.onerror = () => {
      errors.push(Date.now());
      if (shouldPoll(es.readyState, errors, Date.now())) {
        es.close();
        setMode("polling");
      }
    };
    return () => es.close();
  }, [mode, enabled, visible]);

  return { mode };
}
