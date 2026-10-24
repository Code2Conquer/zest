import { z } from "zod";
import { audit, HttpError } from "@/lib/server/approvals";
import { aiProvider, describeAIError } from "@/lib/server/claude";
import { handler, MANAGERS } from "@/lib/server/http";
import { DOC_KINDS, readDocument } from "@/lib/server/vision";

// Reading a photo with AI can take tens of seconds; fits the Vercel Hobby limit.
export const maxDuration = 60;

const MAX_BYTES = 8 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

/** Reads an uploaded licence, PAN, cheque or GST certificate with AI vision. */
export const POST = handler({ roles: MANAGERS }, async (req, outlet) => {
  const ai = aiProvider();
  if (!ai) throw new HttpError(503, "Document reading isn't set up on this server yet.");
  const form = await req.formData();
  const kind = z.enum(DOC_KINDS).parse(form.get("kind"));
  const file = form.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "Attach a photo or PDF.");
  if (!TYPES.includes(file.type)) throw new HttpError(415, "Use a JPG, PNG, WebP or PDF.");
  if (file.size > MAX_BYTES) throw new HttpError(413, "That file is over 8 MB. Take a closer photo or compress it.");
  // Open models read photos only, and the free tier takes up to about 4 MB.
  if (ai === "open" && file.type === "application/pdf") throw new HttpError(415, "Send a photo instead of a PDF.");
  if (ai === "open" && file.size > 4 * 1024 * 1024) throw new HttpError(413, "That photo is over 4 MB. Take it a little further away or send a smaller one.");
  try {
    const result = await readDocument(kind, Buffer.from(await file.arrayBuffer()).toString("base64"), file.type);
    if (!result) throw new HttpError(422, "Couldn't read that document. Try a sharper photo in good light.");
    await audit(outlet.id, "onboarding", "document.read", { kind, ok: result.is_expected_document });
    return result;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(502, describeAIError(err));
  }
});
