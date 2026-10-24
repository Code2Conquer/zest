# Before going live (as of 25 October 2026)

Everything the homepage and /restaurants sell is now built in code, except the Zomato and Swiggy partner
integrations and the Soundbox device, which need outside access. What remains is mostly accounts, keys,
approvals and paperwork, listed below by who has to get them.

## Built (branch release-candidate)

| Promise | How it works |
|---|---|
| Mobile login | 6-digit code by WhatsApp or SMS. Owners and managers log in by mobile; kitchen staff by PIN. Google and email sign-in removed. |
| Paid before you cook | Razorpay checkout on the ordering page; payment confirmed by signature and webhook (`/api/payments/webhook`); unpaid online orders stay out of the kitchen; rejected paid orders refunded automatically. Without keys, the seller's own UPI link stays. |
| Cook to the count | Daily count per dish ("only 3 left", "sold out today") and a daily cut-off per menu section ("Lunch orders by 11 am"), checked again on the server. Set from Menu & stock. |
| Tracked to the door | Public tracking page `/t/<token>`, sent with every update; refreshes itself. |
| Customer updates | WhatsApp first, SMS fallback: placed, accepted, ready, out for delivery, delivered, rejected, refunded. |
| Zomato riders deliver | One connection point (`lib/server/riders.ts`) books a rider when food is ready and records name, ETA and tracking link. Samples simulate a rider; real sellers are told to send their own helper until the API is connected. |
| Weekly tiffin plans | Tiffin plans screen: days, dish, notes, weeks, price for the period, mark paid, skip a day, stop. The day's orders are created each morning (cron 7:00 IST) and when Orders opens. |
| Regulars | Customer list shows each regular's usual order and the kitchen's note on them; the ordering page offers "Your usual?" to repeat the last order on that phone. |
| Privacy and Terms | `/privacy`, `/terms`, linked in the footer with the support WhatsApp. Working drafts: need legal review. |

## Pending on the Zest team (to source before launch)

**Accounts and keys (set in Vercel → Settings → Environment Variables)**

| Variable(s) | What it turns on | Where to get it |
|---|---|---|
| `DATABASE_URL`, `DATABASE_AUTH_TOKEN` | A database that survives restarts (today Vercel resets it) | Turso (or any libSQL host) |
| `ZEST_SECRET_KEY` | Signs sessions | 32 random bytes, base64 (`openssl rand -base64 32`) |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_OTP_TEMPLATE`, `WHATSAPP_TEMPLATE` | Login codes and all WhatsApp messages | Meta Business account, verified business, WhatsApp Cloud API number, two approved templates (authentication; utility with one text variable) |
| `MSG91_AUTH_KEY`, `MSG91_OTP_TEMPLATE`, `MSG91_ORDER_TEMPLATE` | SMS fallback for codes and order updates | MSG91 account; DLT registration (entity, sender ID, templates) on a telecom DLT portal |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Online payments and refunds | Razorpay account with KYC; webhook to `/api/payments/webhook` for `payment.captured` |
| `ZOMATO_DELIVERY_API_URL`, `ZOMATO_DELIVERY_API_KEY` | Real rider booking | Zomato's delivery-for-merchants API access |
| ~~`ANTHROPIC_API_KEY`~~ | **Done another way:** `LLM_API_KEY` (Groq free tier) runs the assistants, menu and document photos, and payout emails. Check it any time at `/api/ai/health`. Add an Anthropic key later if handwritten/Hindi menus or PDFs need better reading. | — |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Restaurants' "Connect your email" (Gmail) | Google Cloud OAuth client; Gmail read-only scope needs Google's verification |
| `CRON_SECRET` | Daily 7:00 run (tiffins, inbox sync) | Any random string |
| `NEXT_PUBLIC_SUPPORT_WHATSAPP`, `NEXT_PUBLIC_SUPPORT_EMAIL` | Help links in the footer and legal pages | Your support number and inbox |
| `APP_URL` | Correct links in messages | The production domain |

**Business and legal**

- Money flow: collecting customers' money and paying sellers needs either a payment aggregator setup that pays sellers directly (Razorpay Route with linked accounts per seller) or Zest's own RBI payment-aggregator compliance. Decide with finance/legal; the code currently creates payments in one Razorpay account.
- Lawyer review of Privacy and Terms (DPDP Act 2023), a refund policy, and the grievance officer details the IT Rules require.
- A registered company name, GSTIN and address to show in the footer and on receipts.
- Seller onboarding checks: FSSAI registration for every seller, PAN, bank/UPI verification. Decide whether Zest verifies these before a page goes live.
- Zomato rider economics: per-trip price by distance, who pays, and the commercial agreement with Zomato delivery.
- Zomato and Swiggy partner access (API, MCP or POS) for orders in one list, accepting orders, and posting review replies.
- Soundbox: hardware partner, firmware, unit cost and pricing; Exotel (or similar) for the "it calls you" escalation.

**Content and launch**

- A domain (e.g. zest.link, which the copy already uses for tracking links) and branded email.
- A native Hindi review of all copy.
- Real proof once pilots run: seller quotes, photos (with permission) and numbers.
- Error monitoring (e.g. Sentry DSN). Analytics is done: PostHog dashboard "Zest launch" plus Vercel Analytics.
- First pilot sellers and a support person on WhatsApp in Hindi and English.
