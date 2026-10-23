"use client";

import { useEffect, useRef } from "react";

// A Lottie animation, loaded after the page is up (lottie-web's light SVG player and the JSON both come
// in lazily). With reduced motion it shows a still frame.

export function LottieIcon({ src, className = "" }: { src: string; className?: string }) {
  const box = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let anim: { destroy: () => void; goToAndStop: (f: number, isFrame: boolean) => void } | null = null;
    let gone = false;
    (async () => {
      const [{ default: lottie }, data] = await Promise.all([import("lottie-web/build/player/lottie_light"), fetch(src).then((r) => r.json())]);
      if (gone || !box.current) return;
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      anim = lottie.loadAnimation({ container: box.current, renderer: "svg", loop: !still, autoplay: !still, animationData: data });
      if (still) anim.goToAndStop(20, true);
    })().catch(() => {});
    return () => {
      gone = true;
      anim?.destroy();
    };
  }, [src]);
  return <span ref={box} aria-hidden className={`block ${className}`} />;
}
