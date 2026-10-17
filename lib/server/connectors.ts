import "server-only";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { Platform } from "../platforms";
import { decrypt } from "./crypto";
import type { Connection, MenuItemRow } from "./schema";

/**
 * Every selling platform is reached through this interface, whichever way the
 * owner connected it. Agents and the approval executor only ever call these.
 */
export interface PlatformConnector {
  readonly platform: Platform;
  readonly method: Connection["method"];
  setAvailability(item: MenuItemRow, available: boolean): Promise<ActionResult>;
  setPrice(item: MenuItemRow, price: number): Promise<ActionResult>;
  updateItem(item: MenuItemRow, fields: Partial<Pick<MenuItemRow, "name" | "description" | "veg" | "bestseller" | "photoUrl">>): Promise<ActionResult>;
  replyToReview(reviewExternalId: string, text: string): Promise<ActionResult>;
  raiseDispute(orderExternalId: string, amount: number, reason: string): Promise<ActionResult>;
  createPromo(promo: PromoInput): Promise<ActionResult>;
  listOrders(): Promise<IncomingOrder[]>;
}

export type ActionResult = { ok: true; reference?: string; note?: string } | { ok: false; error: string };

export type PromoInput = { offer: string; window: string; spendCap: number; expectedOrders: number };

export type IncomingOrder = {
  externalId: string;
  items: string;
  amount: number;
  placedAt: string;
  status: "preparing" | "ready" | "picked" | "delivered" | "delayed" | "cancelled";
  prepMins?: number;
};

export class ConnectorError extends Error {}

/** Mirrors actions locally without reaching a real platform. Used for the demo restaurant. */
class SandboxConnector implements PlatformConnector {
  readonly method = "sandbox" as const;
  constructor(readonly platform: Platform) {}
  private ok(what: string): ActionResult {
    return { ok: true, reference: `sandbox-${crypto.randomUUID().slice(0, 8)}`, note: `${what} (sandbox, not sent to ${this.platform})` };
  }
  async setAvailability(item: MenuItemRow, available: boolean) {
    return this.ok(`${item.name} ${available ? "in stock" : "out of stock"}`);
  }
  async setPrice(item: MenuItemRow, price: number) {
    return this.ok(`${item.name} price ₹${price}`);
  }
  async updateItem(item: MenuItemRow) {
    return this.ok(`${item.name} updated`);
  }
  async replyToReview() {
    return this.ok("Reply posted");
  }
  async raiseDispute(orderId: string, amount: number) {
    return this.ok(`Dispute for #${orderId}, ₹${amount}`);
  }
  async createPromo(p: PromoInput) {
    return this.ok(`Promo "${p.offer}"`);
  }
  async listOrders() {
    return [];
  }
}

// Tool names tried in order on an MCP server, so servers with different naming still work.
const MCP_TOOLS = {
  setAvailability: ["set_item_availability", "update_item_availability", "toggle_item_stock"],
  setPrice: ["update_item_price", "set_item_price"],
  updateItem: ["update_menu_item", "update_item"],
  replyToReview: ["reply_to_review", "post_review_reply"],
  raiseDispute: ["raise_dispute", "create_dispute"],
  createPromo: ["create_promo", "create_offer", "create_discount"],
  listOrders: ["list_orders", "get_orders"],
} as const;

type McpCreds = { url: string; token?: string };

/** Talks to any MCP server the owner points us at (the platform's, their POS's, or self-hosted). */
export class McpConnector implements PlatformConnector {
  readonly method = "mcp" as const;
  constructor(
    readonly platform: Platform,
    private creds: McpCreds,
  ) {}

  private async session<T>(fn: (client: Client) => Promise<T>): Promise<T> {
    const client = new Client({ name: "zest", version: "0.1.0" });
    const transport = new StreamableHTTPClientTransport(new URL(this.creds.url), {
      requestInit: { headers: this.creds.token ? { Authorization: `Bearer ${this.creds.token}` } : {} },
    });
    await client.connect(transport);
    try {
      return await fn(client);
    } finally {
      await client.close().catch(() => {});
    }
  }

  /** Connects and lists the server's tools. Used to verify a new connection. */
  async listTools(): Promise<string[]> {
    return this.session(async (c) => (await c.listTools()).tools.map((t) => t.name));
  }

  private async call(action: keyof typeof MCP_TOOLS, args: Record<string, unknown>): Promise<ActionResult> {
    try {
      return await this.session(async (c) => {
        const available = new Set((await c.listTools()).tools.map((t) => t.name));
        const name = MCP_TOOLS[action].find((n) => available.has(n));
        if (!name) return { ok: false, error: `The MCP server has no tool for this (looked for ${MCP_TOOLS[action].join(", ")}).` };
        const res = await c.callTool({ name, arguments: args });
        const text = Array.isArray(res.content) ? res.content.map((b) => (b.type === "text" ? b.text : "")).join("\n") : "";
        if (res.isError) return { ok: false, error: text || `${name} failed` };
        return { ok: true, note: text.slice(0, 500) || `${name} done` };
      });
    } catch (err) {
      return { ok: false, error: `Couldn't reach the MCP server: ${(err as Error).message}` };
    }
  }

