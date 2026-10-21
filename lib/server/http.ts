import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "./approvals";
import { ready } from "./db";
import { currentSession, requireRole, type Role, type SessionUser } from "./auth";
import type { Outlet } from "./schema";
import { currentOutlet } from "./session";

type Ctx<P> = { params: Promise<P> };
type Fn<P> = (req: Request, outlet: Outlet, params: P, session: SessionUser | null) => Promise<unknown>;

/** The caller's address, from the first x-forwarded-for entry the host sets. */
export const clientIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";

export const OWNER: Role[] = ["owner"];
export const MANAGERS: Role[] = ["owner", "manager"];
export const FLOOR: Role[] = ["owner", "manager", "cashier"];

/**
 * Wraps a route handler: makes sure the database is ready, resolves the outlet and the signed-in person,
 * maps errors to JSON. With `{ roles }`, only those roles may call it; the sample restaurant keeps its
 * own rule (assertWritable) instead.
 */
export function handler<P = Record<string, string>>(fn: Fn<P>): (req: Request, ctx: Ctx<P>) => Promise<Response>;
export function handler<P = Record<string, string>>(opts: { roles: Role[] }, fn: Fn<P>): (req: Request, ctx: Ctx<P>) => Promise<Response>;
export function handler<P = Record<string, string>>(a: Fn<P> | { roles: Role[] }, b?: Fn<P>) {
  const fn = typeof a === "function" ? a : b!;
  const roles = typeof a === "function" ? null : a.roles;
  return async (req: Request, ctx: Ctx<P>) => {
    try {
      await ready();
      const session = await currentSession();
      const outlet = session?.outlet ?? (await currentOutlet());
      if (roles && !outlet.isDemo) requireRole(session, roles);
      const result = await fn(req, outlet, await ctx.params, session);
      return result instanceof Response ? result : NextResponse.json(result);
    } catch (err) {
      if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
      if (err instanceof ZodError) return NextResponse.json({ error: err.issues[0]?.message ?? "Invalid request.", issues: err.issues }, { status: 400 });
      console.error(err);
      return NextResponse.json({ error: (err as Error).message || "Something went wrong." }, { status: 500 });
    }
  };
}

/** In production the demo is shared by every visitor, so changes to it are refused unless ZEST_DEMO_WRITABLE=1. */
export function assertWritable(outlet: Outlet) {
  if (outlet.isDemo && process.env.NODE_ENV === "production" && process.env.ZEST_DEMO_WRITABLE !== "1") {
    throw new HttpError(403, "This is the sample restaurant. Start your own to make changes.");
  }
}
