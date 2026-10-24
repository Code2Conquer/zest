import "server-only";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { aiProvider, claude, MODEL } from "./claude";
import { openStructured } from "./open-llm";

export const DOC_KINDS = ["fssai", "pan", "bank", "gst"] as const;
export type DocKind = (typeof DOC_KINDS)[number];

const DocSchema = z.object({
  is_expected_document: z.boolean().describe("True if the image is the requested kind of document and readable"),
  problem: z.string().describe("If not usable, what's wrong in one short sentence the owner can act on; else empty"),
  holder_name: z.string().describe("Name of the business or person on the document; empty if absent"),
  number: z.string().describe("Licence, PAN, account or GSTIN number exactly as printed; empty if absent"),
  valid_until: z.string().describe("Expiry date as YYYY-MM-DD; empty if none"),
  extra: z.string().describe("Other key detail: bank name and IFSC for a cheque, address for FSSAI; else empty"),
});
export type DocResult = z.infer<typeof DocSchema>;

const DOC_LABEL: Record<DocKind, string> = {
  fssai: "an FSSAI food business licence or registration certificate",
  pan: "a PAN card",
  bank: "a cancelled cheque or the first page of a bank statement",
  gst: "a GST registration certificate",
};

type ImageMedia = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

function sourceFor(base64: string, mediaType: string) {
  if (mediaType === "application/pdf") {
    return { type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data: base64 } };
  }
  return { type: "image" as const, source: { type: "base64" as const, media_type: mediaType as ImageMedia, data: base64 } };
}

/** Reads and checks one onboarding document. */
export async function readDocument(kind: DocKind, base64: string, mediaType: string): Promise<DocResult | null> {
  const ask = `An Indian restaurant owner uploaded this as ${DOC_LABEL[kind]}. Read it and check it's the right document and legible.`;
  if (aiProvider() === "open") return openStructured(DocSchema, ask, { base64, mediaType }, 1500);
  const res = await claude().messages.parse({
    model: MODEL,
    max_tokens: 2000,
    output_config: { effort: "low", format: zodOutputFormat(DocSchema) },
    messages: [
      {
        role: "user",
        content: [
          sourceFor(base64, mediaType),
          { type: "text", text: ask },
        ],
      },
    ],
  });
  if (res.stop_reason === "refusal") return null;
  return res.parsed_output ?? null;
}

const MenuSchema = z.object({
  items: z.array(
    z.object({
      name: z.string(),
      category: z.string().describe("Section heading from the menu, e.g. Starters, Main course, Breads"),
      price: z.number().describe("Price in rupees; if several sizes, the smallest"),
      veg: z.boolean().describe("False for dishes with meat, chicken, fish or egg"),
      description: z.string().describe("Description if printed; else empty"),
    }),
  ),
});
export type MenuResult = z.infer<typeof MenuSchema>;

/** Turns a photo of a paper menu or menu board into structured dishes. */
const MENU_ASK = "This is a photo of an Indian restaurant's menu. List every dish with its section, price and whether it's vegetarian. Keep names as printed, fixing only obvious spelling slips.";

export async function readMenu(base64: string, mediaType: string): Promise<MenuResult | null> {
  if (aiProvider() === "open") return openStructured(MenuSchema, MENU_ASK, { base64, mediaType }, 8000);
  const stream = claude().messages.stream({
    model: MODEL,
    max_tokens: 32000,
    output_config: { effort: "medium", format: zodOutputFormat(MenuSchema) },
    messages: [
      {
        role: "user",
        content: [
          sourceFor(base64, mediaType),
          { type: "text", text: MENU_ASK },
        ],
      },
    ],
  });
  const msg = await stream.finalMessage();
  if (msg.stop_reason === "refusal" || msg.stop_reason === "max_tokens") return null;
  const text = msg.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") return null;
  try {
    const parsed = MenuSchema.safeParse(JSON.parse(text.text));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
