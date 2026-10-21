import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { createApproval, HttpError } from "@/lib/server/approvals";
import { db } from "@/lib/server/db";
import { assertWritable, handler, MANAGERS } from "@/lib/server/http";
import { approvalDTO } from "@/lib/server/queries";
import { reviews } from "@/lib/server/schema";

const Body = z.object({ text: z.string().trim().min(2).max(1500) });

/** Queues a reply for approval; approving it posts the reply on the platform. */
export const POST = handler<{ id: string }>({ roles: MANAGERS }, async (req, outlet, { id }) => {
  assertWritable(outlet);
  const { text } = Body.parse(await req.json());
  const [review] = await db.select().from(reviews).where(and(eq(reviews.id, id), eq(reviews.outletId, outlet.id)));
  if (!review) throw new HttpError(404, "Review not found.");
  if (review.reply) throw new HttpError(409, "This review already has a reply.");
  const row = await createApproval(outlet.id, { agent: "reviews", kind: "review_reply", title: `Reply to ${review.author}`, summary: text, payload: { reviewId: id, text } });
  return approvalDTO(row);
});
