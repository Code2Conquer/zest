# Zest, the all-in-one restaurant system: design

Date: 21 October 2026 · Status: decisions answered 21 October, awaiting approval of the full document · Builds on `PLAN.md` (§1–13) and replaces its §13 next steps from Phase A on

## 1. Intent

Zest becomes the one app an Indian restaurant runs on. Today it helps owners operate on Zomato, Swiggy and dine-in. This design adds the restaurant's **own** online business: its ordering site, WhatsApp ordering, delivery, customer list, marketing, loyalty and presence on Google. All of it sits in the same app and the same copilot as the aggregator and dining work.

The reference product is [Owner.com](https://www.owner.com/) (US), which sells restaurants a commission-free ordering site, automated marketing, loyalty, a Google reviews engine, SEO, a branded app and an AI agent. Zest adapts those ideas to India: UPI instead of cards, WhatsApp instead of email and SMS, Hindi and English, Zomato and Swiggy as channels that stay rather than channels to replace, and dine-in as a first-class channel.

**Why.** An owner on the aggregators pays roughly 22% commission (the sample outlet's payouts show 22%), plus ads, and never learns who their customers are. Owners already run their own channels informally: phone orders, WhatsApp messages, regulars at the counter. Zest turns those into a proper channel with a customer list, while keeping the aggregators running smoothly. The owner decides the mix.

## 2. Who it's for

- **Primary:** an owner of one to three outlets in a metro or tier-2 city, live on Zomato and/or Swiggy, with 20–80 seats of dine-in, no in-house tech person, running the business from a phone. Already the Phase 1 segment in `PLAN.md`.
- **Users inside the restaurant:** the owner (everything), a manager (orders, menu, dining, campaigns within limits), kitchen staff (the order screen only), and a cashier or captain (dining and billing).
- **Their customers:** people ordering from the restaurant's site, on WhatsApp, by phone, or at a table by scanning a QR code. They have no account and log in with their phone number only when they need to, for loyalty or order history.

## 3. Goals, non-goals, anti-goals

**Goals**
1. One order hub. Every order from Zomato, Swiggy, the restaurant's site, WhatsApp, phone and dine-in lands in the same queue and kitchen screen, with the same statuses.
2. A direct ordering channel an owner can switch on in under 15 minutes from the menu Zest already holds: a site, a QR code, a WhatsApp number, UPI payments and pickup and delivery.
3. A customer list that the restaurant owns, built from direct orders, dine-in bills, reservations and loyalty sign-ups, with recorded consent.
4. Repeat orders on autopilot: journeys, broadcasts and loyalty that run themselves, measured in orders and rupees, not opens.
5. Being found and chosen: Google profile, hours and reviews kept healthy, with an "Order online" link that points at the restaurant's own site.
6. A copilot that can do all of the above by chat, with the same approval rules that exist today.

**Non-goals (for this design)**
- A full POS with inventory, recipes and purchase orders. Zest connects to POSes (PLAN §5) and keeps a light billing flow for dining, which already exists.
- Native iOS and Android apps per restaurant. A PWA comes first; native apps are a later decision (§16).
- Running a delivery fleet. Zest dispatches to the restaurant's own riders or to delivery partners through their APIs.
- Card-present payments hardware.
- Becoming a marketplace. Each restaurant's site sells only that restaurant's food; there is no Zest-branded consumer app.

**Anti-goals (would make this a failure even if it works)**
- Making aggregator orders worse. The direct channel must never slow down, hide or deprioritise Zomato and Swiggy orders in the hub or the kitchen.
- Spam. Messages to customers who didn't opt in, or more than the frequency cap, or late at night. One complaint-driven WhatsApp number ban hurts every outlet.
- Moving money that Zest holds. Zest never takes custody of customer payments; money goes from the customer straight to the restaurant's own gateway account.
- Breaking an owner's aggregator contract on their behalf. Price and offer differences between channels are the owner's explicit choice, with a warning, never something an agent does on its own (§12).
- Review gating. Every customer who is asked for a review gets the public review link, whatever they say first.

## 4. Principles carried over

The rules in `PLAN.md` §1 still apply: chat and UI are one surface, mobile first and WhatsApp native, read then draft then act, Hindi and English, and every action logged and reversible where possible. Two additions:

- **Channel-neutral by default.** Modules show all channels together; channel colour appears only as small chips. The existing rule "the owner ticks where they're live" extends to the new channels.
- **Money and messages are always on the record.** Every payment, refund and outbound customer message is a row the owner can see, with who or what triggered it.

## 5. Where Zest is today (from `main`, commit 143ec38)

| Area | State | Base for |
|---|---|---|
| Approvals, audit log, action tiers | Built (`lib/server/approvals.ts`) | New approval kinds (§9) |
| Copilot, Claude tool runner, keyword fallback | Built, 9 tools (`lib/server/copilot.ts`) | New tools (§10) |
| Connectors: MCP works; partner API and portal stubs | `lib/server/connectors.ts` | ONDC and Google as connectors |
| Menu: master menu, per-platform price and stock, photos | Built | Storefront menu, upsells |
| Orders: channels `zomato`, `swiggy`, `dine`; free-text `items` | Built | Order hub; needs order lines and new channels |
| Dining: floor, tabs, settle by cash/UPI/card, reservations, waitlist, public QR menu `/m/[outletId]` | Built | Table ordering, customer capture |
| Growth: platform promos/ads, spend caps, auto-pause, festival suggestions | Built (`lib/server/growth.ts`) | Festival calendar shared with journeys |
| WhatsApp: Cloud API client and outbox, owner messages | Built, not configured (`lib/server/whatsapp.ts`) | Customer messaging (needs templates and consent) |
| Gmail ingestion, listing readers (Zomato, Swiggy) | Built | Presence checks |
| Login | Signed cookie per browser | **Must** become phone OTP with roles first |
| Tests | None; CI runs `tsc` and `next build` | **Must** add a test runner first |
| Scheduling | Daily Vercel cron + 15-minute GitHub Action | Needs a job runner for journeys and delivery |
| Database | libSQL/Turso, tables created in `lib/server/db.ts` with `CREATE TABLE IF NOT EXISTS` and additive `ALTER TABLE` | Same approach for new tables |

A local prototype built on 21 October in `~/Documents/zest-v2` (Growth, "Your website", Online presence, `/score`) was made on an old copy without the backend. It is a throwaway sketch and nothing in this design depends on it.

## 6. Owner.com feature map

Owner.com claims are from its public pages, read on 21 October 2026, and are marketing claims.

| Owner.com feature | What it does there | Zest version for India | Builds on | Phase |
|---|---|---|---|---|
| Online ordering | Mobile-first site, pickup and delivery, no commission, QR flyers | Storefront on `{slug}.zest.menu` or the owner's domain; pickup, delivery, dine-in table ordering, scheduled orders; UPI first | Menu, QR menu page | B |
| Kitchen tablet | Order screen, Bluetooth printer, prep time, busy mode | Order hub + kitchen screen (any Android tablet or phone, PWA), browser printing and ESC/POS printers, busy mode per channel | Orders board | B |
| Delivery | Third-party drivers at a flat rate, in-house riders, tracking | Own riders (a rider link, no app) plus on-demand partners through an adapter; tracking link on WhatsApp | — | C |
| Smart upsells | Add-on suggestions at checkout from cross-restaurant data | Add-ons from items ordered together across all of the outlet's channels, plus owner overrides | Orders | C |
| Branded app, push | iOS/Android app per restaurant, reorder, loyalty, push | Installable PWA per restaurant with reorder, loyalty and web push; WhatsApp as the main re-engagement channel | Storefront | D |
| Email and SMS marketing, campaigns | Holiday sequences, cart recovery, AI writing help | WhatsApp-first journeys and broadcasts; SMS fallback through DLT-registered templates; copilot drafts | WhatsApp outbox, festival list | D |
| Loyalty and rewards | Points per order, rewards, passwordless sign-up, per-item points | Points per ₹100 and per-item bonus points, rewards redeemable online and on the dine-in bill, phone OTP | Dining tabs | D |
| Reviews engine | Automatic Google review requests after orders | Requests after direct and dine-in orders on WhatsApp; private feedback channel without gating; Google review replies drafted | Reviews inbox | E |
| Listings management, SEO | Consistent info across listings, ranking work | Google Business Profile connection: hours, holiday hours, "Order online" link, photos; hours kept in sync with Zomato, Swiggy and the storefront; dish and area pages with structured data | Listing readers | E |
| Restaurant Grader | Free online health score with lost-sales estimate | Online presence score in the app, and a public `/score` page as a lead magnet | Listing readers | E |
| Catering | Catering menu, lead times, minimums, confirmation, inquiry form | Party and bulk orders: own menu, lead time, minimum, advance payment by UPI, quote approval | Storefront | F |
| AI phone ordering | Answers 24/7, takes orders, transfers allergies and complaints | Hindi and English voice agent on the restaurant's number, orders into the hub; waitlist pilot | Copilot | F |
| Reporting and analytics | Sales, sources, top sellers, rankings, reviews driven | Channel profitability after commission and fees, customer cohorts, campaign and journey attribution, menu engineering | Today, Money | F |
| Owner Agent | Chat that edits menu, hours and site; insights; approve one or all | The copilot gains tools for every new module; "approve all" on the approvals queue | Copilot, approvals | B–F |
| POS, POS integrations | Own POS, Square and Clover integrations | Keep dining billing; POS connectors per PLAN §5 | Dining | Later |

Not adopted: Owner's US-specific card processing and US delivery pricing; job postings on the site (possible later); its own POS hardware.

## 7. The system

### 7.0 Brands and outlets (decided)

A **brand** sits above outlets. An owner with one restaurant has one brand with one outlet; nothing changes for them on screen.

- **Per brand:** customers and their consents, loyalty accounts and rewards, the storefront (with an outlet picker when there are several), the WhatsApp Business number, the payment gateway account, journeys and broadcasts, the Google connection when the brand has one profile per outlet it is held per outlet instead.
- **Per outlet:** menu, prices and stock, hours, orders, kitchen screen, dining floor, delivery zones, riders, aggregator connections and listings.
- The session and roles (§7.17) attach a person to a brand, with access to all or some of its outlets.


### 7.1 Channels

`Channel` today is `zomato | swiggy | dine`. It becomes:

- `zomato`, `swiggy`: aggregator orders, as today.
- `ondc`: aggregator orders from ONDC buyer apps, through a connector like the other two (Phase F).
- `web`: orders on the restaurant's storefront or PWA.
- `whatsapp`: orders placed in a WhatsApp chat.
- `phone`: orders taken by staff over the phone, or by the voice agent.
- `dine`: dine-in bills and table orders, as today.

`web`, `whatsapp` and `phone` together are **direct** channels: no commission, a customer record, and payment through the restaurant's own gateway. Every screen that groups by channel shows direct channels as one group that the owner can expand. Channel colours: existing three stay; direct gets one new token (`--ch-direct`) used for all three, checked for contrast in light and dark the same way the existing tokens were.

### 7.2 Order hub and kitchen screen

**One queue for every channel, as feeds arrive (decided).** Aggregator orders join the hub and kitchen screen only once a real-time feed exists for them, through whichever path comes first: Zomato's internal merchant API, an MCP server, the partner programmes, or POS middleware such as UrbanPiper (PLAN §13 step 9). Until then, Phase B pilots run the kitchen screen for direct and dine-in orders, with the partner tablets alongside, and the hub shows aggregator orders from the existing sync as read-only history. The order model, statuses and screens are built for every channel from the start, so turning on a feed needs no redesign.

The current Orders board becomes the hub. Each order shows channel, items with modifiers, amount, fulfilment (delivery, pickup, dine-in table, scheduled for a time), payment status, customer note and a timer against the promised time.

- **States:** `new → accepted → preparing → ready → out_for_delivery | picked_up | served → completed`, plus `rejected`, `cancelled` and `delayed` (a flag, not a state). Aggregator orders map their own states onto these. The existing enum (`preparing, ready, picked, delivered, delayed, cancelled`) is migrated.
- **Accepting.** Aggregator orders are accepted on the aggregator (through the connector where possible). Direct orders are accepted in Zest; an owner setting allows auto-accept during open hours.
- **Kitchen screen** (`/kitchen`): a full-screen PWA for a tablet or phone propped in the kitchen. Large tickets, sorted by promised time, audible alert on new orders, bump to move a ticket on, works in dark mode. It needs a staff login with the kitchen role and shows nothing else.
- **Printing.** Kitchen ticket and customer bill from the browser print dialog for any printer; direct ESC/POS over Bluetooth or the network through the Web Bluetooth/Serial API where the device supports it; otherwise a small print-relay (later).
- **Busy mode.** One switch adds a fixed number of minutes to promised times on the direct channels and, where the connector supports it, on the aggregators. A second switch pauses direct ordering. Both are staff actions recorded in the audit log, not approvals.
- **Prep time.** Default per outlet, with per-dish overrides; the hub learns typical prep times from history and shows them.
- **Realtime.** New orders reach the hub and kitchen within 5 seconds. Server-Sent Events from a route handler, with polling every 10 seconds as the fallback when SSE is cut by the host.

### 7.3 Storefront (direct ordering site)

**Address.** `https://{slug}.zest.menu` by default, one per brand with an outlet picker (decided: `zest.menu` is to be bought); an owner can connect their own domain (CNAME, TLS from the host). The existing `/m/[outletId]` QR page becomes the dine-in mode of the storefront and keeps working.

**What a customer sees.** Restaurant header (name, area, rating from Google and the aggregators with sources, open or closed now), categories, dishes with photos, veg marks, bestseller tags, add-ons and variants, cart, checkout. Hindi and English. Loads in under 2 seconds on a mid-range Android phone on 4G (Lighthouse mobile performance at least 85).

**Fulfilment modes** (each switched on per outlet):
- Pickup, with a ready time.
- Delivery inside zones the owner draws or sets by radius, with a fee per zone and a minimum order (§7.5).
- Dine-in table ordering when opened from a table QR code: the order goes to that table's open tab in Dining.
- Scheduled orders for later today or tomorrow, within opening hours.

**Menu and prices.** The storefront reads the master menu. Each dish gets a direct price, defaulting to the lowest platform price, which matches how `dinePrice` already works for dine-in. Packaging charges per dish or per order. Availability follows the master menu, so stock-outs apply everywhere at once.

**Variants and add-ons.** Not in the data model yet (PLAN Phase 2 lists them as not done). This design adds them: an item has option groups (size, spice, add-ons), each with min and max choices and a price delta. The menu editor gets the same groups, and aggregator listings imported later can map to them.

**Checkout.** Name, phone number (verified by OTP the first time on that device, or through WhatsApp), address for delivery with a map pin, delivery or pickup time, a note, coupon or reward, and payment.

**Payment.** UPI intent and collect, cards, net banking and wallets through the restaurant's own payment gateway account (§7.4). Cash on delivery is an owner setting, off by default. Orders are created when payment succeeds; unpaid orders time out after 15 minutes.

**Receipts.** A GST invoice per order (restaurant GSTIN, 5% GST for restaurants without input tax credit, SAC 996331) on screen and on WhatsApp. FSSAI licence number shown on the storefront footer and receipts.

**SEO.** Server-rendered pages with `Restaurant` and `Menu` structured data, a sitemap, Open Graph images built from dish photos, and pages per popular dish and area (§7.11).

**Customer accounts.** None to create. The phone number is the identity; a signed cookie remembers the device. Past orders and loyalty points appear once the number is verified.

### 7.4 Payments and settlement

- **Gateway model (decided).** Razorpay first. Zest joins Razorpay's partner programme and onboards each brand's own merchant account through it. Settlements go from Razorpay straight to the restaurant's bank account. Zest never holds funds, so Zest does not need to be a payment aggregator under RBI rules. Cashfree can be added later behind the same interface.
- **While KYC is pending.** Gateway KYC takes days. The storefront goes live straight away with pickup orders paid at the counter (cash or the restaurant's own UPI QR), marked unpaid in the hub until settled. Online payment, delivery and scheduled orders switch on when the gateway account is active.
- **Zest's own fee** is a flat monthly subscription billed separately, so no split settlement is needed.
- **Webhooks.** Payment captured, failed and refunded webhooks, verified by signature, update the order and a `payments` row.
- **Refunds.** Full or partial, always an approval (`refund` kind), executed through the gateway API, with the reason recorded and the customer told on WhatsApp.
- **Money module.** Direct-channel settlements appear next to aggregator payouts. A new view, **channel economics**, shows for each channel over a period: gross sales, commission or gateway fee, delivery cost, discounts and rewards, and net revenue per order. This is where the owner sees what each channel really earns.

### 7.5 Delivery

- **Zones.** Radius or polygon zones with a fee, a minimum order and an estimated time each. Addresses outside every zone get "pickup only" at checkout.
- **Own riders.** Staff riders get a link (no app install) showing assigned orders, the customer address with a map link, a call button and "picked up" and "delivered" buttons. The customer gets a WhatsApp message with a live-status link.
- **Delivery partners.** A `DeliveryProvider` interface (`quote`, `book`, `cancel`, `track`) with one adapter first. Candidates with public APIs: Borzo, Porter and Shadowfax, or ONDC logistics. The quote is fetched at checkout; booking happens when the kitchen marks an order ready, or at a set time before the promised time. Partner costs show in channel economics.
- **Failure handling.** If booking fails or no rider is assigned within the set number of minutes, the hub alerts staff and offers to retry, switch to an own rider, or call the customer.

### 7.6 WhatsApp ordering

- Customers message the brand's WhatsApp Business number. A guided flow (WhatsApp lists and buttons, with a catalogue synced from the master menu) builds a cart; payment is a UPI payment link from the gateway. The order lands in the hub as channel `whatsapp`.
- Free-text messages ("2 dal makhani and 4 roti, delivery to the usual") are understood by a model turn that drafts the cart and asks the customer to confirm. Nothing is charged without the customer tapping confirm.
- Staff can take over the chat at any time; the bot stays quiet while a human is replying.
- **Account model (my call).** Each brand owns its own WhatsApp Business account, connected through Zest as a Meta Tech Provider using Embedded Signup, so one restaurant's quality rating or ban never touches another. Where the restaurant already uses the WhatsApp Business App on its number, Meta's coexistence mode keeps that number; otherwise a new number is set up. Meta's per-message charges are billed to the restaurant's own account. The owner-notification number the app uses today stays Zest's. (Decision still open: Meta direct or a BSP, PLAN §13.)
- Until a restaurant's WhatsApp is connected, customer OTP falls back to SMS through a DLT-registered OTP template.

### 7.7 Customers

- **Profile.** One record per phone number per brand: name, phone, addresses, birthday (optional), channels used, orders, spend, last order, loyalty balance, tags, notes, consents.
- **Sources.** Direct orders, dine-in bills (phone captured at billing or when the guest scans the bill QR), reservations and the waitlist (which already store a phone), loyalty sign-ups, WhatsApp chats, phone orders. Aggregator customers are not added: the platforms mask their numbers, and Zest does not try to work around that.
- **Consent ledger.** Every opt-in and opt-out is a row: channel (WhatsApp marketing, SMS marketing, WhatsApp transactional), purpose, the exact wording shown, source page, time. "STOP" on WhatsApp opts out at once. Transactional messages about an order the customer placed are allowed without marketing consent; marketing needs it. Records support DPDP Act notice and consent duties (Rules notified November 2025, with consent obligations phased in; verify dates against the gazette before launch).
- **Segments.** Rule-based: new, regulars (3+ orders in 60 days), drifting (ordered before, none in 45 days), big spenders, by dish, by channel, by area, birthday this month. Counts update nightly. Owners can save their own.
- **Privacy.** Phone numbers are shown masked to manager and staff roles; only the owner sees full numbers and can export. Deleting a customer erases their personal data and keeps anonymised order totals.

### 7.8 Marketing: journeys and broadcasts

- **Journeys** run on their own once switched on, each a trigger, a wait, a condition and a message:
  - Welcome after the first direct order (next day): save the number, how loyalty works.
  - Thank-you after dine-in, with the review request (§7.10).
  - Abandoned cart (storefront and WhatsApp), 20 minutes after the last activity.
  - Win-back for drifting customers, at 45 days, with an optional coupon.
  - Birthday, 3 days before, for members who gave a birthday.
  - Festival and event sequences from the calendar Growth already uses (Diwali, Holi, Eid, Christmas, IPL and India matches), drafted 10 days before and sent only after approval.
- **Broadcasts** are one-off messages to a segment, always an approval (`campaign_send`), showing the audience size, cost estimate (Meta charges per marketing message), the exact message and the send time.
- **Guardrails.** Frequency cap: at most 2 marketing messages per customer per 7 days across all journeys and broadcasts (owner can lower it). Quiet hours: none between 9:30 pm and 9 am. Only opted-in customers. Every message has an opt-out line.
- **Content.** The Marketing agent drafts copy in Hindi and English with dish photos from the menu; the owner edits in the approval card. WhatsApp templates are submitted to Meta from Zest and their approval state is shown.
- **Attribution.** An order is attributed to a message if the customer orders within 72 hours of receiving it (coupon-code orders are attributed directly). Reports show messages sent, orders, revenue and cost per journey and broadcast.
- **SMS fallback** for customers without WhatsApp, only through DLT-registered headers and templates, and only after the owner completes DLT registration (shown as a setup step).

### 7.9 Loyalty

- **Earning.** Points per ₹100 spent on direct channels and dine-in (default 10), with bonus points per dish set by the owner. Aggregator orders don't earn points (no customer identity).
- **Rewards.** A short ladder the owner sets (default: 100 points a free dessert, 250 a free starter, 400 ₹200 off). Rewards are redeemed at storefront checkout, on WhatsApp orders, and on the dine-in bill (the cashier looks up the guest by phone and applies it to the tab).
- **Joining.** Automatic on the first direct order or dine-in bill with a phone number and consent; or from the storefront and a table card.
- **Rules.** Points post when an order completes and are reversed on refunds. Optional expiry (default 12 months of inactivity). Changing the earn rate or rewards is an approval (`loyalty_change`).
- **Measured** by members, repeat rate and visits per month of members against non-members, rewards redeemed and their cost.

### 7.10 Reviews engine

- After every completed direct or dine-in order, and once per customer per 30 days at most, a WhatsApp message asks how it was, with the Google review link. Customers may also reply privately; that reply goes to the Reviews inbox and the owner is alerted for 1–3 stars. **Everyone gets the Google link**, whatever they answer (no gating, which Google's policies forbid).
- Google reviews come into the Reviews inbox next to Zomato and Swiggy reviews (through the Google Business Profile connection, §7.11). The Reviews agent drafts replies; posting is an approval (`review_reply`, extended to Google).
- Reported: requests sent, Google reviews gained, their average, private feedback count, Google rating against nearby restaurants.

### 7.11 Google, listings and SEO

- **Google Business Profile connection** (OAuth, owner's Google account). Read and update hours, special hours, description, photos and attributes; add the storefront as the food-ordering and table-booking link through Google's place action links; read reviews and post replies. Google gates API access by application, so this starts with an access request (§15).
- **Hours in one place.** Regular hours, special hours and holiday closures are set once in Zest and pushed to the storefront, Google, and Zomato and Swiggy (through connectors where supported; otherwise Zest shows a task for the owner with exact steps). An hours change from the copilot is an approval (`hours_change`) listing every place it will update.
- **Listing health checks** run nightly: is the profile verified; do hours match everywhere; is there an ordering link; are dishes missing photos or descriptions on each listing; are bestsellers switched off on a platform; reply rate on Google; recent photos. Each failing check carries a fix, which is either an approval or a guided task.
- **SEO pages** on the storefront: one page per popular dish ("Dal makhani in Indiranagar") and per area served, written by the Marketing agent from the menu and reviews, published by approval. Structured data on every page. Search Console connection (optional) to report impressions and clicks.

### 7.12 Online presence score and the public grader

- **In the app:** a score out of 100 from the health checks, weighted by an estimate of sales lost per month for each failing check, with the fixes listed in order of value. The estimate model is simple and stated on screen (searches in the area for the cuisine, click and order rates, average order).
- **Public `/score` page:** anyone types a restaurant name and area; Zest finds the Google listing and the Zomato and Swiggy pages through the existing listing readers and public data, and shows the score and top three gaps. A call to action leads to sign-up, with the restaurant pre-filled. Results are cached; the page is rate-limited per IP.

### 7.13 Catering and bulk orders

- A separate catering menu (items sold by serving size or tray), with lead time, minimum order and service areas.
- Customers send a request from the storefront; the Orders agent drafts a quote (items, delivery, setup fee, GST); the owner approves; the customer pays an advance by UPI link; the order appears in the hub on the day with its prep schedule.

### 7.14 Phone ordering

- **Staff-taken phone orders** (Phase B): a quick order screen in the hub (search dishes, customer by phone, fulfilment, payment by link or on delivery).
- **AI voice agent** (Phase F pilot): answers the restaurant's number in Hindi and English through a telephony provider, takes orders from the menu, confirms them back, sends a payment link, and transfers to staff for allergies, complaints or anything unclear. Calls are recorded only with an announced notice.

### 7.15 Reporting

- **Today** gains direct orders, new customers and reviews gained.
- **Channel economics** (in Money, §7.4).
- **Customers:** new against returning, cohort repeat rates by month of first order, members against non-members.
- **Marketing:** per journey, broadcast and promo: sent, orders, revenue, cost, return.
- **Menu engineering** (PLAN Phase 3): popularity against margin quadrants once dish costs are entered; upsell attach rates.
- **Weekly summary** on WhatsApp: sales by channel, direct share, new customers, reviews gained, best and worst dish.

### 7.16 Installable app (PWA)

- The storefront is a PWA: install prompt after the second order, home-screen icon with the restaurant's logo, one-tap reorder of past orders, loyalty card, web push for order status and (with consent) offers.
- The owner app is also a PWA, with push for new orders and approvals.
- Native store apps are not in scope (§16).

### 7.17 Staff, roles and login

A prerequisite already listed in PLAN §13. Phone OTP login replaces the browser cookie. Roles: owner, manager, kitchen, cashier, rider. Each API route checks the role. Kitchen and rider roles see only their screens. Every approval and audit row records the person, not just the outlet.

## 8. Data model additions

New tables and columns, created the way `lib/server/db.ts` does today (`CREATE TABLE IF NOT EXISTS` and additive `ALTER TABLE ADD COLUMN`). Names are the builder's to finalise; the shapes are the decisions.

| Table | Holds |
|---|---|
| `brands` (+ `outlets.brand_id`) | The brand layer (§7.0); every existing outlet gets a brand of its own in the migration |
| `users`, `memberships` | People who log in, and their role per brand with an outlet list |
| `otp_challenges` | Phone OTPs for staff and customer verification, hashed, with expiry and attempt counts |
| `brand_sites` | Slug, custom domain, theme (logo, colour), modes on (pickup, delivery, table, scheduled), cash allowed, auto-accept, min order, packaging rules, gateway connection reference |
| `outlet_hours`, `special_hours` | Weekly hours per channel, and dated exceptions |
| `option_groups`, `options` | Variants and add-ons per menu item |
| `menu_items` (+ columns) | `direct_price`, `packaging_charge`, `prep_mins`, `loyalty_bonus`, `catering` flag |
| `orders` (+ columns) | `customer_id`, `fulfilment`, `table_id`, `scheduled_for`, `promised_at`, `payment_status`, `payment_id`, `delivery_id`, `subtotal`, `discount`, `packaging`, `delivery_fee`, `tax`, `source_detail` (journey or coupon) ; channel enum widened (§7.1) ; status enum migrated (§7.2) |
| `order_lines` | Item, name at time of order, qty, unit price, chosen options, line total; the free-text `items` column stays as a display summary |
| `payments`, `refunds` | Gateway ids, amounts, status, raw webhook reference |
| `delivery_zones`, `deliveries`, `riders` | Zones; each delivery with provider, quote, booking id, rider, status history, tracking link |
| `customers`, `customer_addresses`, `consents` | §7.7 |
| `segments` | Saved rules |
| `journeys`, `journey_runs`, `messages` | Journey definitions and state per customer; every outbound customer message with template, status, cost and attribution window. Owner notifications stay in `notifications` |
| `whatsapp_templates` | Template name, category, language, body, Meta approval status |
| `coupons` | Code, rule, limits, source journey |
| `loyalty_accounts`, `loyalty_ledger`, `rewards` | §7.9 |
| `review_requests` | Who was asked, when, and the response |
| `reviews` (+ values) | `platform` gains `google` |
| `listing_checks` | Nightly check results per outlet, with impact estimate and fix |
| `catering_requests` | §7.13 |
| `jobs` | Durable scheduled work (§11.3) |

## 9. Approvals and actions

New approval kinds join `menu_change`, `review_reply`, `dispute`, `promo` and `listing_application`:

| Kind | Example | Executes through |
|---|---|---|
| `campaign_send` | WhatsApp broadcast to 640 drifting customers | WhatsApp sender with consent and frequency checks |
| `journey_change` | Turn on the birthday journey with this message | Journey store |
| `hours_change` | Diwali, 11 am to 6 pm | Storefront, Google, aggregator connectors |
| `listing_fix` | Add the ordering link on Google | Google connector |
| `seo_page` | Publish "Biryani in Indiranagar" | Storefront |
| `loyalty_change` | Double points on dal makhani this week | Loyalty store |
| `refund` | ₹249 back to Karthik for a missing item | Payment gateway |
| `catering_quote` | Quote ₹14,200 for 40 people on Saturday | WhatsApp + payment link |
| `price_difference` | Direct price lower than Zomato on 6 dishes | Menu store, with the contract warning (§12) |

Staff operational actions (accept, reject, bump, busy mode, pause direct ordering, assign rider) are not approvals; they are audit-logged actions by a logged-in person.

The approvals queue gains **approve all** for pending items of the same kind, which Owner Agent also offers. Refunds and price differences are excluded from approve-all.

## 10. Copilot additions

New read tools: `get_customers` (segments and counts), `get_direct_summary` (direct sales, savings against commission), `get_presence` (score and failing checks), `get_journeys` (performance), `get_deliveries` (late or failed).

New draft tools (each creates an approval of the matching kind): `propose_campaign`, `propose_journey_change`, `propose_hours_change`, `propose_listing_fix`, `propose_seo_page`, `propose_loyalty_change`, `propose_refund`.

The keyword fallback gets matching routes so the app stays useful without `ANTHROPIC_API_KEY`. The eval harness (PLAN §13 step 2) gets golden conversations for each new tool in Hindi, English and Hinglish before the tool ships.

## 11. Engineering foundations

### 11.1 Tests
There are none today. Before feature work: Vitest for server logic (pricing, tax, points, segments, frequency caps, attribution, state transitions) against an in-memory libSQL database; Playwright for the storefront checkout and the kitchen screen; both in CI next to `tsc` and `next build`. Every task in the implementation plans is test-first.

### 11.2 Multi-tenant storefront routing
Next.js middleware maps the host (`{slug}.zest.menu` or a custom domain) to an outlet and rewrites to storefront routes. The owner app stays on the main domain. Storefront pages are server-rendered and cached per outlet, revalidated on menu or hours changes.

### 11.3 Background work
Journeys, delivery booking, abandoned-cart timers, nightly checks and order sync need reliable scheduling at minute granularity. Vercel Hobby crons run once a day. Decided: move to Vercel Pro, with a `jobs` table of idempotent handlers driven by a once-a-minute cron, so the scheduler can change later without touching handlers.

### 11.4 Realtime
SSE for the hub and kitchen with a 10-second polling fallback (§7.2). No websocket infrastructure.

### 11.5 Security
Payment and gateway secrets and Google tokens encrypted with the existing AES-256-GCM helper. Webhook signatures verified for payments, delivery and WhatsApp. Rate limits on OTP, checkout and `/score`. Customer phone numbers never sent to the model unless a tool needs them for a single draft; never in logs.

## 12. Legal and policy

Decided: only two things wait for legal sign-off. Phase B's online payments and any direct price lower than an aggregator price; and Phase D's marketing messages (consent wording, journeys, broadcasts). Everything else proceeds. Who signs off is still to be named. The items to clear:

- **Aggregator contracts.** Zomato and Swiggy partner agreements may restrict lower prices or bigger discounts elsewhere. The CCI has investigated this; a 2024 report of its findings described parity restrictions, and no final order was found when this was written. Zest shows the owner a warning when the direct price is lower than an aggregator price and never sets such a difference without the owner's approval. Zest never puts its own marketing into aggregator orders' packaging on the owner's behalf.
- **Customer data and consent:** DPDP Act and Rules (notice, purpose-limited consent, withdrawal, erasure, breach reporting). Zest acts as a data processor for the restaurant.
- **WhatsApp:** Meta's business and commerce policies, template categories, opt-in records.
- **SMS:** TRAI TCCCPR and DLT registration of headers and templates.
- **Payments:** gateway terms; Zest never holds funds.
- **Consumer protection:** seller details, refund and cancellation policy, grievance contact shown on the storefront.
- **Tax:** GST invoice content per order; the restaurant is the supplier.
- **Food safety:** FSSAI licence number displayed.
- **Google:** Business Profile API terms; no review gating.
- **Call recording:** notice before recording on the voice agent.

## 13. Roadmap

Decided: this roadmap replaces PLAN §13's next steps. Phase A absorbs its weeks 1–2 (Claude on, eval harness, OTP login, scheduling, WhatsApp verification, ops basics), and the same pilot outlets that try the copilot try direct ordering in Phase B. Week numbers are estimates for two engineers, not commitments. Phases overlap. Each ends with an exit test measured on pilot outlets.

| Phase | Weeks | Ships | Exit test |
|---|---|---|---|
| **A. Foundations** | 1–4 | Test setup and CI; eval harness; Claude switched on with a spend limit; phone OTP login and roles; brands; channel and order-status migration; `order_lines`; job runner on Vercel Pro; SSE for orders; consent ledger; hours model; Meta business verification and Razorpay partner application started; error monitoring, rate limits, backups | All existing screens work on the new order model; tests run in CI; owners log in by OTP |
| **B. Direct ordering MVP** | 4–10 | Storefront (pickup, table ordering, scheduled), variants and add-ons, pay-at-counter from day one and Razorpay once KYC clears, order hub and kitchen screen, printing, busy mode, staff-taken phone orders, GST receipts, customer profiles, transactional WhatsApp updates | 10 pilot outlets take at least one paid direct order a day for 2 weeks; median checkout under 90 seconds; zero lost orders |
| **C. Delivery and WhatsApp ordering** | 7–12 | Zones and fees, own riders, one delivery-partner adapter, tracking links, WhatsApp ordering, smart upsells | 90% of direct deliveries on time; WhatsApp orders 20%+ of direct orders at pilots that turn it on; upsell attach rate measured |
| **D. Repeat business** | 10–16 | Segments, journeys, broadcasts with guardrails, attribution, loyalty online and on dine-in bills, PWA install and push | Journeys bring back 5%+ of drifting customers a month; members order more often than non-members; opt-out rate under 2% per message |
| **E. Being found** | 14–20 | Google connection, hours everywhere, ordering link, Google reviews in the inbox with replies, reviews engine, health checks, presence score, public `/score`, SEO pages | Google reviews per pilot outlet up 50% in 60 days; hours mismatches at zero; `/score` brings sign-ups |
| **F. Expansion** | 18–26 | Catering, channel economics and full reporting, ONDC as a channel, AI voice ordering pilot, POS connector (PLAN §13 step 15) | Owners can read their true margin per channel; voice pilot takes orders end to end at 3 outlets |

**Program metrics** across phases: direct share of each pilot outlet's online orders (target 15% in 6 months), commission saved per outlet per month, repeat rate, weekly active owners, approval acceptance rate unchanged, and no drop in aggregator order handling times.

## 14. Risks

| Risk | Mitigation |
|---|---|
| Aggregator contract conflict over pricing | Owner-controlled price differences with a warning; legal sign-off before Phase B pricing features |
| WhatsApp number bans from complaints | Consent ledger, frequency cap, quiet hours, opt-out in every message, per-outlet numbers |
| Delivery partner coverage varies by city | Own riders first; adapter interface; pick partner per city |
| Kitchen misses an order | Audible alerts, unacknowledged-order alerts to the owner by WhatsApp after 2 minutes, SSE plus polling |
| Serverless limits (cron frequency, function time) | Job runner design (§11.3); hosting decision |
| Google API access delayed | Guided manual tasks until access is granted |
| Scope: this is 6 products | Phases each ship something usable; separate implementation plan per phase |

## 15. Decisions

**Answered by the owner on 21 October 2026** (they accepted the recommendations):

1. Aggregator orders join the hub when a real-time feed exists; early pilots run a direct and dine-in kitchen screen beside the partner tablets (§7.2).
2. A brand layer above outlets; customers, loyalty, storefront, WhatsApp and gateway are per brand (§7.0).
3. Razorpay first, through its partner programme; pay at the counter while KYC clears; Zest charges a flat monthly fee, no split settlement (§7.4).
4. This roadmap replaces PLAN §13; same pilot outlets; estimates for two engineers (§13).
5. Vercel Pro; buy `zest.menu` (§7.3, §11.3).
6. Legal sign-off gates only Phase B payments and pricing differences, and Phase D marketing (§12).

**Still open:**

- First delivery partner and first pilot city (needed before Phase C).
- Meta Cloud API directly or a BSP (needed during Phase A, since verification takes one to two weeks). Recommendation: Meta directly, for cost.
- Who gives legal sign-off.
- Which aggregator feed path to pursue first (business conversation, not engineering).

## 16. Calls made in this design (please check)

These are my choices, not decisions you've made:

- PWA instead of native apps per restaurant; WhatsApp as the main re-engagement channel instead of email.
- Zest never holds funds; each restaurant uses its own gateway account.
- Aggregator customers are not added to the customer list.
- Direct price defaults to the lowest platform price (as dine-in does today).
- Frequency cap 2 marketing messages per 7 days; quiet hours 9:30 pm to 9 am; win-back at 45 days.
- Loyalty earns only on direct and dine-in, 10 points per ₹100 by default.
- Review requests at most once per customer per 30 days.
- Phase order: direct ordering before marketing, because marketing needs customers and a place to send them.
- The 21 October local prototype is discarded.
- Each restaurant owns its WhatsApp Business account (Embedded Signup, coexistence where possible) and pays Meta directly.

## 17. Left to the builder

Exact table and column names, component structure, the storefront visual design within the existing design system, the estimate model behind the presence score, the co-occurrence method for upsells, and the choice of printer libraries. Each phase gets its own implementation plan (`docs/superpowers/plans/`) written after this design is approved.

## Sources

- Owner.com pages read 21 October 2026: [home](https://www.owner.com/), [online ordering](https://www.owner.com/online-ordering), [delivery](https://www.owner.com/delivery), [kitchen tablet](https://www.owner.com/kitchen-tablet), [catering](https://www.owner.com/catering), [SEO](https://www.owner.com/restaurant-seo), [AI phone ordering](https://www.owner.com/ai-phone-ordering), [branded apps](https://www.owner.com/branded-apps), [reporting](https://www.owner.com/reporting-analytics), [Owner Agent](https://www.owner.com/agent), [marketing](https://www.owner.com/automatic-marketing), [reviews engine](https://www.owner.com/reviews-engine), [loyalty](https://www.owner.com/loyalty-rewards), [smart upsells](https://www.owner.com/smart-upsells), [grader](https://grader.owner.com/).
- Price parity: [YourStory on CCI findings, Nov 2024](https://yourstory.com/2024/11/cci-zomato-swiggy-breached-competition-laws), [LiveLaw on the 2022 probe order](https://www.livelaw.in/amp/news-updates/cci-orders-probe-determine-conduct-zomato-swiggy-anti-competitive-195865).
- Consent: [SCC Online on WhatsApp opt-in and the DPDP Act](https://www.scconline.com/blog/post/2026/07/29/whatsapp-chatbot-opt-in-consent-dpdp-act-compliance/), [consent.in on telemarketing rules](https://consent.in/blog/dpdp-telemarketing-regulations).
- Delivery: [Porter on ONDC](https://startuptalky.com/news/porter-member-ondc-network/), [Borzo](https://borzodelivery.com/in/porter-alternatives-india).
