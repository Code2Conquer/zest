"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** JSON fetch against our API. Throws ApiError with the server's message on failure. */
export async function api<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(path, {
    ...rest,
    headers: json !== undefined ? { "Content-Type": "application/json", ...rest.headers } : rest.headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string } | null)?.error ?? `Request failed (${res.status})`);
  return data as T;
}

const REFRESH = "zest:refresh";

/** Tells every mounted useApi hook to refetch, e.g. after an approval changes data. */
export function refreshAll() {
  window.dispatchEvent(new Event(REFRESH));
}

/** Loads a GET endpoint and keeps it fresh when refreshAll() is called. */
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!path);
  const current = useRef(path);
  current.current = path;

  const load = useCallback(async () => {
    if (!current.current) return;
    const p = current.current;
    try {
      const d = await api<T>(p);
      if (current.current === p) {
        setData(d);
        setError(null);
      }
    } catch (e) {
      if (current.current === p) setError((e as Error).message);
    } finally {
      if (current.current === p) setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(!!path);
    void load();
  }, [path, load]);

  useEffect(() => {
    const on = () => void load();
    window.addEventListener(REFRESH, on);
    return () => window.removeEventListener(REFRESH, on);
  }, [load]);

  return { data, error, loading, reload: load, setData };
}
