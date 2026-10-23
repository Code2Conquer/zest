import { describe, expect, it } from "vitest";
import { DEFAULT_DELIVERY, quoteDelivery, riderFee, roadKm } from "@/lib/delivery";

// Indiranagar and Koramangala, Bengaluru: about 4.5 km apart in a straight line.
const KITCHEN = { lat: 12.9719, lng: 77.6412 };
const NEAR = { lat: 12.9784, lng: 77.6408 };
const KORAMANGALA = { lat: 12.9352, lng: 77.6245 };

describe("delivery pricing", () => {
  it("measures road distance a little longer than the straight line", () => {
    const km = roadKm(KITCHEN, KORAMANGALA);
    expect(km).toBeGreaterThan(5);
    expect(km).toBeLessThan(7);
  });

  it("charges a base fare for short trips and more by the km after that", () => {
    expect(riderFee(1)).toBe(30);
    expect(riderFee(2)).toBe(30);
    expect(riderFee(5)).toBe(55);
    expect(riderFee(5.1)).toBe(55);
  });

  it("uses a Zomato rider by default and charges the customer", () => {
    const q = quoteDelivery(DEFAULT_DELIVERY, KITCHEN, NEAR, 500);
    expect(q).toMatchObject({ ok: true, by: "zomato_rider" });
    if (q.ok) expect(q.customerFee).toBe(q.fee);
  });

  it("is free when the restaurant pays, or the order is big enough", () => {
    expect(quoteDelivery({ ...DEFAULT_DELIVERY, feePaidBy: "restaurant" }, KITCHEN, NEAR, 200)).toMatchObject({ ok: true, customerFee: 0 });
    expect(quoteDelivery({ ...DEFAULT_DELIVERY, freeAbove: 499 }, KITCHEN, NEAR, 499)).toMatchObject({ ok: true, customerFee: 0 });
    const under = quoteDelivery({ ...DEFAULT_DELIVERY, freeAbove: 499 }, KITCHEN, NEAR, 498);
    expect(under.ok && under.customerFee).toBeGreaterThan(0);
  });

  it("uses the restaurant's own staff when Zomato riders are off", () => {
    expect(quoteDelivery({ ...DEFAULT_DELIVERY, zomatoRider: false, ownStaff: true }, KITCHEN, NEAR, 300)).toMatchObject({ ok: true, by: "own_staff" });
  });

  it("refuses trips past the limit, and delivery when it is off", () => {
    expect(quoteDelivery({ ...DEFAULT_DELIVERY, maxKm: 3 }, KITCHEN, KORAMANGALA, 300)).toEqual({ ok: false, reason: "too_far" });
    expect(quoteDelivery({ ...DEFAULT_DELIVERY, zomatoRider: false, ownStaff: false }, KITCHEN, NEAR, 300)).toEqual({ ok: false, reason: "off" });
  });

  it("leaves the fee open when a location is missing", () => {
    expect(quoteDelivery(DEFAULT_DELIVERY, null, NEAR, 300)).toEqual({ ok: true, by: "zomato_rider", km: null, fee: null, customerFee: 0 });
  });
});
