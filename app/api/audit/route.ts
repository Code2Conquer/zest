import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/server/db";
import { handler } from "@/lib/server/http";
import { auditLog } from "@/lib/server/schema";

export const GET = handler(async (_req, outlet) => db.select().from(auditLog).where(eq(auditLog.outletId, outlet.id)).orderBy(desc(auditLog.createdAt)).limit(100));
