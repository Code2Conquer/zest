# What's left to build (as of 24 October 2026)

Everything the homepage and /restaurants sell, checked against the code. Onboarding (mobile login, kind,
details, menu, live page), both dashboards, the ordering page, delivery pricing by distance, menu from a
photo, listing import from a Zomato/Swiggy link, email ingest of orders and payouts, review drafts and the
assistant are built. The gaps below are what the pages promise but the product doesn't do yet.

## 1. Setup on Vercel (accounts and keys, not code)

| What | Why |
|---|---|
| `DATABASE_URL` (+ `DATABASE_AUTH_TOKEN`, e.g. Turso) | Without it Vercel uses a temporary database that resets with the server: sign-ups, menus and orders vanish. Check it's set. |
| WhatsApp Cloud API: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, approved templates `WHATSAPP_OTP_TEMPLATE` (login code), new order, order ready, morning summary (`WHATSAPP_TEMPLATE`) | Mobile login on production (503 until set) and every WhatsApp message. |
| `ANTHROPIC_API_KEY` | Menu from a photo, the assistant, review reply drafts. |
| Google OAuth for Gmail | Restaurants' "Connect your email" (Zomato/Swiggy order and payout emails). |
| Privacy and Terms pages, a support WhatsApp number | Needed before taking payments; then link them in the footer's bottom bar. |

## 2. Home kitchen promises not built yet

| Promise | Today | To build |
|---|---|---|
| "Get paid upfront", "money in your bank before the food is on the stove" | A UPI deep link with the amount; nothing confirms payment, the seller marks Paid by hand. | Payment gateway (Razorpay / Cashfree / PhonePe PG): auto-confirm by webhook, order reaches the kitchen only when paid, refund on reject. **Biggest gap.** |
| "Zomato riders pick up and deliver up to 7 km", "tracked to the door" | Distance, fee and 7 km limit work; no rider is booked. | Zomato delivery integration: book on ready, rider name and ETA, live tracking link, cancel. Needs Zomato's API. |
| "Orders close at a time you set", "Cook to the count" | Not built (opening hours only). | Per-menu daily cut-off (lunch closes 11:00) and a count per dish (thali 15); ordering page shows "closed for today" and "only 3 left". |
| "Regulars on weekly plans", "tiffins paid for the week" | Not built. | Weekly tiffin plans: days, meal, notes, prepay for the week, skip a day, daily orders created automatically. |
| Customer updates ("ready at 8:40", "Ravi is on the way", "delivered") | Owner messages exist; customer ones partial. | WhatsApp status messages at each step and a public order tracking page (`publicToken` already on orders). |
| "Found on Google" | LocalBusiness structured data and a counter QR exist. | Google Business Profile listing with an "Order online" link (guided by hand first). |
| "Your regulars and what they like" | Customer list with orders and spend. | Usual order and notes per customer, "order the usual". |

## 3. Restaurant promises not built yet

| Promise | Today | To build |
|---|---|---|
| Zest Soundbox: speaks every order, press to accept, louder then calls, ticket printer | Website demo and a waitlist. | Hardware, firmware, Hindi/English speech, device API, phone escalation (e.g. Exotel), ESC/POS printing. Accepting Zomato/Swiggy orders needs their partner API. |
| Zomato and Swiggy orders in one list | Read from order emails (Gmail); `/api/webhooks/[platform]` exists but no partner feed. | Zomato and Swiggy partner integrations (API / MCP / POS): real-time orders, accept, reject. |
| "Yesterday's sales, on WhatsApp by 7:30" | Built from emails; the daily cron runs ~7:00 IST. | WhatsApp template approval; check it arrives by 7:30 for every connected restaurant. |
| "Bad reviews… one tap to post" | Drafts exist. | Posting needs the platforms' partner APIs; until then "copy reply". |
| Payouts before they land, paste your link | Built. | — |

## 4. Product polish and safety

- Payments and refunds, a receipt page per order, a refund policy.
- Seller verification (FSSAI, PAN, UPI) before going live.
- Analytics and error monitoring (e.g. Sentry).
- A native Hindi review of all copy.
- Optional: a private copy of each sample per visitor, so samples can be edited without defacing the public ones.

## Order of work

1. Setup on Vercel (section 1).
2. Payment gateway with automatic "paid".
3. Order cut-off and dish counts.
4. Customer WhatsApp updates and the order tracking page.
5. Weekly tiffin plans.
6. Start the Zomato rider and Zomato/Swiggy partner integrations; the Soundbox runs as its own hardware track.

3–5 can be built without outside access; 1, 2 and 6 need accounts or partner APIs.
