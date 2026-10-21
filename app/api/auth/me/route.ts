import { currentUser } from "@/lib/server/auth";
import { devSigninAllowed, googleSigninConfigured } from "@/lib/server/google-signin";
import { handler } from "@/lib/server/http";

/** Who is signed in, their role here, and which sign-in methods this server offers. */
export const GET = handler(async (_req, outlet, _params, session) => {
  const user = session?.user ?? (await currentUser());
  return {
    user: user ? { name: user.name, email: user.email } : null,
    role: session?.membership.role ?? null,
    outletId: session ? outlet.id : null,
    staffCode: session?.membership.role === "owner" ? outlet.staffCode : null,
    methods: { google: googleSigninConfigured(), dev: devSigninAllowed() },
  };
});