  setAvailability(item: MenuItemRow, available: boolean) {
    return this.call("setAvailability", { item_id: item.id, item_name: item.name, available });
  }
  setPrice(item: MenuItemRow, price: number) {
    return this.call("setPrice", { item_id: item.id, item_name: item.name, price });
  }
  updateItem(item: MenuItemRow, fields: Record<string, unknown>) {
    return this.call("updateItem", { item_id: item.id, item_name: item.name, ...fields });
  }
  replyToReview(reviewId: string, text: string) {
    return this.call("replyToReview", { review_id: reviewId, reply: text });
  }
  raiseDispute(orderId: string, amount: number, reason: string) {
    return this.call("raiseDispute", { order_id: orderId, amount, reason });
  }
  createPromo(p: PromoInput) {
    return this.call("createPromo", { offer: p.offer, window: p.window, spend_cap: p.spendCap });
  }
  async listOrders(): Promise<IncomingOrder[]> {
    const res = await this.call("listOrders", {});
    if (!res.ok || !res.note) return [];
    try {
      const parsed = JSON.parse(res.note);
      return Array.isArray(parsed) ? parsed : (parsed.orders ?? []);
    } catch {
      return [];
    }
  }
}

type ApiCreds = { clientId: string; secret: string };

/**
 * Partner REST API. Neither platform publishes its partner API, so the base URL
 * comes from ZOMATO_PARTNER_API_URL / SWIGGY_PARTNER_API_URL and the paths below
 * are adjusted to the real spec once partner access is granted.
 */
export class PartnerApiConnector implements PlatformConnector {
  readonly method = "api" as const;
  constructor(
    readonly platform: Platform,
    private creds: ApiCreds,
  ) {}

  static baseUrl(platform: Platform) {
    return process.env[`${platform.toUpperCase()}_PARTNER_API_URL`];
  }

  private async request(path: string, body?: unknown, method = "POST"): Promise<ActionResult & { data?: unknown }> {
    const base = PartnerApiConnector.baseUrl(this.platform);
    if (!base) return { ok: false, error: `${this.platform} partner API isn't configured on this server (${this.platform.toUpperCase()}_PARTNER_API_URL).` };
    try {
      const res = await fetch(new URL(path, base), {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.creds.secret}`, "X-Client-Id": this.creds.clientId },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) return { ok: false, error: `${this.platform} API returned ${res.status}` };
      return { ok: true, reference: (data as { id?: string } | null)?.id, data };
    } catch (err) {
      return { ok: false, error: `Couldn't reach the ${this.platform} API: ${(err as Error).message}` };
    }
  }

  setAvailability(item: MenuItemRow, available: boolean) {
    return this.request(`menu/items/${item.id}/availability`, { available });
  }
  setPrice(item: MenuItemRow, price: number) {
    return this.request(`menu/items/${item.id}/price`, { price });
  }
  updateItem(item: MenuItemRow, fields: Record<string, unknown>) {
    return this.request(`menu/items/${item.id}`, fields, "PATCH");
  }
  replyToReview(reviewId: string, text: string) {
    return this.request(`reviews/${reviewId}/reply`, { text });
  }
  raiseDispute(orderId: string, amount: number, reason: string) {
    return this.request(`orders/${orderId}/disputes`, { amount, reason });
  }
  createPromo(p: PromoInput) {
    return this.request("promos", p);
  }
  async listOrders() {
    const res = await this.request("orders?status=active", undefined, "GET");
    return res.ok && Array.isArray(res.data) ? (res.data as IncomingOrder[]) : [];
  }
}

/**
 * Partner-app sign-in. Credentials are stored encrypted; a browser worker that
 * signs in and acts on the partner portal is the next build step, so actions
 * report clearly that they're waiting on it instead of pretending to succeed.
 */
class PortalConnector implements PlatformConnector {
  readonly method = "portal" as const;
  constructor(readonly platform: Platform) {}
  private pending(): ActionResult {
    return { ok: false, error: `Partner-app sign-in for ${this.platform} is saved, but the browser worker that acts on it isn't running yet. Connect by API or MCP to act now.` };
  }
  async setAvailability() {
    return this.pending();
  }
  async setPrice() {
    return this.pending();
  }
  async updateItem() {
    return this.pending();
  }
  async replyToReview() {
    return this.pending();
  }
  async raiseDispute() {
    return this.pending();
  }
  async createPromo() {
    return this.pending();
  }
  async listOrders() {
    return [];
  }
}

export function connectorFor(conn: Connection): PlatformConnector {
  switch (conn.method) {
    case "sandbox":
      return new SandboxConnector(conn.platform);
    case "mcp":
      return new McpConnector(conn.platform, decrypt<McpCreds>(conn.secret!));
    case "api":
      return new PartnerApiConnector(conn.platform, decrypt<ApiCreds>(conn.secret!));
    case "portal":
      return new PortalConnector(conn.platform);
  }
}
