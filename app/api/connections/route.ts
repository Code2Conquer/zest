import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { audit, HttpError } from "@/lib/server/approvals";
import { McpConnector, PartnerApiConnector } from "@/lib/server/connectors";
import { encrypt, mask } from "@/lib/server/crypto";
import { db } from "@/lib/server/db";
import { assertWritable, handler, OWNER } from "@/lib/server/http";
import { connectionDTO } from "@/lib/server/queries";
import { connections } from "@/lib/server/schema";

export const GET = handler(async (_req, outlet) => (await db.select().from(connections).where(eq(connections.outletId, outlet.id))).map(connectionDTO));

const Body = z.discriminatedUnion("method", [
  z.object({ platform: z.enum(["zomato", "swiggy"]), method: z.literal("portal"), fields: z.object({ phone: z.string().regex(/^\+?[\d\s-]{10,15}$/, "Enter the 10-digit phone number") }) }),
  z.object({ platform: z.enum(["zomato", "swiggy"]), method: z.literal("api"), fields: z.object({ clientId: z.string().min(3), secret: z.string().min(8) }) }),
  z.object({ platform: z.enum(["zomato", "swiggy"]), method: z.literal("mcp"), fields: z.object({ url: z.string().url(), token: z.string().optional() }) }),
]);

/**
 * Connects a platform. MCP servers are verified by connecting and listing their
 * tools; partner API keys are stored and marked pending until the API is
 * configured; partner-app sign-ins are stored for the browser worker.
 */
export const POST = handler({ roles: OWNER }, async (req, outlet) => {
  assertWritable(outlet);
  const body = Body.parse(await req.json());
  let status: "connected" | "pending" = "connected";
  let statusDetail: string | null = null;
  let info: Record<string, unknown> = {};

  if (body.method === "mcp") {
    try {
      const tools = await new McpConnector(body.platform, body.fields).listTools();
      info = { url: body.fields.url, tools };
    } catch (err) {
      throw new HttpError(422, `Couldn't connect to that MCP server: ${(err as Error).message}`);
    }
  } else if (body.method === "api") {
    info = { clientId: body.fields.clientId, key: mask(body.fields.secret) };
    if (!PartnerApiConnector.baseUrl(body.platform)) {
      status = "pending";
      statusDetail = "Saved. Actions start once partner API access is set up on this server.";
    }
  } else {
    info = { phone: mask(body.fields.phone.replace(/\D/g, "")) };
    status = "pending";
    statusDetail = "Saved. The sign-in worker that acts on the partner app isn't running yet.";
  }

  const values = { outletId: outlet.id, platform: body.platform, method: body.method, secret: encrypt(body.fields), publicInfo: info, status, statusDetail, lastSyncAt: status === "connected" ? new Date().toISOString() : null };
  const [row] = await db
    .insert(connections)
    .values(values)
    .onConflictDoUpdate({ target: [connections.outletId, connections.platform], set: { method: values.method, secret: values.secret, publicInfo: values.publicInfo, status, statusDetail, lastSyncAt: values.lastSyncAt } })
    .returning();
  await audit(outlet.id, "owner", "connection.saved", { platform: body.platform, method: body.method, status });
  return connectionDTO(row);
});

export const DELETE = handler({ roles: OWNER }, async (req, outlet) => {
  assertWritable(outlet);
  const platform = z.enum(["zomato", "swiggy"]).parse(new URL(req.url).searchParams.get("platform"));
  await db.delete(connections).where(and(eq(connections.outletId, outlet.id), eq(connections.platform, platform)));
  await audit(outlet.id, "owner", "connection.removed", { platform });
  return { ok: true };
});
