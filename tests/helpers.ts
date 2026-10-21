import { db } from "@/lib/server/db";
import { brands, outlets, type Outlet } from "@/lib/server/schema";

/** A restaurant (and its brand) of its own for one test, so tests never see each other's rows. */
export async function freshOutlet(overrides: Partial<typeof outlets.$inferInsert> = {}): Promise<Outlet> {
  const name = overrides.name ?? "Test Kitchen";
  const [brand] = await db.insert(brands).values({ name }).returning();
  const [row] = await db
    .insert(outlets)
    .values({ id: crypto.randomUUID(), brandId: brand.id, name, area: "Indiranagar", livePlatforms: ["zomato", "swiggy"], ...overrides })
    .returning();
  return row;
}
