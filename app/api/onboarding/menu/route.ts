import { audit, HttpError } from "@/lib/server/approvals";
import { describeClaudeError, hasClaude } from "@/lib/server/claude";
import { handler } from "@/lib/server/http";
import { readMenu } from "@/lib/server/vision";

/** Turns a photo of a paper menu into dishes. The owner reviews them before importing. */
export const POST = handler(async (req, outlet) => {
  if (!hasClaude()) throw new HttpError(503, "Menu reading needs ANTHROPIC_API_KEY on the server.");
  const file = (await req.formData()).get("file");
  if (!(file instanceof File)) throw new HttpError(400, "Attach a photo of your menu.");
  if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) throw new HttpError(415, "Use a JPG, PNG, WebP or PDF.");
  if (file.size > 8 * 1024 * 1024) throw new HttpError(413, "That file is over 8 MB.");
  try {
    const result = await readMenu(Buffer.from(await file.arrayBuffer()).toString("base64"), file.type);
    if (!result || result.items.length === 0) throw new HttpError(422, "Couldn't find dishes in that photo. Try one page at a time, straight on.");
    await audit(outlet.id, "onboarding", "menu.read", { dishes: result.items.length });
    return result;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(502, describeClaudeError(err));
  }
});
