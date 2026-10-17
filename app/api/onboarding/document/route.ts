import { z } from "zod";
import { audit, HttpError } from "@/lib/server/approvals";
import { describeClaudeError, hasClaude } from "@/lib/server/claude";
import { handler } from "@/lib/server/http";
import { DOC_KINDS, readDocument } from "@/lib/server/vision";

const MAX_BYTES = 8 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

/** Reads an uploaded licence, PAN, cheque or GST certificate with Claude vision. */
export const POST = handler(async (req, outlet) => {
  if (!hasClaude()) throw new HttpError(503, "Document reading needs ANTHROPIC_API_KEY on the server.");
  const form = await req.formData();
  const kind = z.enum(DOC_KINDS).parse(form.get("kind"));
  const file = form.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "Attach a photo or PDF.");
  if (!TYPES.includes(file.type)) throw new HttpError(415, "Use a JPG, PNG, WebP or PDF.");
  if (file.size > MAX_BYTES) throw new HttpError(413, "That file is over 8 MB. Take a closer photo or compress it.");
  try {
    const result = await readDocument(kind, Buffer.from(await file.arrayBuffer()).toString("base64"), file.type);
    if (!result) throw new HttpError(422, "Couldn't read that document. Try a sharper photo in good light.");
    await audit(outlet.id, "onboarding", "document.read", { kind, ok: result.is_expected_document });
    return result;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(502, describeClaudeError(err));
  }
});
