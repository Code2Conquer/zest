"use client";

import { useEffect } from "react";

/**
 * While a panel is open, the page behind it stays put: only the panel scrolls. Keeps the page where it was
 * and leaves the scrollbar's space, so nothing behind jumps.
 */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const { documentElement: html, body } = document;
    const gap = window.innerWidth - html.clientWidth;
    const before = { html: html.style.overflow, body: body.style.overflow, pad: body.style.paddingRight };
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    return () => {
      html.style.overflow = before.html;
      body.style.overflow = before.body;
      body.style.paddingRight = before.pad;
    };
  }, [locked]);
}
