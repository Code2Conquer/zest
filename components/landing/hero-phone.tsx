"use client";

import Image from "next/image";
import { Bike, Check, Plus } from "lucide-react";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// The one object on each page's first screen: the seller's own ordering page on a phone, with real dishes,
// and the order that just came in, sliding over the empty foot of the screen and past the phone's edge. Everything is drawn on the first
// paint; the phone rises once and the order slides in once (CSS only, nothing loops, nothing resizes).

export type HeroPhoneProps = {
  name: Bi;
  meta: Bi;
  cover?: string;
  dishes: { name: Bi; price: number; photo: string }[];
  order?: OrderCard;
};

export type OrderCard = { from: Bi; items: Bi; paid: Bi; rider: Bi };

export function HeroPhone({ name, meta, cover, dishes, order }: HeroPhoneProps) {
  const { pick } = useApp();
  return (
    <div className={`relative mx-auto w-fit ${order ? "pb-6 pl-10 sm:pl-16 lg:mr-0" : ""}`}>
      <div data-ui className="hero-rise w-[262px] rounded-[46px] bg-[#0b0c0e] p-[9px] shadow-[0_50px_100px_-40px_rgb(0_0_0/0.8),inset_0_0_0_1px_rgb(255_255_255/0.08)] sm:w-[300px]">
        <div className="relative h-[540px] overflow-hidden rounded-[38px] bg-[#fafaf6] text-[#1c1f23] sm:h-[580px]">
          <span aria-hidden className="absolute left-1/2 top-2.5 z-10 h-[24px] w-[88px] -translate-x-1/2 rounded-full bg-[#0b0c0e]" />
          {cover ? (
            <div className="relative h-[118px] sm:h-[128px]">
              <Image src={cover} alt="" fill sizes="300px" preload className="object-cover" />
            </div>
          ) : (
            <div className="h-[56px] bg-[#e9a31a]" />
          )}
          <div className={`px-4 pb-3 ${cover ? "pt-3.5" : "bg-[#e9a31a] pt-1"}`}>
            <p className="text-[19px] font-bold leading-tight tracking-[-0.01em]">{pick(name)}</p>
            <p className="mt-0.5 text-[12.5px] text-[#545a61]" style={cover ? undefined : { color: "#3b2a05" }}>
              {pick(meta)}
            </p>
          </div>
          <ul className="space-y-1.5 px-3 pt-2.5">
            {dishes.map((d) => (
              <li key={d.name.en} className="flex items-center gap-3 rounded-2xl bg-white p-1.5">
                <Image src={d.photo} alt="" width={128} height={128} sizes="64px" className="size-12 shrink-0 rounded-xl object-cover sm:size-14" />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold leading-tight">{pick(d.name)}</p>
                  <p className="mt-0.5 text-[13px] text-[#545a61]">₹{d.price}</p>
                </div>
                <span aria-hidden className="mr-1 grid size-7 shrink-0 place-items-center rounded-lg border-[1.5px] border-[#1f6b3a] text-[#1f6b3a]">
                  <Plus size={14} strokeWidth={3} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {order && <OrderNote order={order} />}
    </div>
  );
}

/** The order that just came in: slides in once over the foot of a phone or photo, its dot pings. */
export function OrderNote({ order, className = "" }: { order: OrderCard; className?: string }) {
  const { pick } = useApp();
  return (
      <div data-ui className={`hero-note absolute bottom-0 left-0 w-[236px] rounded-[22px] bg-white p-4 text-[#1c1f23] shadow-[0_24px_60px_-20px_rgb(0_0_0/0.65)] sm:w-[260px] ${className}`}>
        <p className="flex items-center gap-2 text-[12px] font-semibold text-[#1f6b3a]">
          <span className="relative flex size-2">
            <span className="hero-ping absolute inline-flex size-full rounded-full bg-[#2f7a4c]" />
            <span className="relative inline-flex size-2 rounded-full bg-[#2f7a4c]" />
          </span>
          {pick(order.from)}
        </p>
        <p className="mt-1.5 text-[15px] font-semibold leading-snug">{pick(order.items)}</p>
        <div className="mt-3 flex flex-wrap gap-1.5 text-[12px] font-semibold">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#2f7a4c] px-2.5 py-1 text-white">
            <Check aria-hidden size={12} strokeWidth={3} /> {pick(order.paid)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fdecee] px-2.5 py-1 text-[#b3202f]">
            <Bike aria-hidden size={12} strokeWidth={2.5} /> {pick(order.rider)}
          </span>
        </div>
      </div>
  );
}
