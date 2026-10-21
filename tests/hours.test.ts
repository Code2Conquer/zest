import { describe, expect, it } from "vitest";
import { isOpenAt, nextChange, type WeeklyHours } from "@/lib/hours";

const IST = (s: string) => new Date(s + "+05:30");
const week = (opens: string, closes: string, channel?: "web" | null): WeeklyHours => [0, 1, 2, 3, 4, 5, 6].map((d) => ({ weekday: d, opens, closes, channel }));
const late = week("18:00", "02:00");

describe("opening hours", () => {
  it("is open at 1:30 am after an overnight span", () => expect(isOpenAt(late, [], IST("2026-10-22T01:30:00"))).toBe(true));
  it("is closed at 2:00 am exactly", () => expect(isOpenAt(late, [], IST("2026-10-22T02:00:00"))).toBe(false));
  it("is closed in the afternoon", () => expect(isOpenAt(late, [], IST("2026-10-22T15:00:00"))).toBe(false));
  it("honours a holiday closure", () => expect(isOpenAt(late, [{ date: "2026-11-08", closed: true }], IST("2026-11-08T19:00:00"))).toBe(false));
  it("uses special hours instead of the week", () =>
    expect(isOpenAt(late, [{ date: "2026-11-08", closed: false, opens: "11:00", closes: "18:00" }], IST("2026-11-08T12:00:00"))).toBe(true));
  it("lets a channel close earlier", () => {
    const h: WeeklyHours = [...late, ...week("18:00", "23:00", "web")];
    expect(isOpenAt(h, [], IST("2026-10-22T23:30:00"), "web")).toBe(false);
    expect(isOpenAt(h, [], IST("2026-10-22T23:30:00"), "dine")).toBe(true);
  });
  it("finds the next opening", () => expect(nextChange(late, [], IST("2026-10-22T03:00:00"))).toEqual({ open: true, at: IST("2026-10-22T18:00:00") }));
  it("finds the next closing", () => expect(nextChange(late, [], IST("2026-10-22T20:00:00"))).toEqual({ open: false, at: IST("2026-10-23T02:00:00") }));
  it("is never open with no hours", () => expect(nextChange([], [], IST("2026-10-22T03:00:00"))).toBeNull());
});

describe("sample restaurant hours", () => {
  it("opens 11 am to 11:30 pm every day", async () => {
    const { getHours } = await import("@/lib/server/hours");
    const { weekly } = await getHours("demo");
    expect(weekly).toHaveLength(7);
    expect(weekly.every((h) => h.opens === "11:00" && h.closes === "23:30")).toBe(true);
  });
});

describe("existing sample restaurant", () => {
  it("gets default hours when it was seeded before hours existed", async () => {
    const { db } = await import("@/lib/server/db");
    const { outletHours } = await import("@/lib/server/schema");
    const { eq } = await import("drizzle-orm");
    const { seedDemo } = await import("@/lib/server/seed");
    const { getHours } = await import("@/lib/server/hours");
    await db.delete(outletHours).where(eq(outletHours.outletId, "demo"));
    await seedDemo();
    expect((await getHours("demo")).weekly).toHaveLength(7);
  });
});
