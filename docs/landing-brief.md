# Zest website: rebuild brief

Paste this whole file into the Claude Code session that owns the Zest site (https://zest-dusky.vercel.app). It replaces the current homepage and adds one new page. Keep the existing stack, routes (/login, /login/staff, /r/[slug]), the sample restaurant Rasoi 27 and the English/हिंदी toggle.

---

## 0. Who each page is for

**Homepage `/`: small food businesses not on Zomato or Swiggy.** Home kitchens, tiffin services, small cloud kitchens, neighbourhood food shops and stalls. They sell today through WhatsApp, phone calls and walk-ins. They have demand but no store, no payments system and no delivery. They are busy cooking and are not comfortable running apps. Zest gives them their first real online store, delivery by Zomato riders, AI agents that do the online work, and the Zest Soundbox in the kitchen.

**`/restaurants`: restaurants already on Zomato or Swiggy.** They get their own ordering page for regulars, the Zest Soundbox, and a morning summary of every app built from their email. Linked from the homepage nav and from one line in the homepage hero.

Every line of homepage copy should make sense to a home-kitchen owner reading in Hindi on a phone.

---

## 1. The story in one line

**Homepage:** Get online orders. Deliver them yourself, or with Zomato.
**Restaurants page:** Never miss an order. Know every app by morning.

Naming rules (apply across the codebase and copy):
- "Zesty" is retired. The device is the **Zest Soundbox**. In speech bubbles and captions the speaker is simply **Zest**.
- Never "AI-powered", "revolutionary", "seamless", "unlock", "supercharge", "leverage", "empower".
- Zomato and Swiggy are never rivals. No commission talk anywhere. Zomato appears as "delivered by Zomato riders".

---

## 2. Design direction

A busy Indian kitchen run by something calm and smart: steel counters, thermal KOT paper, turmeric, the familiar payment soundbox, WhatsApp. AI-native means the product visibly acting on the seller's behalf, not glowing gradients.

### Tokens

| Name | Hex | Use |
|---|---|---|
| Paper | `#FAFAF6` | Page background. Cool thermal-paper white, not cream |
| Ink | `#1C1F23` | Text, device face |
| Turmeric | `#E9A31A` | The one accent: Soundbox ring, primary buttons, live states |
| Steel | `#D9DEE3` | Device body, quiet surfaces, dividers |
| Chilli | `#C23A22` | Only for "missed / not accepted / sold out" |
| Leaf | `#2F7A4C` | Only for "accepted / paid / delivered" and the veg mark |

Replace the current theme colour (`#111613`) with Paper. Dark mode uses Ink as background, Turmeric unchanged. Buttons are Ink text on Turmeric for contrast.

### Type
- **Anek Latin** for English and **Anek Devanagari** for हिंदी (Google Fonts, Indian foundry, matching widths). Condensed widths for big headlines, normal for body.
- **IBM Plex Mono** only inside KOT tickets and receipts.
- Sentence case. No all-caps eyebrows, no single-word colour accents in headlines, no "→" glued onto button labels.

### Layout
- Left-aligned text, generous whitespace, one strong visual per section.
- No identical rounded card grids. Shape follows the object: the Soundbox is a rounded square, KOT tickets have a perforated edge, phones look like phones, WhatsApp chats look like WhatsApp.
- Mobile first. Most homepage visitors will be on a phone, often a budget Android: every demo must work and stay light at 360 px.

### Motion
- One orchestrated moment per section; no fade-up on every block.
- Motion shows cause and effect: a photo becomes a menu, an order arrives, Zest speaks, a ticket prints, a rider moves.
- Demos pause off-screen and loop no faster than every 8 s.
- `prefers-reduced-motion`: show each demo's final state, static, with captions.
- CSS transitions/keyframes plus the animation library the project already uses. No video files for core demos, no WebGL, no Lottie.

---

## 3. Shared components

### Zest Soundbox (signature object)
SVG/CSS, used on both pages.
- Rounded-square steel box, Ink face, circular Turmeric ring that pulses as a voice waveform when Zest speaks.
- One big round button on top (accept / food ready), a ticket slot that prints a KOT downward, a small push-to-talk button on the side.
- States: idle, ringing, speaking, printing, accepted (Leaf flash), escalating (ring turns Chilli, pulses faster).
- Caption beneath shows what Zest says, in the selected language.
- "Hear it" plays a short pre-recorded clip in Hindi or English, on tap only. Never autoplay audio.

### Waitlist form
Fields: Name · Business name · Phone (WhatsApp) · City · Type (Home kitchen / Tiffin service / Cloud kitchen / Shop or stall / Restaurant on Zomato or Swiggy) · [Join the waitlist]
- Success replaces the form: "You're on the list. We'll WhatsApp you when the Soundbox is ready for your kitchen."
- Errors say exactly what to fix ("Enter a 10-digit mobile number").
- Store in a new `soundbox_waitlist` table with created_at, page and section.

---

## 4. Homepage `/`

One message, top to bottom: **get online orders, and deliver them yourself or with Zomato.** Everything on the page supports that line; anything that doesn't (the agents, search and AI answers, Instagram, regulars) stays out of the homepage until it is live and proven. Target: under 600 words, about six phone screens.

### Nav
Zest · How it works · Delivery · Soundbox · Questions · For restaurants · English/हिंदी · Log in · **Start free**
On a phone the section links and the start button fold away (the hero and a sticky bar carry the action); the language switch stays visible.

### Audience switch (above the headline, on both pages)
A two-part switch: **Home kitchen, tiffin or stall** | **Restaurant on Zomato or Swiggy** (phone: *Home chef or stall* | *Restaurant*). The current page is filled in Ink. This replaces the old two-card split under the hero.

### Hero
- **Headline:** Get online orders. Deliver them yourself, or with Zomato.
- **Subhead:** Your own ordering page for your home kitchen, tiffin service or stall. Customers order on WhatsApp and pay you by UPI.
- **Actions:** [Get started free] (live sign-up, `/join?journey=new`) · [See a sample page] (`/r/meenas-kitchen`). Never put a "Coming soon" action in the hero.
- **Ticks:** Free to start · UPI straight to your bank · No app to learn
- Visual: the existing hero sequence (menu note → ordering page → WhatsApp order → Soundbox). It is the page's one orchestrated moment.

### How it works (three steps)
1. **Add your menu.** Type your dishes and prices. Soon you can just send a photo of your menu.
2. **Share your link.** Send it to your society and WhatsApp groups, and put the QR on your counter.
3. **Get orders, get paid.** Orders arrive on WhatsApp. Customers pay by UPI, straight to your bank.

### Delivery, your way (the differentiator)
- **Headline:** Deliver it yourself, or let Zomato do it.
- **Body:** For every order, you choose. The customer picks it up, your own helper takes it, or a Zomato rider delivers it with live tracking.
- Visual: the neighbourhood map with pickup, helper and Zomato rider.
- One honest line under it: *Booking Zomato riders from Zest* [Coming soon].

### Why Zest (four plain reasons)
Your customers stay yours · Money straight to you · No app to learn · Hindi or English. One line each.

### Zest Soundbox (one band)
- Label: Zest Soundbox · coming soon
- **Headline:** Hear every order, without touching your phone.
- **Body:** A small box on your counter that speaks each order in Hindi or English. Press the top to accept, even with floury hands.
- [Join the Soundbox waitlist] opens the waitlist form in place. Static Soundbox drawing (no 3D on the homepage).

### Questions sellers ask (six)
Do I need to be on Zomato or Swiggy? · Who delivers? [Coming soon] · Who pays for delivery? · How do I get paid? · What does it cost? · Does it work for a thela or a small stall?

### Closing call to action (Turmeric band)
**Start taking online orders today.** Free to start. Set up in a few minutes. [Get started free]

### Sticky start bar (phones only)
After the hero's buttons scroll away: "Online orders, delivered by you or Zomato." [Start free]. Hides at the closing call to action.

### Footer
Online orders, delivered by you or by Zomato. · Start free · Join the Soundbox waitlist · Zest for restaurants · Sample seller · Log in · Staff sign-in · © 2026 Zest

### Removed from the homepage (October 2026 refocus)
"One day at Meena's Kitchen", the agents section and demo, "Be the first name people find nearby", the regulars section, the six-feature Soundbox list and the 3D Soundbox, and the old two-card audience split. The agents demo still lives on `/restaurants`.

---

## 5. Restaurants page `/restaurants`

Same design system, shorter. Uses the sample restaurant Rasoi 27.

### Hero
- **Headline:** Never miss an order. Know every app by morning.
- **Subhead:** For restaurants on Zomato and Swiggy. The Zest Soundbox speaks every order in your kitchen. Your own ordering page brings regulars to you, delivered by Zomato riders. And every morning, Zest tells you how each app did.
- **Primary action:** [Your Zomato or Swiggy link] [Get started free]
- **Secondary:** Join the Soundbox waitlist
- Visual: the Soundbox with order chips arriving from your page, Zomato and Swiggy, one voice for all.

### Section: One voice for every order
Soundbox demo with orders from several channels; caption: *"New order on Swiggy. Two paneer tikka."* Features: speaks every order, one button, prints the KOT, escalates if missed. Waitlist form.

### Section: Your apps, one morning summary
- **Headline:** Know how every app did, before you open them.
- **Body:** Connect your email once. Zest reads the order, payout and rating emails from Zomato and Swiggy and sends you one summary every morning, on WhatsApp and out loud on the Soundbox.
- Visual: a WhatsApp message from Zest: yesterday's sales by app, payouts expected, rating changes, the review that needs a reply.
- **Privacy promise, shown visibly:** Zest only reads emails from your food apps. It never sends email, never shares it, and you can disconnect anytime.

### Section: A page for your regulars
- **Headline:** Your regulars can order from you directly.
- **Body:** Paste your Zomato or Swiggy link and your own ordering page is ready, with your menu, photos and prices. Zomato riders deliver, and the guest stays yours.
- Link: *See Rasoi 27's page* (/r/rasoi-27).

### Questions
- Do I need to leave Zomato or Swiggy? No. Zest works alongside them.
- What does Zest read in my email? Only order, payout and rating emails from your food apps.
- When can I get the Soundbox? Join the waitlist; we're starting with a small group of kitchens.
- Who delivers orders from my own page? Zomato riders, with live tracking.

---

## 6. Remove from the current site
- "Every order, not just the app orders." and the rotating "Orders from your…" line
- "Your best customers can't order from you" list and "Found. Ordered. Delivered. Done right."
- Every mention of "Zesty"
- Old agent names (Discovery, Dispatch, Menu, Offers)
- Homepage claims about Zomato/Swiggy menu sync, payouts and app reviews (they move to `/restaurants`, reframed as summaries)

---

## 7. Build plan for Claude Code

1. **Audit and rename.** Every "Zesty" in copy, components, alt text, i18n files and routes becomes Zest / Zest Soundbox. New meta description for `/`: "Your kitchen, online in a minute. Your own ordering page, WhatsApp orders, UPI payments and delivery by Zomato riders, run by Zest's AI agents." Separate meta for `/restaurants`.
2. **Tokens and type.** Add colours, Anek Latin/Devanagari and Plex Mono; remove unused fonts and colours.
3. **Sample seller.** Add "Meena's Kitchen" (home kitchen, veg, rajma chawal, aloo paratha, thali, Diwali sweets box) alongside Rasoi 27, with its own `/r/` page.
4. **Soundbox component** with all states, captions, Hindi and English lines, reduced-motion fallback. Build and screenshot it alone first.
5. **Homepage hero** with the photo-to-menu sequence.
6. **"One day at Meena's Kitchen"** (sticky desktop, swipe mobile).
7. **Agents demo** with five agents and new scenarios.
8. **Soundbox section and waitlist** (form, table, success and error states).
9. **Delivery, sold-out sync, regulars, start, FAQ, footer.**
10. **`/restaurants` page.**
11. **Hindi parity.** Every string in both languages; check Devanagari line heights and that layouts don't break on toggle.
12. **QA.** Screenshot every section at 360, 768 and 1440 px, both languages, both themes; reduced motion; keyboard focus on every demo; Lighthouse mobile performance ≥ 90 on a throttled connection.
13. **Honesty pass.** Add a small "Coming soon" label to anything not live: the Soundbox (always waitlist), menu-photo onboarding, WhatsApp onboarding and ordering, Zomato rider booking, Google listing setup, AI-answer setup, nearby-search suggestions, Instagram posts, Meta ads, FSSAI help, the email morning summary, and Soundbox announcing Zomato/Swiggy orders (needs order access from those apps).

## 8. Anti-slop checklist
- [ ] No gradient blobs, glowing orbs, sparkles or "AI" stars
- [ ] No all-caps eyebrows, no decorative middle-dot strings
- [ ] No identical rounded card grids
- [ ] One orchestrated moment per section, nothing else moves on its own
- [ ] Only food, kitchens, phones and the Soundbox as imagery; no stock people at laptops
- [ ] Every homepage headline reads naturally to a home-kitchen owner, in Hindi too
- [ ] Every button says exactly what happens
