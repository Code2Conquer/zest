import { handler } from "@/lib/server/http";
import { ordersChangedSince } from "@/lib/server/queries";

export const maxDuration = 60;

const POLL_MS = 2_000;
const PING_MS = 15_000;
// Ends before the function limit; the browser's EventSource reconnects with Last-Event-ID.
const LIFETIME_MS = 55_000;

/** Server-sent events: each change to this outlet's orders, within about 2 seconds. */
export const GET = handler({ staff: true }, async (req, outlet) => {
  let cursor = req.headers.get("last-event-id") || new URL(req.url).searchParams.get("cursor");
  const encoder = new TextEncoder();
  const started = Date.now();
  let lastSend = Date.now();

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (s: string) => {
        controller.enqueue(encoder.encode(s));
        lastSend = Date.now();
      };
      send("retry: 3000\n\n");
      while (!req.signal.aborted && Date.now() - started < LIFETIME_MS) {
        try {
          const changed = await ordersChangedSince(outlet.id, cursor);
          if (changed.orders.length) {
            cursor = changed.cursor;
            send(`id: ${cursor}\nevent: orders\ndata: ${JSON.stringify(changed.orders)}\n\n`);
          } else if (Date.now() - lastSend > PING_MS) {
            send(": ping\n\n");
          }
        } catch {
          break;
        }
        await new Promise((r) => setTimeout(r, POLL_MS));
      }
      try {
        controller.close();
      } catch {}
    },
  });

  return new Response(body, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-store", Connection: "keep-alive" } });
});
