import { beforeEach, describe, expect, it } from "vitest";
import { GET, PUT } from "@/app/api/hours/route";
import { cookieJar } from "../cookies";
import { freshOutlet, signInAsOwner } from "../helpers";

const ctx = { params: Promise.resolve({}) };
const put = (body: unknown) => PUT(new Request("http://x/api/hours", { method: "PUT", body: JSON.stringify(body) }), ctx);

describe("hours API", () => {
  beforeEach(async () => {
    cookieJar.clear();
    const o = await freshOutlet();
    await signInAsOwner(o);
  });

  it("saves and reads back the week and special dates", async () => {
    const weekly = [{ weekday: 1, opens: "11:00", closes: "23:30" }];
    const special = [{ date: "2026-11-08", closed: true, note: "Diwali" }];
    expect((await put({ weekly, special })).status).toBe(200);
    const body = (await (await GET(new Request("http://x/api/hours"), ctx)).json()) as { weekly: unknown[]; special: unknown[] };
    expect(body.weekly).toMatchObject(weekly);
    expect(body.special).toMatchObject(special);
  });

  it("refuses overlapping spans on one day", async () => {
    const res = await put({ weekly: [{ weekday: 1, opens: "11:00", closes: "15:00" }, { weekday: 1, opens: "14:00", closes: "22:00" }], special: [] });
    expect(res.status).toBe(400);
  });

  it("refuses a time that isn't HH:MM", async () => {
    expect((await put({ weekly: [{ weekday: 1, opens: "11", closes: "22:00" }], special: [] })).status).toBe(400);
  });
});
