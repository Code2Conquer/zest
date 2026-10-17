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

## Deploy (Vercel + Turso)

The pages and the API are one Next.js app, so one Vercel project serves both. The database lives on Turso (hosted SQLite).

1. **Database.** In [Turso](https://turso.tech), create a database (pick the Mumbai region). Copy its URL (`libsql://…`) and create a token.
2. **Project.** In [Vercel](https://vercel.com/new), import this GitHub repository. Framework is detected as Next.js; leave the build settings as they are.
3. **Environment variables** (Project → Settings → Environment Variables, then redeploy):

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the Turso URL |
   | `DATABASE_AUTH_TOKEN` | the Turso token |
   | `ZEST_SECRET_KEY` | output of `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. Keep it safe: changing it makes stored platform credentials unreadable. |
   | `ANTHROPIC_API_KEY` | optional, for the full copilot and document reading |
   | `ZEST_DEMO_WRITABLE` | optional, `1` to let visitors change the sample restaurant |

4. Open the deployment URL. The first request creates the tables and the sample restaurant.

Without `DATABASE_URL` the app still starts on Vercel, but on a temporary database that resets whenever the server restarts.

**Other hosts.** `Dockerfile` builds a self-contained server (data on `/data`), and `render.yaml` is a Render blueprint with a persistent disk.

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

**Zomato and Swiggy listings.** When an owner pastes their Zomato link (full or `zoma.to` share link) or Swiggy link, Zest reads it (Zomato: the public page and order page; Swiggy: the menu API its mobile site uses), fills in their profile, saves the rating and details, and brings in the menu with photos. The first read of a platform imports the menu if there is none, or sets that platform's prices and stock on dishes with the same name, adds the rest for that platform only, and marks dishes the listing doesn't have as off on that platform. Reading again (Connections) refreshes rating and details but never the menu. Results are cached for 10 minutes per link. Zomato blocks data-centre IPs, Vercel's included, so production needs `LISTING_FETCH_VIA`, a scraping relay URL template (see `.env.example`); without it the owner fills the form in by hand.

**Dining.** Tables grouped by area, each free, seated, bill printed or reserved, with party, time at the table and the running bill. Staff seat walk-ins, bookings or waitlisted guests, add dishes from the master menu at the dine-in price (the lowest platform price), print, and settle by cash, UPI or card; settling records a dine-in order so it counts in Today's sales. Bookings and the waitlist live alongside, with a WhatsApp "table ready" message to the guest. Each restaurant gets a public QR menu page. New restaurants get a starter floor plan to edit; the demo floor is rebuilt each day.

**Growth.** Promos and ads per platform with a hard spend cap (`MAX_PROMO_SPEND`). The builder estimates extra orders, spend, sales and return from the outlet's last 14 days of orders (or stated typical numbers when there is no history) and sends the plan for approval; approving it starts it through the platform connector and tracks it as a campaign. Suggestions come from the slowest open hours, a well-rated dish that sells little, new customers and upcoming festivals. The daily cron (and "Check now") ends campaigns at their cap or end date and pauses any returning less than its floor (3×) after ₹500, with a WhatsApp note. Campaign results need the platform's attribution data, so real outlets show spend and results once connectors report them; pausing on the platform side also waits on connector support.

**Gmail.** Owners connect Gmail with read-only access. Zest searches only Zomato and Swiggy senders (`GMAIL_SENDERS`), reads the last 30 days on first connect, then new mail on each sync. Each mail is sorted into payout, report, complaint, onboarding or other; payouts are extracted from the body (rules) or, with Claude, from PDF and CSV attachments. Tokens are stored encrypted. Disconnecting revokes access and deletes everything read, including payouts. While the Google app is in Testing mode, owners must be listed as test users and reconnect every 7 days.

**Data in.** Payout emails also go through `POST /api/ingest/email` (paste on the Money page, or a mail-forwarding rule). Orders arrive by `POST /api/sync` (pull from MCP/API connectors; run it on a schedule) or signed webhooks at `/api/webhooks/{platform}`.

## API

| Endpoint | Does |
|---|---|
| `GET/POST/PATCH /api/outlet` | Current restaurant; `POST` creates your restaurant and owner profile (name, area, city, optional FSSAI/GSTIN and listing links), `PATCH` updates details |
| `POST/DELETE /api/outlet/demo` | Switch to the sample restaurant / reset it |
| `GET/POST/DELETE /api/connections` | Platform connections |
| `GET /api/today` | Dashboard summary |
| `GET /api/menu`, `POST /api/menu/changes`, `POST /api/menu/import` | Menu, edits as an approval, add dishes |
| `GET /api/orders`, `POST /api/sync`, `POST /api/webhooks/[platform]` | Orders in |
| `GET /api/payouts`, `POST /api/ingest/email` | Payouts and email ingestion |
| `GET/DELETE /api/mail`, `POST /api/mail/sync` | Connected inbox status, disconnect, sync now |
| `POST /api/listing/preview`, `POST /api/listing/{zomato\|swiggy}` | Read a listing link (preview only / save to the restaurant: rating, address, hours, FSSAI, cost for two, and the menu with photos and per-platform prices) |
| `GET /api/dining`; `POST /api/dining/tables`, `DELETE /api/dining/tables/{id}` | Floor, open bills, today's bookings and waitlist, today's dine-in numbers; edit the floor plan |
| `POST /api/dining/tabs`, `PATCH /api/dining/tabs/{id}` | Seat a party; change dishes, print, reopen, settle (cash/UPI/card, records a dine-in order) or clear |
| `POST /api/dining/reservations`, `PATCH /api/dining/reservations/{id}` | Add a booking or waitlist entry; tell a guest their table is ready on WhatsApp, cancel, no-show |
| `GET /api/dining/qr`, page `/m/{outletId}` | Table QR code and the public dine-in menu it opens |
| `GET /api/growth`; `POST /api/growth/estimate`, `/propose`, `/check`; `PATCH /api/growth/campaigns/{id}` | Campaigns and suggestions; estimate a plan from the outlet's orders; send it for approval; run the automatic pause; pause, resume or end |
| `GET /api/mail/insights` | Payouts per platform, commission/ads/deduction shares, complaints and listing mails from the last 30 days |
| `GET /api/mail/google/start`, `/callback` | Google sign-in for Gmail |
| `GET /api/cron` | Scheduled sync of every inbox and platform (needs `CRON_SECRET`) |
| `GET /api/reviews`, `POST /api/reviews/[id]/reply` | Reviews and reply drafts |
| `GET/POST /api/approvals`, `POST /api/approvals/[id]` | Drafts; `{action: approve \| skip \| undo}` |
| `POST /api/onboarding/document`, `/menu`, `/submit` | Read documents and menu photos, listing application |
| `GET/POST/DELETE /api/copilot` | Conversation |
| `GET /api/notifications`, `POST /api/notifications/daily-summary` | WhatsApp outbox, morning summary |
| `GET /api/audit` | Activity log |

## Not built yet

- **Login.** A signed cookie identifies the restaurant per browser. Phone OTP login comes before launch.
- **Outlook sign-in.** Gmail is done; Outlook is next if owners ask for it.
- **Partner-app browser worker**, and real partner API paths (see Connectors).
- **Scheduling.** Vercel Cron calls `/api/cron` daily (Hobby limit); `.github/workflows/sync.yml` calls it every 15 minutes once the `ZEST_URL` and `CRON_SECRET` repository secrets are set.

## Design notes

- Dishes are SVG illustrations (`components/dishes.tsx`) until the owner uploads photos in the menu editor.
- Animation uses `motion` and respects reduced-motion settings.
- Hindi and English throughout; the copilot replies in Hindi when the owner writes in Devanagari or Hinglish.
