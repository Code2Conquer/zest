"use client";

import Image from "next/image";
import { OrderNote, type OrderCard } from "@/components/landing/hero-phone";

// The first screen's picture: a large photograph of the food, with the order that just came in sliding
// over its corner once.

export function HeroPhoto({ photo, alt, order }: { photo: string; alt: string; order: OrderCard }) {
  return (
    <div className="relative mx-auto w-full max-w-[460px] pb-8 pl-8 sm:pl-14 lg:mr-0">
      <div className="hero-rise relative aspect-[4/5] overflow-hidden rounded-[32px]">
        <Image src={photo} alt={alt} fill sizes="(min-width: 1024px) 460px, 90vw" preload className="object-cover" />
      </div>
      <OrderNote order={order} />
    </div>
  );
}
