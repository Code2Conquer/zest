import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Bike, Check, ChefHat, CircleX, Clock, PackageCheck, ShoppingBag } from "lucide-react";
import { Wordmark } from "@/components/bits";
import { ready } from "@/lib/server/db";
import { trackOrder } from "@/lib/server/storefront";
import { Refresh } from "./refresh";

// Following one order from a seller's page, by the private link sent on WhatsApp or SMS. No account needed;
// the link itself is the key, so the page stays out of search.

export const metadata: Metadata = { title: "Your order · Zest", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const time = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

export default async function Track({ params }: { params: Promise<{ token: string }> }) {
  await ready();
  const o = await trackOrder((await params).token);
  if (!o) notFound();
  const delivery = o.fulfilment === "delivery";
  const steps = [
    { id: "placed", label: "Order placed", icon: ShoppingBag, done: true },
    { id: "accepted", label: "Accepted, cooking", icon: ChefHat, done: ["accepted", "preparing", "ready", "out_for_delivery", "picked_up", "served", "completed"].includes(o.status) },
    { id: "ready", label: delivery ? "Ready for pickup by rider" : "Ready to collect", icon: PackageCheck, done: ["ready", "out_for_delivery", "picked_up", "served", "completed"].includes(o.status) },
    ...(delivery ? [{ id: "out", label: "On the way", icon: Bike, done: ["out_for_delivery", "picked_up", "completed"].includes(o.status) }] : []),
    { id: "done", label: delivery ? "Delivered" : "Collected", icon: Check, done: ["completed", "served"].includes(o.status) },
  ];
  const dead = o.status === "rejected" || o.status === "cancelled";
  const live = !dead && !["completed", "served"].includes(o.status);
  const awaitingPay = o.paymentMethod === "online" && o.paymentStatus !== "paid";

  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 pb-16 pt-6">
      <Refresh live={live} />
      <Wordmark className="text-[28px]" />
      <p className="mt-6 text-sm text-muted">
        {o.shop.name}
        {o.shop.area ? ` · ${o.shop.area}` : ""}
      </p>
      <h1 className="mt-1 text-[28px] font-extrabold leading-tight tracking-[-0.02em]">
        {dead ? "This order didn't go through" : awaitingPay ? "Waiting for your payment" : steps.findLast((s) => s.done)!.label}
      </h1>
      <p className="mt-1 text-muted">
        Order {o.number} · placed {time(o.placedAt)}
      </p>

      {o.rider && o.rider.status !== "unavailable" && !dead && (
        <section className="mt-6 flex items-center gap-3 rounded-2xl bg-surface p-4">
          <span className="grid size-11 place-items-center rounded-full bg-[#e23744] text-white">
            <Bike aria-hidden className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{o.rider.name ? `${o.rider.name}, Zomato rider` : "Finding a Zomato rider"}</p>
            <p className="text-sm text-muted">{o.rider.eta ? `Arriving by about ${time(o.rider.eta)}` : "We'll update this page when one is on the way."}</p>
          </div>
          {o.rider.trackUrl && (
            <a href={o.rider.trackUrl} target="_blank" rel="noreferrer" className="rounded-full bg-ink px-3.5 py-2 text-sm font-semibold text-paper">
              Live map
            </a>
          )}
        </section>
      )}

      {dead ? (
        <p className="mt-6 flex items-start gap-3 rounded-2xl bg-chilli-soft p-4 text-chilli">
          <CircleX aria-hidden className="mt-0.5 size-5 shrink-0" />
          <span>
            {o.shop.name} couldn&apos;t take this order.
            {o.paymentMethod === "online" && o.paymentStatus === "paid" ? (o.refundStatus === "refunded" ? ` ₹${o.total} has been refunded to you.` : " Your money will be refunded.") : ""}
          </span>
        </p>
      ) : (
        <ol className="mt-6 grid gap-0">
          {steps.map((s, i) => (
            <li key={s.id} className="relative flex gap-3 pb-6 last:pb-0">
              {i < steps.length - 1 && <span aria-hidden className={`absolute left-[19px] top-10 h-[calc(100%-2.5rem)] w-0.5 ${steps[i + 1].done ? "bg-turmeric" : "bg-line"}`} />}
              <span className={`grid size-10 shrink-0 place-items-center rounded-full ${s.done ? "bg-turmeric text-ink" : "bg-surface text-muted"}`}>
                <s.icon aria-hidden className="size-5" />
              </span>
              <span className={`pt-2 font-medium ${s.done ? "" : "text-muted"}`}>{s.label}</span>
            </li>
          ))}
        </ol>
      )}

      <section className="mt-8 rounded-2xl bg-surface p-4">
        <p className="text-sm text-muted">Your order</p>
        <p className="mt-1 font-medium">{o.items}</p>
        {o.address && <p className="mt-2 text-sm text-ink-2">To: {o.address}</p>}
        <p className="mt-3 flex items-center justify-between border-t border-line pt-3">
          <span className="text-sm text-muted">{o.paymentStatus === "paid" ? "Paid" : o.paymentMethod === "counter" ? "Pay on delivery" : "To pay"}</span>
          <span className="font-bold tabular-nums">₹{o.total.toLocaleString("en-IN")}</span>
        </p>
      </section>
      {live && (
        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted">
          <Clock aria-hidden className="size-3.5" /> This page updates by itself.
        </p>
      )}
    </main>
  );
}
