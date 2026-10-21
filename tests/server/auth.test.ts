import { beforeEach, describe, expect, it } from "vitest";
import { GET as signInCallback } from "@/app/api/auth/google/callback/route";
import { POST as menuChanges } from "@/app/api/menu/changes/route";
import { GET as getOutlet } from "@/app/api/outlet/route";
import { requireRole, signIn } from "@/lib/server/auth";
import { sign } from "@/lib/server/crypto";
import { db } from "@/lib/server/db";
import { mailboxes } from "@/lib/server/schema";
import { addStaff, pinSignIn } from "@/lib/server/staff";
import { cookieJar } from "../cookies";
import { freshOutlet } from "../helpers";


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

  it("makes the first signer-in the owner of a cookie-only pilot outlet", async () => {
    const o = await freshOutlet();
    cookieJar.set("zest_outlet", sign(o.id));
    const s = await signIn({ email: "pilot@example.in", name: "Pilot" });
    expect(s?.membership.role).toBe("owner");
    expect(s?.membership.brandId).toBe(o.brandId);
    expect(s?.outlet.id).toBe(o.id);
    expect(cookieJar.get("zest_outlet")).toBeUndefined();
  });

  it("links an outlet by its connected Gmail address", async () => {
    const o = await freshOutlet();
    await db.insert(mailboxes).values({ outletId: o.id, provider: "gmail", address: "owner@example.in", secret: "x" });
    const s = await signIn({ email: "owner@example.in", name: "Owner" });
    expect(s?.membership.role).toBe("owner");
    expect(s?.outlet.id).toBe(o.id);
  });

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

  it("lets a legacy browser read its outlet but not write to it", async () => {
    const o = await freshOutlet();
    cookieJar.set("zest_outlet", sign(o.id));
    const read = await getOutlet(new Request("http://x/api/outlet"), ctx);
    expect(((await read.json()) as { id: string }).id).toBe(o.id);
    const write = await menuChanges(new Request("http://x/api/menu/changes", { method: "POST", body: JSON.stringify({ changes: [] }) }), ctx);
    expect(write.status).toBe(401);
  });

  it("rejects a sign-in callback with a Gmail-purpose state", async () => {
    const value = Buffer.from(JSON.stringify({ purpose: "gmail", outletId: "", nonce: "n1", returnTo: "/app" })).toString("base64url");
    cookieJar.set("zest_oauth_signin", sign(value));
    const res = await signInCallback(new Request("http://x/api/auth/google/callback?state=n1&code=c"), ctx);
    expect(res.status).toBe(400);
  });
});

describe("decisions", () => {
  beforeEach(() => cookieJar.clear());

  it("records who skipped a draft", async () => {
    const { POST: decide } = await import("@/app/api/approvals/[id]/route");
    const { createApproval } = await import("@/lib/server/approvals");
    const o = await freshOutlet();
    cookieJar.set("zest_outlet", sign(o.id));
    const s = await signIn({ email: "decider@example.in", name: "D" });
    const draft = await createApproval(o.id, { agent: "menu", kind: "menu_change", title: "t", payload: { changes: [] } });
    const res = await decide(new Request("http://x", { method: "POST", body: JSON.stringify({ action: "skip" }) }), { params: Promise.resolve({ id: draft.id }) });
    expect(res.status).toBe(200);
    const { approvals } = await import("@/lib/server/schema");
    const { eq } = await import("drizzle-orm");
    const [row] = await db.select().from(approvals).where(eq(approvals.id, draft.id));
    expect(row.decidedBy).toBe(`user:${s!.user.id}`);
  });
});
