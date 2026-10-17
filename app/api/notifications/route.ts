import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/server/db";
import { handler } from "@/lib/server/http";
import { notifications } from "@/lib/server/schema";

export const GET = handler(async (_req, outlet) => db.select().from(notifications).where(eq(notifications.outletId, outlet.id)).orderBy(desc(notifications.createdAt)).limit(50));
