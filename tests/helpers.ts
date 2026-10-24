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

/** Signs a test person in by mobile as the owner of this outlet's brand (the way owners log in now). */
export async function signInAsOwner(o: Outlet, phone = `+9198${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}`) {
  const { addOwner, signInByPhone } = await import("@/lib/server/auth");
  const { users } = await import("@/lib/server/schema");
  const [user] = await db.insert(users).values({ phone, name: "Owner" }).returning();
  await addOwner(user.id, o.brandId!);
  return (await signInByPhone(phone))!;
}
