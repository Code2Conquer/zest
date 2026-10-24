import { currentUser } from "@/lib/server/auth";
import { handler } from "@/lib/server/http";
import { googleSigninConfigured } from "@/lib/server/google-signin";
import { phoneSigninAvailable } from "@/lib/server/otp";

/** Who is signed in, their role here, and which sign-in methods this server offers. */
export const GET = handler({ staff: true }, async (_req, outlet, _params, session) => {
  const user = session?.user ?? (await currentUser());
  return {
    user: user ? { name: user.name, email: user.email, phone: user.phone } : null,
    role: session?.membership.role ?? null,
    outletId: session ? outlet.id : null,
    staffCode: session?.membership.role === "owner" ? outlet.staffCode : null,
    methods: { phone: phoneSigninAvailable(), google: googleSigninConfigured() },
  };
});
