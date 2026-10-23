import { NextResponse } from "next/server";
import { SAMPLE_COOKIE } from "@/lib/server/session";

// Opens a sample dashboard without signing in: /demo/home (Meena's Kitchen) or /demo/restaurant (Rasoi 27).
// Read-only in production. A signed-in browser keeps seeing its own outlet.
export async function GET(req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  const res = NextResponse.redirect(new URL("/app", req.url));
  res.cookies.set(SAMPLE_COOKIE, kind === "home" ? "home" : "restaurant", { path: "/", sameSite: "lax", httpOnly: true, maxAge: 60 * 60 * 24 * 30 });
  return res;
}
