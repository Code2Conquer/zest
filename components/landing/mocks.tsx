"use client";

import { Star } from "lucide-react";
import { MENU } from "@/lib/data";

// The restaurant's own ordering website on a phone, drawn with the sample restaurant's menu.

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const dish = (id: string) => MENU.find((m) => m.id === id)!;

function VegMark({ veg }: { veg: boolean }) {
  const c = veg ? "#237433" : "#b8321f";
  return (
    <span aria-label={veg ? "Veg" : "Non-veg"} className="grid size-3.5 shrink-0 place-items-center rounded-[3px] border-[1.5px]" style={{ borderColor: c }}>
      <span className="size-1.5 rounded-full" style={{ background: c }} />
    </span>
  );
}

/** The restaurant's own ordering page, on a phone. Always drawn light, as the page itself opens. */
export function PhonePage({ className = "" }: { className?: string }) {
  const items = ["m1", "m3", "m2"].map(dish);
  return (
    <div data-ui className={`w-[260px] rounded-[36px] bg-[#121a16] p-[8px] ${className}`}>
      <div className="overflow-hidden rounded-[29px] bg-[#f4f5f2] text-[#121a16]">
        <div className="relative h-[104px]">
          <img src="/photos/menu-paneer-tikka.webp" alt="" className="size-full object-cover" />
          <span className="absolute left-1/2 top-2 h-5 w-20 -translate-x-1/2 rounded-full bg-[#121a16]" />
        </div>
        <div className="relative mx-3 -mt-7 rounded-2xl bg-white p-3.5">
          <p className="text-[16px] font-semibold leading-tight">Rasoi 27</p>
          <p className="text-[12px] text-[#4d5953]">North Indian · Biryani · Indiranagar</p>
          <div className="mt-2 flex gap-1.5 text-[11px]">
            {(["zomato", "swiggy"] as const).map((p) => (
              <span key={p} className="inline-flex items-center gap-1 rounded-md bg-[#237433] px-1.5 py-0.5 font-semibold text-white">
                {p === "zomato" ? "4.2" : "4.0"} <Star aria-hidden size={10} fill="currentColor" strokeWidth={0} />
                <span className="font-normal">{p === "zomato" ? "Zomato" : "Swiggy"}</span>
              </span>
            ))}
          </div>
        </div>
        <ul className="px-3 pb-3 pt-1">
          {items.map((m) => (
            <li key={m.id} className="flex items-center gap-2.5 py-2">
              <div className="min-w-0 flex-1">
                <VegMark veg={m.veg} />
                <p className="mt-0.5 text-[13px] font-semibold leading-tight">{m.name}</p>
                <p className="text-[12px]">{inr(m.price.zomato)}</p>
              </div>
              <div className="relative">
                <img src={m.photo} alt="" className="size-14 rounded-xl object-cover" />
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-md bg-white px-2.5 py-0.5 text-[11px] font-bold text-[#237433]">ADD</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
