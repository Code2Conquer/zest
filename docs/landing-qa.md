# Landing rebuild: QA and honesty report

Pages: `/` (small food businesses) and `/restaurants`. Brief: `docs/landing-brief.md`.

## Checks

| Check | Result |
|---|---|
| Reduced motion | Pass. No animation runs on either page (`document.getAnimations()` is empty after load and after scrolling); every demo shows its finished state with its caption. |
| Keyboard focus | Pass. Tabbing through `/` and `/restaurants` reaches every control, including the scenario tabs, the Soundbox's buttons, "Hear it", the waitlist fields and every FAQ; each shows a 3px turmeric ring. The phone swipe strip is focusable for arrow-key scrolling. |
| Contrast | Pass. Lighthouse accessibility: `/` 97 before the last fix (one placeholder at 4.3:1, since darkened to 5.3:1), `/restaurants` 100. |
| No horizontal scroll at 360 px | Pass, in English and Hindi, on both pages (checked by toggling the language live). The "One day" moments on phones scroll sideways on purpose, inside their own strip. |
| Lighthouse mobile performance, throttled (production build) | `/` 84 (FCP 1.7 s, simulated LCP 4.4 s, TBT 0 ms, CLS 0), `/restaurants` 89 (CLS 0.011). Below the 90 target: the LCP is the hero paragraph, which paints with the first paint (70 ms unthrottled), but Lighthouse's simulation counts every script loaded before that paint, mostly the 148 KB React/Next runtime. The 3D Soundbox loads only after the page is up, and draws only while on screen. |
| Hindi parity | Every visible and spoken string on both pages has Hindi. The seller's own menu board, ordering page and KOTs stay as the seller writes them. Devanagari gets a taller line height. |

## Honesty pass: "Coming soon" labels

Labelled (not live in the codebase or switched off in production):

- Zest Soundbox: section headings on both pages; the 3D Halo is labelled "Concept render"; the ticket printer is described as a separate add-on; and "Soundbox announcing Zomato/Swiggy orders" under the restaurants hero
- Menu-photo onboarding: on "Upload menu photo" (the code exists in `/start` and `lib/server/vision.ts`, but needs `ANTHROPIC_API_KEY`, which isn't set in production; remove the label once it is)
- WhatsApp onboarding and ordering: on "Start on WhatsApp"
- Zomato rider booking: "Delivery, your way" heading, FAQ "Who delivers?" (both pages)
- Google listing setup: Get found panel, FAQ "Will people find me on Google?"
- AI-answer setup, Instagram posts and Meta ads: Get found panels, the Growth agent
- Nearby-search suggestions: the "Jain thali" line
- Reminders and welcome offers for regulars: line under "Know your regulars"
- FSSAI help: FAQ
- Email morning summary: section heading on `/restaurants`

Found already working:

- Own ordering page per seller (`/r/[slug]`) with UPI paid to the seller's UPI ID, and search markup (title, description, schema.org menu, sitemap)
- Reading a Zomato or Swiggy listing from its link (`/api/listing/preview`, relay configured)
- Customer list from own-page orders
- Review reply drafts for Zomato and Swiggy reviews (from email)
- Soundbox waitlist (new: `soundbox_waitlist` table and `/api/waitlist`)

## Anti-slop checklist

| Item | Result |
|---|---|
| No gradient blobs, glowing orbs, sparkles or "AI" stars | Pass. A sparkle icon on the AI-answers panel was replaced with a chat icon. |
| No all-caps eyebrows, no decorative middle-dot strings | Pass. The only capitals are printed KOT tickets and the ordering page's ADD buttons. Middle dots appear only as data separators (time · agent, area · type). |
| No identical rounded card grids | Pass. |
| One orchestrated moment per section, nothing else moves on its own | Pass after a fix: the delivery route's dashes kept moving after the sequence and now stop. Loops (hero, agents, restaurants hero) repeat no faster than every 8 s and pause off screen. |
| Only food, kitchens, phones and the Soundbox as imagery | Pass. Mock-ups use screens owners already know: a WhatsApp group for the agents, UPI payment alerts, a phone map with a Zomato rider, a search result with the dish photo. |
| Every homepage headline reads naturally to a home-kitchen owner, in Hindi too | Pass, in my reading; worth a native speaker's pass. |
| Every button says exactly what happens | Partial. "Upload menu photo" leads to sign-up, and "Start on WhatsApp" scrolls to the waitlist; both carry "Coming soon" until those flows exist. |

## Deviations from the brief, and why

- Hero order total: 2 aloo paratha (₹60) + 1 rajma chawal (₹90) is ₹210; the brief's "Paid ₹270" is kept by adding a ₹60 Zomato rider line to the KOT.
- "Hear it" clips were generated with the macOS Lekha (Hindi) and Rishi (Indian English) voices, not recorded by a person.
- Meena's dish photos are from Wikimedia Commons (CC BY / CC BY-SA), credited in the footer and in `public/photos/meena/credits.json`.
- `/dev/soundbox` (every Soundbox state on one page) was used for review on the preview and removed before merge.
