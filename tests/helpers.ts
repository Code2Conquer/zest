import { db } from "@/lib/server/db";
import { outlets, type Outlet } from "@/lib/server/schema";

/** A restaurant of its own for one test, so tests never see each other's rows. */
export async function freshOutlet(overrides: Partial<typeof outlets.$inferInsert> = {}): Promise<Outlet> {
  const [row] = await db
    .insert(outlets)
    .values({ id: crypto.randomUUID(), name: "Test Kitchen", area: "Indiranagar", livePlatforms: ["zomato", "swiggy"], ...overrides })
    .returning();
  return row;
}
