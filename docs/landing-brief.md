# Zest website: rebuild brief

Paste this whole file into the Claude Code session that owns the Zest site (https://zest-dusky.vercel.app). It replaces the current homepage and adds one new page. Keep the existing stack, routes (/login, /login/staff, /r/[slug]), the sample restaurant Rasoi 27 and the English/हिंदी toggle.

---

## 0. Who each page is for

**Homepage `/`: small food businesses not on Zomato or Swiggy.** Home kitchens, tiffin services, small cloud kitchens, neighbourhood food shops and stalls. They sell today through WhatsApp, phone calls and walk-ins. They have demand but no store, no payments system and no delivery. They are busy cooking and are not comfortable running apps. Zest gives them their first real online store, delivery by Zomato riders, AI agents that do the online work, and the Zest Soundbox in the kitchen.

**`/restaurants`: restaurants already on Zomato or Swiggy.** They get their own ordering page for regulars, the Zest Soundbox, and a morning summary of every app built from their email. Linked from the homepage nav and from one line in the homepage hero.

Every line of homepage copy should make sense to a home-kitchen owner reading in Hindi on a phone.

---

## 1. The story in one line

**Homepage:** Your kitchen, online in a minute. Zest does the rest.
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

### Nav
Zest · How it works · Agents · Soundbox · Questions · On Zomato or Swiggy? · Log in · **Start free**

### Hero
- **Headline:** Your kitchen, online in a minute. Zest does the rest.
- **Subhead:** Send a photo of your menu and your own ordering page is live, with WhatsApp orders, UPI payments and delivery by Zomato riders. Zest's AI agents take orders, bring back your regulars and find new customers. The Zest Soundbox tells you every order out loud.
- **Primary action:** [Upload menu photo] [Start on WhatsApp]
- Under it: *Free to start. No app to learn.* (Confirm the pricing line before shipping.)
- Secondary line: *Already on Zomato or Swiggy? See Zest for restaurants.*

**Hero animation, the page's one big moment (~8 s, then idles):**
1. A phone photo of a handwritten menu board ("Rajma chawal 90 · Aloo paratha 60 · Thali 120") sits on the left.
2. The photo scans; dishes lift off it one by one and settle into a clean ordering page on a phone (Meena's Kitchen, veg marks, prices, Add buttons).
3. A WhatsApp order bubble arrives on the phone: *"2 aloo paratha, 1 rajma chawal, Flat 302"*; a UPI "Paid ₹270" chip appears in Leaf.
4. The order travels into the Soundbox; the ring pulses; caption: *"नया ऑर्डर! दो आलू पराठा, एक राजमा चावल. पैसे मिल गए."* (or English when toggled).
5. A KOT prints. A cursor presses the big button; caption: *"Accepted. Zomato rider at 1:05."*
6. Idle. Every 10 s a new order arrives if the hero is in view.

### Section: One day at Meena's Kitchen (the agents at work)
- **Headline:** One day at Meena's Kitchen.
- **Intro:** Meena cooks. Zest's agents do everything else.

Layout: desktop has the Soundbox sticky on the left and moments scrolling on the right; as each moment reaches mid-screen, the Soundbox speaks its line and the visual plays. Mobile: horizontal swipe with the Soundbox above. Each moment shows which agent acted, as a small name tag.

| Time | Agent | What the visitor sees | Zest says |
|---|---|---|---|
| 9:00 am | Storefront | Menu photo → live page, a counter QR standee, a Google listing with an Order button | "Your page is live. Here's a message ready to share in your society groups." |
| 12:15 pm | Orders | Six lunch orders from one society stack up, grouped into one delivery | "Six lunch orders for Green Park. One rider at 12:45." |
| 12:45 pm | Delivery | Rider dot moves through the society; guests get tracking links | "Rider has picked up. All six will reach in 15 minutes." |
| 4:00 pm | Regulars | A guest card: "Rahul, rajma chawal every Friday" with a drafted WhatsApp message | "Rahul orders rajma every Friday. Shall I send him today's menu?" |
| 8:30 pm | Reviews | A complaint ("roti was hard"), Zest's drafted reply and offer, owner taps Approve | "A guest said the roti was hard. I've apologised and offered a free roti next time. OK?" |
| Sunday | Growth | A suggested Diwali sweets box and a small Instagram ad for nearby areas, with budget, Approve / Edit | "Diwali is in 8 days. Shall I launch a sweets box for your regulars and a ₹500 ad nearby?" |

Under the section: *Anything that costs money or goes public waits for your OK.*

### Section: The agents
- **Headline:** Your online team. It never sleeps. You make the calls.
- **Body:** Five agents pass each job between them until it's done. They learn from every edit you make: the more you approve, the less you need to.
- Five agents:
  - **Storefront**: your website from a menu photo, set up for Google search, WhatsApp ordering, UPI payments, your Google listing, the counter QR
  - **Orders and delivery**: accepts, prints the KOT, picks pickup, your own helper or a Zomato rider, tracks to the door
  - **Regulars**: remembers every guest and their usual, welcome offers for new guests, reminders that bring regulars back
  - **Reviews**: asks every guest how it was, answers complaints in your voice, spots repeat problems
  - **Growth**: shows up in AI answers, Instagram posts and ads on Instagram and Facebook within your budget, spots what people nearby search for, suggests new combos, lunch boxes and festive hampers
- Reuse the existing handoff demo with these five agents and scenario tabs: *A new order · A lunch rush · A quiet Tuesday · A complaint · A festival is coming.* Each ends with "What changed" results. Full width; the largest interactive element after the hero.

### Section: Get found
- **Headline:** Be the first name people find nearby.
- **Body:** When someone searches "ghar ka khana near me" or "tiffin service in Green Park", your kitchen should show up, with an Order button. Zest sets you up everywhere people look, and keeps it up to date.
- Layout: a phone in the centre showing a search for "homemade rajma chawal near me". Around it, four small panels light up in turn as the search result appears (one orchestrated sequence when the section enters view, then still):
  - **Your own website:** a fast page with every dish, prices and photos, written so Google understands it. Each dish gets its own page, so "aloo paratha in Lajpat Nagar" can land on it.
  - **Google listing:** your Google Business Profile with menu, hours, photos and an Order button. Home kitchens can show their delivery area without showing their home address.
  - **AI answers:** your menu and details set up so ChatGPT and Google's AI answers can recommend you when someone asks "where can I get homemade food nearby?"
  - **Instagram and Facebook:** an order link in your bio, posts of today's menu drafted for you, and small local ads within the budget you set.
- **Line under it:** Zest watches what people search for nearby and tells you what to add: "Many people near you search for Jain thali. Want to add one?"
- Agent tags shown on the panels: Storefront for website and Google, Growth for AI answers, Instagram and ads.

### Section: Zest Soundbox (waitlist)
- **Headline:** Meet the Zest Soundbox.
- **Body:** A small box on your counter that speaks every order out loud, in Hindi or English. Press the big button to accept and it prints the kitchen ticket. Press again when the food is ready and the rider is on the way. No phone in your hand while you cook.
- Interactive Soundbox: press the big button (accept → print), push-to-talk ("rajma khatam" → "Rajma is sold out everywhere"), "Hear it".
- Six features placed around the device, not as a grid:
  - Speaks every order
  - One big button, works with floury hands
  - Prints the ticket
  - "Food ready" calls the rider
  - Push to talk: say a dish is finished, it's off your menu
  - Never misses an order: gets louder, then calls your phone
- **Line:** You trust a soundbox with your payments. Now trust one with your orders.
- Waitlist form.

### Section: Delivery, your way
- **Headline:** Pickup, your helper or a Zomato rider. Zest picks the best way.
- **Body:** Nearby guests can pick up. Short trips can go with your own helper, with a tracking link for the guest. Everything else goes with Zomato riders, and lunch orders from one building travel together.
- Visual: one order shown three ways on a small neighbourhood map, Zest choosing.

### Section: Change it once
Keep the push-to-talk sync demo, with this seller's channels: your page, WhatsApp menu, Google, Instagram.
- **Headline:** Sold out? Just say it.
- **Body:** Tell Zest a dish is finished and it's off your page, WhatsApp menu, Google and Instagram in seconds. Say it's back, and it's back.

### Section: Your regulars
- **Headline:** Know your regulars. Bring them back.
- **Body:** Every order comes with your guest's name, number and favourite dishes, and they stay yours. Zest reminds them when their usual is on the menu, and welcomes new guests with an offer you choose.
- Visual: three guest cards with their usual order and last visit.

### Section: Start in a minute (a real sequence, numbering is fine)
1. Send a photo of your menu, on the website or on WhatsApp.
2. Your page goes live. Share it in your groups and put the QR on your counter.
3. Orders start coming in. Join the Soundbox waitlist to hear every one.

[Upload menu photo] [Start on WhatsApp]

### Questions sellers ask
- **Do I need to be on Zomato or Swiggy?** No. Zest gives you your own page and WhatsApp ordering. Zomato riders only deliver.
- **Who delivers?** You choose for each order: pickup, your own helper, or a Zomato rider with live tracking.
- **Who pays for delivery?** You decide: the guest pays, you offer free delivery above an amount, or pickup only.
- **How do I get paid?** Guests pay by UPI, straight to your account.
- **Do I need an FSSAI registration?** For delivery, yes. Zest helps you apply. (Mark "Coming soon" until built.)
- **What does it cost?** Free to start. (Confirm the final pricing line before shipping.)
- **Will people find me on Google?** Yes. Zest builds your website for search and sets up your Google listing. Home kitchens can show their delivery area without showing their address.
- **Do I need a smartphone?** A phone with WhatsApp is enough to start. The Soundbox lets you run orders without touching it.
- **Which languages?** Hindi and English today, more Indian languages soon. Write in Hinglish and Zest answers in kind.

### Footer
Your kitchen, online in a minute. · Start free · Join the Soundbox waitlist · Zest for restaurants · Sample seller · Log in · Staff sign-in · © 2026 Zest

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
