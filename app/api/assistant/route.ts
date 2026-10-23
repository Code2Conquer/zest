import { z } from "zod";
import { HttpError } from "@/lib/server/approvals";
import { answer } from "@/lib/server/assistant";
import { clientIp, handler } from "@/lib/server/http";
import { checkRate } from "@/lib/server/rate-limit";

// Zest on the website: anyone can ask, limited per connection.
export const maxDuration = 30;

const Body = z.object({
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().trim().min(1).max(1500) })).min(1).max(40),
});

export const POST = handler({ staff: true }, async (req) => {
  if (!(await checkRate(`assistant:${clientIp(req)}`, 30, 600))) throw new HttpError(429, "That's a lot of questions. Try again in a few minutes. / बहुत सारे सवाल। कुछ मिनट बाद पूछिए।");
  const { history } = Body.parse(await req.json());
  if (history[history.length - 1].role !== "user") throw new HttpError(400, "Ask a question.");
  return { reply: await answer(history) };
});
