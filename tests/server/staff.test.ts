import { beforeEach, describe, expect, it } from "vitest";
import { currentSession } from "@/lib/server/auth";
import { addStaff, pinSignIn, removeStaff } from "@/lib/server/staff";
import { cookieJar } from "../cookies";
import { freshOutlet } from "../helpers";


async function rejectsWith(p: Promise<unknown>) {
  try {
    await p;
  } catch (err) {
    return (err as { status?: number }).status ?? "error";
  }
  return null;
}

describe("staff", () => {
  beforeEach(() => cookieJar.clear());

  it("signs in with the restaurant code and PIN", async () => {
    const o = await freshOutlet();
    await addStaff(o.brandId!, { name: "Sunita", role: "kitchen", outletIds: null, pin: "4821" });
    const s = await pinSignIn(o.staffCode!, "4821");
    expect(s.membership.role).toBe("kitchen");
    expect(s.outlet.id).toBe(o.id);
  });

  it("locks the code after 5 wrong PINs", async () => {
    const o = await freshOutlet();
    await addStaff(o.brandId!, { name: "Sunita", role: "kitchen", outletIds: null, pin: "4821" });
    for (let i = 0; i < 5; i++) expect(await rejectsWith(pinSignIn(o.staffCode!, "0000"))).toBe(401);
    expect(await rejectsWith(pinSignIn(o.staffCode!, "4821"))).toBe(429);
  });

  it("ends access when the owner removes the person", async () => {
    const o = await freshOutlet();
    const m = await addStaff(o.brandId!, { name: "Sunita", role: "cashier", outletIds: null, pin: "4821" });
    await pinSignIn(o.staffCode!, "4821");
    expect(await currentSession()).not.toBeNull();
    await removeStaff(m.id);
    expect(await currentSession()).toBeNull();
  });

  it("refuses a duplicate PIN at the same outlet", async () => {
    const o = await freshOutlet();
    await addStaff(o.brandId!, { name: "A", role: "kitchen", outletIds: null, pin: "4821" });
    expect(await rejectsWith(addStaff(o.brandId!, { name: "B", role: "cashier", outletIds: null, pin: "4821" }))).toBe(400);
  });
});
