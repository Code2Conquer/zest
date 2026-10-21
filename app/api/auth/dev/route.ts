import { z } from "zod";
import { HttpError } from "@/lib/server/approvals";
import { signIn } from "@/lib/server/auth";
import { devSigninAllowed } from "@/lib/server/google-signin";
import { handler } from "@/lib/server/http";

const Body = z.object({ email: z.email(), name: z.string().trim().max(80).default("") });

/** Test sign-in by email for local development, standing in for Google. Refused in production. */
export const POST = handler(async (req) => {
  if (!devSigninAllowed()) throw new HttpError(404, "Not found.");
  const session = await signIn(Body.parse(await req.json()));
  return { signedIn: true, hasRestaurant: !!session };
});
