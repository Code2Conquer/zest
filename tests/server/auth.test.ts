import { beforeEach, describe, expect, it } from "vitest";
import { GET as getOutlet } from "@/app/api/outlet/route";
import { requireRole, signInByPhone } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { addStaff, pinSignIn } from "@/lib/server/staff";
import { cookieJar } from "../cookies";
import { freshOutlet, signInAsOwner } from "../helpers";


const ctx = { params: Promise.resolve({}) };
const statusOf = (fn: () => unknown) => {
  try {
    fn();
  } catch (err) {
    return (err as { status?: number }).status;
  }
  return null;
};

describe("auth", () => {
  beforeEach(() => cookieJar.clear());

  it("refuses a kitchen member approving a draft", async () => {
    const o = await freshOutlet();
    await addStaff(o.brandId!, { name: "Raju", role: "kitchen", outletIds: null, pin: "1357" });
    const s = await pinSignIn(o.staffCode!, "1357");
    expect(statusOf(() => requireRole(s, ["owner", "manager"]))).toBe(403);
  });

  it("still serves the demo without a session", async () => {
    const res = await getOutlet(new Request("http://x/api/outlet"), ctx);
    expect(((await res.json()) as { id: string }).id).toBe("demo");
  });

  it("logs a manager in by the mobile number the owner added", async () => {
    const o = await freshOutlet();
    const { addManagerByPhone } = await import("@/lib/server/staff");
    await addManagerByPhone(o.brandId!, { name: "Asha", phone: "9811033344", outletIds: null });
    const s = await signInByPhone("+919811033344");
    expect(s?.membership.role).toBe("manager");
    expect(s?.outlet.id).toBe(o.id);
  });
});

describe("decisions", () => {
  beforeEach(() => cookieJar.clear());

  it("records who skipped a draft", async () => {
    const { POST: decide } = await import("@/app/api/approvals/[id]/route");
    const { createApproval } = await import("@/lib/server/approvals");
    const o = await freshOutlet();
    const s = await signInAsOwner(o);
    const draft = await createApproval(o.id, { agent: "menu", kind: "menu_change", title: "t", payload: { changes: [] } });
    const res = await decide(new Request("http://x", { method: "POST", body: JSON.stringify({ action: "skip" }) }), { params: Promise.resolve({ id: draft.id }) });
    expect(res.status).toBe(200);
    const { approvals } = await import("@/lib/server/schema");
    const { eq } = await import("drizzle-orm");
    const [row] = await db.select().from(approvals).where(eq(approvals.id, draft.id));
    expect(row.decidedBy).toBe(`user:${s!.user.id}`);
  });
});

describe("Google sign-in", () => {
  beforeEach(() => cookieJar.clear());

  it("rejects a sign-in callback with a Gmail-purpose state", async () => {
    const { GET: callback } = await import("@/app/api/auth/google/callback/route");
    const { sign } = await import("@/lib/server/crypto");
    const value = Buffer.from(JSON.stringify({ purpose: "gmail", outletId: "", nonce: "n1", returnTo: "/app" })).toString("base64url");
    cookieJar.set("zest_oauth_signin", sign(value));
    const res = await callback(new Request("http://x/api/auth/google/callback?state=n1&code=c"), { params: Promise.resolve({}) });
    expect(res.status).toBe(400);
  });

  it("signs a Google user into the restaurant they own", async () => {
    const { signIn, addOwner } = await import("@/lib/server/auth");
    const o = await freshOutlet();
    expect(await signIn({ email: "Owner.G@Example.in", name: "G" })).toBeNull();
    const { users } = await import("@/lib/server/schema");
    const { eq } = await import("drizzle-orm");
    const [u] = await db.select().from(users).where(eq(users.email, "owner.g@example.in"));
    await addOwner(u.id, o.brandId!);
    const s = await signIn({ email: "owner.g@example.in", name: "G" });
    expect(s?.outlet.id).toBe(o.id);
  });
});
