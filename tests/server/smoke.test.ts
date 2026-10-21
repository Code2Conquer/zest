import { describe, expect, it } from "vitest";
import { createApproval, listApprovals } from "@/lib/server/approvals";
import { dinePrice } from "@/lib/server/dining";
import { freshOutlet } from "../helpers";

describe("harness", () => {
  it("prices dine-in at the lowest platform price", () => {
    expect(dinePrice({ price: { zomato: 199, swiggy: 189 } })).toBe(189);
  });

  it("talks to a real database", async () => {
    const o = await freshOutlet();
    await createApproval(o.id, { agent: "menu", kind: "menu_change", title: "t", payload: { changes: [] } });
    expect(await listApprovals(o.id, "pending")).toHaveLength(1);
  });
});
