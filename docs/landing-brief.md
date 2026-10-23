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
**Restaurants page:** More orders, beyond the apps.

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
- **Website (homepage and /restaurants): Inter**, with Noto Sans Devanagari for Hindi, loaded only on those pages (`components/landing/site-fonts.ts`). Headlines bold, tracking -0.035em. The owner app keeps Anek.
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
3D renders, used on both pages: a soft ceramic puck with a black glass top etched "zest" and a recessed light ring. `scripts/soundbox/render.html` ray-marches it offline and `scripts/soundbox/render.mjs` writes four transparent stills (idle, amber, green, red) to `public/soundbox/`; the site layers the lit still over the resting one and animates only its opacity. No WebGL on the page. The ticket printer matches in flat ceramic.
- Rounded-square steel box, Ink face, circular Turmeric ring that pulses as a voice waveform when Zest speaks.
- One big round button on top (accept / food ready), a ticket slot that prints a KOT downward, a small push-to-talk button on the side.
- States: idle, ringing, speaking, printing, accepted (Leaf flash), escalating (ring turns Chilli, pulses faster).
- Caption beneath shows what Zest says, in the selected language.
- "Hear it" plays a short pre-recorded clip in Hindi or English, on tap only. Never autoplay audio.

### Waitlist form
Fields: Name · Business name · Phone (WhatsApp) · City · Type (Home kitchen / Tiffin service / Cloud kitchen / Shop or stall / Restaurant on Zomato or Swiggy) · [Ask for a Soundbox]
- Success replaces the form: "Thanks. We'll WhatsApp you to set up your Soundbox."
- Errors say exactly what to fix ("Enter a 10-digit mobile number").
- Store in a new `soundbox_waitlist` table with created_at, page and section.

---

## 4. Homepage `/`

One message, top to bottom: **get online orders, and deliver them yourself or with Zomato.** Everything on the page supports that line; anything that doesn't (the agents, search and AI answers, Instagram, regulars) stays out of the homepage until it is live and proven. Target: under 600 words, about six phone screens.

### Header (both pages)
Zest · English/हिंदी · Log in · **Start free** (desktop only; phones use the hero button and the sticky bar). No section links, no theme switch, no menu button: the audience switch under the header moves between the two pages.

### Audience switch (above the headline, on both pages)
A two-part switch: **Home kitchen, tiffin or stall** | **Restaurant on Zomato or Swiggy** (phone: *Home chef or stall* | *Restaurant*). The current page is filled in Ink. This replaces the old two-card split under the hero.

### Hero
- **Headline:** Get online orders. Deliver them yourself, or with Zomato.
- **Subhead:** Your own ordering page for your home kitchen, tiffin service or stall. Customers order on WhatsApp and pay you by UPI.
- **Actions:** [Get started free] (live sign-up, `/join?journey=new`) · [See a sample page] (`/r/meenas-kitchen`). Both actions work today.
- **Ticks:** Free to start · UPI straight to your bank · No app to learn
- Visual: the existing hero sequence (menu note → ordering page → WhatsApp order → Soundbox). It is the page's one orchestrated moment.

### How it works (three steps)
1. **Add your menu.** Send a photo of your menu, or type your dishes and prices.
2. **Share your link.** Send it to your society and WhatsApp groups, and put the QR on your counter.
3. **Get orders, get paid.** Orders arrive on WhatsApp. Customers pay by UPI, straight to your bank.

### Delivery, your way (the differentiator)
- **Headline:** Deliver it yourself, or let Zomato do it.
- **Body:** For every order, you choose. The customer picks it up, your own helper takes it, or a Zomato rider delivers it with live tracking.
- Visual: the neighbourhood map with pickup, helper and Zomato rider.

### Why Zest (four plain reasons)
Your customers stay yours · Money straight to you · No app to learn · Hindi or English. One line each.

### Zest Soundbox (one band)
- Label: Zest Soundbox
- **Headline:** Hear every order, without touching your phone.
- **Body:** A small box on your counter that speaks each order in Hindi or English. Press the top to accept, even with floury hands.
- [Ask for a Soundbox] opens the request form in place. Static Soundbox drawing (no 3D on the homepage).

### Questions sellers ask (six)
Do I need to be on Zomato or Swiggy? · Who delivers? · Who pays for delivery? · How do I get paid? · What does it cost? · Does it work for a thela or a small stall?

