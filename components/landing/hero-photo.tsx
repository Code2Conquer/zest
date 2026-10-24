"use client";

import Image from "next/image";
import { OrderCard, type StripOrder } from "@/components/landing/photo-strip";

// The first screen's picture: a large photograph of the food, framed at its own shape on wide screens,
// with the order that just came in sliding over its corner once. On a phone it's a short banner with a
// smaller order card inside it, so the first screen isn't all photo.

export function HeroPhoto({ photo, alt, order, ratio = "4 / 5" }: { photo: string; alt: string; order: StripOrder; ratio?: string }) {
  return (
    <div className="relative mx-auto w-full sm:max-w-[520px] sm:pb-8 sm:pl-14 lg:mr-0">
      <div className="hero-rise relative aspect-[16/10] overflow-hidden rounded-[24px] sm:aspect-[var(--r)] sm:rounded-[32px]" style={{ "--r": ratio } as React.CSSProperties}>
        <Image src={photo} alt={alt} fill sizes="(min-width: 1024px) 460px, (min-width: 640px) 520px, 100vw" preload fetchPriority="high" quality={60} className="object-cover" />
      </div>
      {/* The order that just came in, in the same card as the rail's, sliding over the photo's corner */}
      <div className="hero-note absolute bottom-0 left-0 w-[250px] max-sm:bottom-3 max-sm:left-3 max-sm:w-[230px] max-sm:origin-bottom-left max-sm:scale-[0.82]">
        <OrderCard o={order} className="relative" />
      </div>
    </div>
  );
}
