import { describe, expect, it } from "vitest";
import { CHANNELS, salesSegments, type Channel } from "@/lib/platforms";

const zero = () => Object.fromEntries(CHANNELS.map((c) => [c, { amount: 0, orders: 0 }])) as Record<Channel, { amount: number; orders: number }>;

describe("sales segments", () => {
  it("merges the direct channels into one segment", () => {
    const sales = { ...zero(), zomato: { amount: 500, orders: 2 }, web: { amount: 300, orders: 1 }, whatsapp: { amount: 200, orders: 1 } };
    const segs = salesSegments(sales, ["zomato", "dine"]);
    expect(segs.map((s) => s.key)).toEqual(["zomato", "dine", "direct"]);
    expect(segs.find((s) => s.key === "direct")).toMatchObject({ amount: 500, orders: 2 });
  });

  it("leaves direct out when there were no direct sales", () => {
    expect(salesSegments({ ...zero(), zomato: { amount: 500, orders: 2 } }, ["zomato", "dine"]).map((s) => s.key)).toEqual(["zomato", "dine"]);
  });
});