### Closing call to action (Turmeric band)
**Start taking online orders today.** Free to start. Set up in a few minutes. [Get started free]

### Sticky start bar (phones only)
After the hero's buttons scroll away: "Online orders, delivered by you or Zomato." [Start free]. Hides at the closing call to action.

### Footer
The wordmark, "Online orders, delivered by you or by Zomato." and © 2026 Zest. No link list. No credit line: the homepage hero phone shows Meena's menu as text (no Wikimedia photos) and /restaurants uses Unsplash photos only.

### Removed from the homepage (October 2026 refocus)
"One day at Meena's Kitchen", the agents section and demo, "Be the first name people find nearby", the regulars section, the six-feature Soundbox list and the 3D Soundbox, and the old two-card audience split. The agents demo was later removed from `/restaurants` too; the agents now show up as the morning summary and drafted review replies.

---

## 5. Restaurants page `/restaurants`

For restaurants already selling on Zomato or Swiggy. One message: **keep every app order, and add the ones the apps never see.** Calls, WhatsApp, office and party orders, dine-in guests ordering again from home, people searching the restaurant's name. Today these land on paper slips and get lost in the rush; Zest puts them on the restaurant's own page, paid by UPI and delivered by Zomato riders.

Rules: never ask a restaurant to leave or reduce the apps; no margin or commission talk; Zomato and Swiggy are partners in every line. Delivery cost is priced by distance, so never quote a fixed number. Uses the sample restaurant Rasoi 27.

### Hero
- Audience switch above the headline (Restaurant selected).
- **Headline:** More orders, beyond the apps.
- **Subhead:** Stay on Zomato and Swiggy. Take the phone, WhatsApp and party orders they never see on your own page, paid by UPI and delivered by Zomato riders.
- **Action:** paste your Zomato or Swiggy link → [Get your page free]. Under it: *Your page is ready in a minute, with your menu and photos. See a sample.*
- Visual: Rasoi 27's own page on a phone with real dish photos, the Soundbox beside it and three channel chips (Your page, Zomato, Swiggy); the loop opens with a party order landing on the page.

### The orders you already get, and lose
Four photo-led cards, each "Today:" (Chilli ✕) and "With Zest:" (Leaf ✓): regulars who call or WhatsApp · office and party orders · dine-in guests back at home (QR on the table and bill) · people who search your name.

### How a direct order reaches your customer
Five steps: orders on your page → pays by UPI → Soundbox calls it out and the KOT prints → a Zomato rider picks up from your counter → customer tracks it to the door. Three ways to deliver: Zomato rider (default), your own staff, pickup.

### Built to sit alongside Zomato and Swiggy (Ink band)
You stay on Zomato and Swiggy · Your menu comes from your listing · The riders you already know · One kitchen, one flow.

### Zest Soundbox
- **Headline:** Three tablets. One rush. No missed orders.
- **Body:** One box on your counter calls out every order from Zomato, Swiggy and your page, in Hindi or English.
- Problem → fix rows: unseen order → speaks it · slow accepts → one press · handwritten KOTs → ticket printer · nobody hears it → louder, then calls you.
- Interactive Soundbox (press to accept, escalates if ignored). [Ask for a Soundbox] opens the request form in place.

### Every app, one message every morning
Order, payout and rating emails from Zomato and Swiggy become one WhatsApp summary, shown on a phone; reviews come with a drafted reply. [Connect your email].

### Questions restaurants ask
Do I need to leave Zomato or Swiggy? · Will it change anything on the apps? · Who delivers orders from my page? · What does delivery cost? · Does the Soundbox work with my Zomato and Swiggy orders? · What does Zest read in my email? · What does it cost?

### Closing call to action (Turmeric band)
**Keep the apps. Add your own orders.** The same link box. Phones get the sticky start bar.

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
13. **No "Coming soon" labels.** The site describes the product as it will ship; features go live as restaurant pilots roll out. Never quote a fixed delivery price (it depends on distance).

## 8. Anti-slop checklist
- [ ] No gradient blobs, glowing orbs, sparkles or "AI" stars
- [ ] No all-caps eyebrows, no decorative middle-dot strings
- [ ] No identical rounded card grids
- [ ] One orchestrated moment per section, nothing else moves on its own
- [ ] Only food, kitchens, phones and the Soundbox as imagery; no stock people at laptops
- [ ] Every homepage headline reads naturally to a home-kitchen owner, in Hindi too
- [ ] Every button says exactly what happens
