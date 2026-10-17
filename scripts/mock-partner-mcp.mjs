// A stand-in for a platform's partner MCP server, for local development.
// Run: node scripts/mock-partner-mcp.mjs   (listens on http://localhost:8787/mcp)
// Then connect a platform in Zest by "MCP server" with that address.
import { createServer } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const PORT = Number(process.env.PORT ?? 8787);
const TOKEN = process.env.MOCK_MCP_TOKEN; // optional bearer token to require
const log = [];

const orders = [
  { externalId: "M-1001", items: "Paneer tikka, 2 butter naan", amount: 486, status: "preparing", prepMins: 6 },
  { externalId: "M-1002", items: "Chicken biryani", amount: 389, status: "delayed", prepMins: 19 },
];

function buildServer() {
  const server = new McpServer({ name: "mock-partner", version: "0.1.0" });
  const ok = (text) => ({ content: [{ type: "text", text }] });
  const record = (tool, args) => {
    log.push({ at: new Date().toISOString(), tool, args });
    console.log(tool, JSON.stringify(args));
  };

  server.registerTool("set_item_availability", { description: "Mark a menu item in or out of stock", inputSchema: { item_id: z.string(), item_name: z.string(), available: z.boolean() } }, async (a) => {
    record("set_item_availability", a);
    return ok(`${a.item_name} is now ${a.available ? "in stock" : "out of stock"}`);
  });
  server.registerTool("update_item_price", { description: "Change a menu item's price", inputSchema: { item_id: z.string(), item_name: z.string(), price: z.number() } }, async (a) => {
    record("update_item_price", a);
    return ok(`${a.item_name} now costs ₹${a.price}`);
  });
  server.registerTool("update_menu_item", { description: "Update a menu item's details", inputSchema: { item_id: z.string(), item_name: z.string() } }, async (a) => {
    record("update_menu_item", a);
    return ok(`${a.item_name} updated`);
  });
  server.registerTool("reply_to_review", { description: "Post a reply to a customer review", inputSchema: { review_id: z.string(), reply: z.string() } }, async (a) => {
    record("reply_to_review", a);
    return ok(`Reply posted to review ${a.review_id}`);
  });
  server.registerTool("raise_dispute", { description: "Dispute a charge on an order", inputSchema: { order_id: z.string(), amount: z.number(), reason: z.string() } }, async (a) => {
    record("raise_dispute", a);
    return ok(`Dispute DSP-${Math.floor(Math.random() * 9000 + 1000)} raised for order ${a.order_id}`);
  });
  server.registerTool("create_promo", { description: "Create a promo with a spend cap", inputSchema: { offer: z.string(), window: z.string(), spend_cap: z.number() } }, async (a) => {
    record("create_promo", a);
    return ok(`Promo scheduled: ${a.offer}`);
  });
  server.registerTool("list_orders", { description: "List active orders as JSON", inputSchema: {} }, async () => ok(JSON.stringify(orders.map((o) => ({ ...o, placedAt: new Date().toISOString() })))));
  return server;
}

createServer(async (req, res) => {
  if (req.url === "/log") {
    res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(log));
    return;
  }
  if (!req.url?.startsWith("/mcp")) return res.writeHead(404).end();
  if (TOKEN && req.headers.authorization !== `Bearer ${TOKEN}`) return res.writeHead(401).end();
  let body = "";
  for await (const chunk of req) body += chunk;
  const server = buildServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => {
    transport.close();
    server.close();
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, body ? JSON.parse(body) : undefined);
}).listen(PORT, () => console.log(`Mock partner MCP server on http://localhost:${PORT}/mcp`));
