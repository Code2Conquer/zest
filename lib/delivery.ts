// How a restaurant's own page delivers: by a Zomato rider, by its own staff, or not at all (pickup only).
// Shared by the server (which prices and checks every order) and the ordering page (which shows the same
// quote before the customer places it).
//
// Delivery is priced by distance. RIDER_FEE is the estimate Zest shows until the Zomato rider booking
// returns a live quote for the trip; the restaurant decides who pays it.

export type DeliverySettings = {
  /** Book a Zomato rider for delivery orders. */
  zomatoRider: boolean;
  /** Deliver with the restaurant's own staff (used when Zomato riders are off). */
  ownStaff: boolean;
  /** Customers may collect at the counter. */
  pickup: boolean;
  /** Who pays the delivery fee. */
  feePaidBy: "customer" | "restaurant";
  /** Orders at or above this amount get free delivery; null for never. */
  freeAbove: number | null;
  /** Farthest delivery, in km. */
  maxKm: number;
};

export const DEFAULT_DELIVERY: DeliverySettings = { zomatoRider: true, ownStaff: false, pickup: true, feePaidBy: "customer", freeAbove: null, maxKm: 7 };

export type LatLng = { lat: number; lng: number };

/** Straight-line distance in km, stretched by 1.3 for the roads between. */
export function roadKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 1.3 * 10) / 10;
}

/** Estimated Zomato rider fee for a trip: ₹30 for the first 2 km, then ₹8 a km, rounded up to ₹5. */
export function riderFee(km: number): number {
  return Math.ceil((30 + Math.max(0, km - 2) * 8) / 5) * 5;
}

export type DeliveryQuote =
  | { ok: true; by: "zomato_rider" | "own_staff"; km: number | null; fee: number | null; customerFee: number }
  | { ok: false; reason: "off" | "too_far" };

/**
 * What delivering this order costs and who carries it. Without both locations the fee is unknown (null):
 * it is set when the rider is booked, and the customer is told so.
 */
export function quoteDelivery(s: DeliverySettings, from: LatLng | null, to: LatLng | null, subtotal: number): DeliveryQuote {
  if (!s.zomatoRider && !s.ownStaff) return { ok: false, reason: "off" };
  const km = from && to ? roadKm(from, to) : null;
  if (km != null && km > s.maxKm) return { ok: false, reason: "too_far" };
  const by = s.zomatoRider ? "zomato_rider" : "own_staff";
  const fee = km == null ? null : riderFee(km);
  const free = s.feePaidBy === "restaurant" || (s.freeAbove != null && subtotal >= s.freeAbove);
  return { ok: true, by, km, fee, customerFee: free || fee == null ? 0 : fee };
}
