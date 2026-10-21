import "server-only";
import { eq, isNull } from "drizzle-orm";
import { db } from "./db";
import { brands, outlets, type Outlet } from "./schema";

/** Gives every outlet without a brand a brand of its own, named after it. Returns how many it created. */
export async function ensureBrands(): Promise<number> {
  const orphans = await db.select({ id: outlets.id, name: outlets.name }).from(outlets).where(isNull(outlets.brandId));
  for (const o of orphans) {
    const [b] = await db.insert(brands).values({ name: o.name }).returning();
    await db.update(outlets).set({ brandId: b.id }).where(eq(outlets.id, o.id));
  }
  return orphans.length;
}

export async function brandOutlets(brandId: string): Promise<Outlet[]> {
  return db.select().from(outlets).where(eq(outlets.brandId, brandId));
}
