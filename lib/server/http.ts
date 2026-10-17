import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "./approvals";
import { ready } from "./db";
import type { Outlet } from "./schema";
import { currentOutlet } from "./session";

type Ctx<P> = { params: Promise<P> };

/** Wraps a route handler: makes sure the database is ready, resolves the outlet, maps errors to JSON. */
export function handler<P = Record<string, string>>(fn: (req: Request, outlet: Outlet, params: P) => Promise<unknown>) {
  return async (req: Request, ctx: Ctx<P>) => {
    try {
      await ready();
      const outlet = await currentOutlet();
      const result = await fn(req, outlet, await ctx.params);
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
