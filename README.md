# Zest

An AI operations team for restaurants that sell on Zomato, Swiggy and dine-in. A web app plus a conversational copilot that can act on the owner's behalf, with every change held for the owner's approval. Product plan: `PLAN.md`.

## Run it

```bash
npm install
cp .env.example .env.local     # optional: add ANTHROPIC_API_KEY for the full copilot
npm run dev                    # http://localhost:3000
```

The first request creates `.data/zest.db` and seeds a sample restaurant (Rasoi 27). "Look around with sample data" opens it; "Get started" creates your own restaurant in the same database.

For a production build: `npm run build && npm start`. Production needs `ZEST_SECRET_KEY`, and keeps the sample restaurant read-only unless `ZEST_DEMO_WRITABLE=1`.

To try a real MCP connection locally:

```bash
node scripts/mock-partner-mcp.mjs     # a stand-in partner MCP server on :8787
```

Then in Connections pick a platform → "MCP server" → `http://localhost:8787/mcp`. Approving a menu change calls its tools; `http://localhost:8787/log` shows what it received.

## How it works

```
Browser (Next.js pages)  ──►  /api/* route handlers  ──►  lib/server/*
                                                           ├─ db.ts, schema.ts      libSQL/SQLite via Drizzle
                                                           ├─ copilot.ts            Claude tool runner + keyword fallback
                                                           ├─ approvals.ts          draft → approve → execute → audit
                                                           ├─ connectors.ts         sandbox | MCP | partner API | partner-app sign-in
                                                           ├─ ingest.ts             payout emails (rules, Claude fallback)
                                                           ├─ vision.ts             documents and menu photos (Claude vision)
                                                           ├─ whatsapp.ts           Meta Cloud API, outbox
                                                           └─ crypto.ts, session.ts encrypted credentials, signed cookie
```

**Nothing reaches a platform without the owner.** Agents and the menu editor create *approvals*. Approving one runs it through each live platform's connector and records every step (and any failure, per platform) in the audit log. Menu changes can be undone; posted replies and disputes can't.

**Connectors.** Every platform implements one interface (`setAvailability`, `setPrice`, `updateItem`, `replyToReview`, `raiseDispute`, `createPromo`, `listOrders`):

| Method | Status |
|---|---|
| MCP server | Works. Verified on connect by listing tools; actions call the server's tools. |
| Partner API | Adapter in place; paths are placeholders until partner API access and specs are available. Saved keys show as "pending" until `*_PARTNER_API_URL` is set. |
| Partner-app sign-in | Credentials are stored encrypted. The browser worker that signs in and acts on the partner portal is the next build step; until then actions report that clearly. |
| Sandbox | Used by the sample restaurant. Mirrors actions locally. |

**Copilot.** With `ANTHROPIC_API_KEY`, the copilot runs Claude (`claude-opus-5-5`, server-side refusal fallback on) with nine tools: five that read the database (sales, orders, payouts, reviews, menu) and four that draft approvals (menu change, review reply, dispute, promo). Without a key it answers from the same data with keyword rules. Conversations are stored per restaurant.

**Data in.** Payout emails go through `POST /api/ingest/email` (paste on the Money page, or a mail-forwarding rule). Orders arrive by `POST /api/sync` (pull from MCP/API connectors; run it on a schedule) or signed webhooks at `/api/webhooks/{platform}`.

## API

| Endpoint | Does |
|---|---|
| `GET/POST/PATCH /api/outlet` | Current restaurant; `POST` starts your own, `PATCH` updates details |
| `POST/DELETE /api/outlet/demo` | Switch to the sample restaurant / reset it |
| `GET/POST/DELETE /api/connections` | Platform connections |
| `GET /api/today` | Dashboard summary |
| `GET /api/menu`, `POST /api/menu/changes`, `POST /api/menu/import` | Menu, edits as an approval, add dishes |
| `GET /api/orders`, `POST /api/sync`, `POST /api/webhooks/[platform]` | Orders in |
| `GET /api/payouts`, `POST /api/ingest/email` | Payouts and email ingestion |
| `GET /api/reviews`, `POST /api/reviews/[id]/reply` | Reviews and reply drafts |
| `GET/POST /api/approvals`, `POST /api/approvals/[id]` | Drafts; `{action: approve \| skip \| undo}` |
| `POST /api/onboarding/document`, `/menu`, `/submit` | Read documents and menu photos, listing application |
| `GET/POST/DELETE /api/copilot` | Conversation |
| `GET /api/notifications`, `POST /api/notifications/daily-summary` | WhatsApp outbox, morning summary |
| `GET /api/audit` | Activity log |

## Not built yet

- **Login.** A signed cookie identifies the restaurant per browser. Phone OTP login comes before launch.
- **Gmail / Outlook sign-in.** Needs OAuth app credentials; payout mails come in by paste or forwarding for now.
- **Partner-app browser worker**, and real partner API paths (see Connectors).
- **Scheduling.** `/api/sync` and `/api/notifications/daily-summary` are ready to be called by a cron job.
- **Dining and Growth screens** (Growth works through the copilot's promo drafts).

## Design notes

- Dishes are SVG illustrations (`components/dishes.tsx`) until the owner uploads photos in the menu editor.
- Animation uses `motion` and respects reduced-motion settings.
- Hindi and English throughout; the copilot replies in Hindi when the owner writes in Devanagari or Hinglish.
