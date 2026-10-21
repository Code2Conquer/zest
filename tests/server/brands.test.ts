import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { POST as createOutlet } from "@/app/api/outlet/route";
import { signIn } from "@/lib/server/auth";
import { brandOutlets, ensureBrands } from "@/lib/server/brands";
import { client, db } from "@/lib/server/db";
import { brands, outlets } from "@/lib/server/schema";
import { cookieJar } from "../cookies";


const ctx = { params: Promise.resolve({}) };

describe("brands", () => {
  beforeEach(() => cookieJar.clear());

  it("gives every existing outlet a brand of its own", async () => {
    const ids = [crypto.randomUUID(), crypto.randomUUID()];
    for (const [i, id] of ids.entries()) {
      await client().execute({ sql: "INSERT INTO outlets (id, name, created_at) VALUES (?, ?, ?)", args: [id, `Old ${i}`, new Date().toISOString()] });
    }
    await ensureBrands();
    const rows = await Promise.all(ids.map(async (id) => (await db.select().from(outlets).where(eq(outlets.id, id)))[0]));
    expect(rows[0].brandId).toBeTruthy();
    expect(rows[0].brandId).not.toBe(rows[1].brandId);
    const [b] = await db.select().from(brands).where(eq(brands.id, rows[0].brandId!));
    expect(b.name).toBe("Old 0");
  });

  it("is idempotent", async () => {
    await ensureBrands();
    expect(await ensureBrands()).toBe(0);
  });

  it("creates a brand with a new restaurant", async () => {
    await signIn({ email: "new-owner@example.in", name: "Ravi" });
    const res = await createOutlet(
      new Request("http://x/api/outlet", { method: "POST", body: JSON.stringify({ journey: "live", live: ["zomato"], name: "Chaat Corner", ownerName: "Ravi" }) }),
      ctx,
    );
    const body = (await res.json()) as { id: string; brandId: string };
    expect(body.brandId).toBeTruthy();
    expect((await brandOutlets(body.brandId)).map((o) => o.id)).toEqual([body.id]);
  });
});

describe("demo brand", () => {
  it("gives the sample restaurant the fixed demo brand", async () => {
    const { DEMO_BRAND_ID, DEMO_OUTLET_ID } = await import("@/lib/server/seed");
    const [demo] = await db.select().from(outlets).where(eq(outlets.id, DEMO_OUTLET_ID));
    expect(demo.brandId).toBe(DEMO_BRAND_ID);
  });
});
