import { audit, HttpError } from "@/lib/server/approvals";
import { aiProvider, describeAIError } from "@/lib/server/claude";
import { handler, MANAGERS } from "@/lib/server/http";
import { readMenu } from "@/lib/server/vision";

// Reading a photo with AI can take tens of seconds; fits the Vercel Hobby limit.
export const maxDuration = 60;

/** Turns a photo of a paper menu into dishes. The owner reviews them before importing. */
export const POST = handler({ roles: MANAGERS }, async (req, outlet) => {
  const ai = aiProvider();
  if (!ai) throw new HttpError(503, "Menu reading isn't set up on this server yet.");
  const file = (await req.formData()).get("file");
  if (!(file instanceof File)) throw new HttpError(400, "Attach a photo of your menu.");
  if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) throw new HttpError(415, "Use a JPG, PNG, WebP or PDF.");
  if (file.size > 8 * 1024 * 1024) throw new HttpError(413, "That file is over 8 MB.");
  // Open models read photos only, and the free tier takes up to about 4 MB.
  if (ai === "open" && file.type === "application/pdf") throw new HttpError(415, "Send a photo instead of a PDF.");
  if (ai === "open" && file.size > 4 * 1024 * 1024) throw new HttpError(413, "That photo is over 4 MB. Take it a little further away or send a smaller one.");
  try {
    const result = await readMenu(Buffer.from(await file.arrayBuffer()).toString("base64"), file.type);
    if (!result || result.items.length === 0) throw new HttpError(422, "Couldn't find dishes in that photo. Try one page at a time, straight on.");
    await audit(outlet.id, "onboarding", "menu.read", { dishes: result.items.length });
    return result;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(502, describeAIError(err));
  }
});
