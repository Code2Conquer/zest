# Landing rebuild: plan

Source of truth: `docs/landing-brief.md`. This plan says what changes, file by file, and lists the
questions that need an answer before or during the build.

## What the codebase has today

| Area | Today |
|---|---|
| Routes | `/` (landing, client component), `/r/[slug]` (ordering site + server layout for SEO), `/join`, `/start`, `/connect`, `/login`, `/login/staff`, `/m/[outletId]`, `/app/*` (owner screens), `robots.ts`, `sitemap.ts` |
| Landing components | `components/landing/zesty.tsx` (device, hero stage, sync demo), `flow.tsx` (agent handoff loop), `demo.tsx` (5-chapter demo player), `mocks.tsx` (phone ordering page), `router.tsx` ("Get started" dialog) |
| i18n | `lib/i18n.ts` (keyed dictionary for app screens) and `Bi` objects with `pick({en,hi})` from `useApp()`. The landing is currently English-only: the language switch was removed last round and `lib/state.tsx` stopped reading the saved language |
| Styling | Tailwind v4, tokens in `app/globals.css` (app) and `app/landing.css` (landing, light + dark via `data-theme`) |
| Animation | CSS keyframes in `landing.css`. `motion` (Framer Motion) is installed and used in app screens and `router.tsx` |
| Fonts | Anek Latin + Anek Devanagari via `next/font/google` in `app/layout.tsx`. No mono font |
| Database | libSQL/Turso + Drizzle. Tables are created at startup by `CREATE TABLE IF NOT EXISTS` in `lib/server/db.ts`, with `ALTER TABLE` additions and data fixes; types in `lib/server/schema.ts`. Sample restaurant seeded by `seedDemo()` in `lib/server/seed.ts` (fixed id, `isDemo: true`, slug `rasoi-27`) |
| Forms | API routes in `app/api/*` built with `handler()` from `lib/server/http.ts`, zod validation, `checkRate()` rate limits |
| Menu photo reading | `readMenu()` in `lib/server/vision.ts` behind `/api/onboarding/menu`. Works only with `ANTHROPIC_API_KEY`, which isn't set yet |

## Phase 1: Foundations

**Rename "Zesty"** (5 files: `app/page.tsx`, `app/landing.css`, `components/landing/zesty.tsx`, `demo.tsx`, `flow.tsx`). Most of these files are replaced in phases 2 to 4 anyway; nothing in routes, i18n or the database uses the name.

**Tokens and type**
- `app/landing.css`: replace the palette with Paper `#FAFAF6`, Ink `#1C1F23`, Turmeric `#E9A31A`, Steel `#D9DEE3`, Chilli `#C23A22`, Leaf `#2F7A4C`. Dark mode: Ink background, Turmeric unchanged. Delete the unused landing colours (console, band, google, swiggy-orange tints and others).
- `app/layout.tsx`:
  - Add IBM Plex Mono through `next/font/google` (already the font mechanism, no new package), used only by a `.font-kot` class.
  - Theme colour becomes Paper (light) and Ink (dark).
  - New meta description for `/`.
- Condensed Anek for headlines via the `wdth` axis that's already loaded.
- `app/restaurants/layout.tsx`: new server layout with its own title and description.
- **Scope:** the app screens (`/app/*`) keep their current palette. The brief is about the website; restyling the owner app would be a separate job. *Question 1.*

**Sample seller: Meena's Kitchen**
- `lib/data.ts`: add `MEENA` (home kitchen, veg, Green Park, Delhi) and `MEENA_MENU` (rajma chawal 90, aloo paratha 60, thali 120, Diwali sweets box, and a few more).
- `lib/server/seed.ts`: `seedMeena()` with its own fixed id, `isDemo: true` (kept out of search) and `ordering: true`. The slug becomes `meenas-kitchen`, so the page is `/r/meenas-kitchen`.
- `lib/server/db.ts`: call it next to `seedDemo()`.
- The `/r/[slug]` flow itself isn't touched.
- **Photos:** the repo has thali and dal photos but no rajma chawal, aloo paratha or sweets box. *Question 2.*

## Phase 2: Zest Soundbox

- **New `components/soundbox/soundbox.tsx`:** SVG/CSS. Steel rounded-square body, Ink face, Turmeric ring, a big round top button, a side push-to-talk button, and a ticket slot printing a KOT downward in Plex Mono with a perforated edge.
- **States:** `idle | ringing | speaking | printing | accepted | escalating`. Accepted gives a Leaf flash; escalating turns the ring Chilli and pulses it faster.
- **Props:** state, caption `{en, hi}`, ticket lines, `onPress`, `onTalk`.
- **"Hear it":** plays a short clip from `public/audio/*.m4a` on tap only, never autoplay. *Question 3.*
- **Reduced motion:** the final state, static, with its caption.
- **Dev-only gallery `app/dev/soundbox/page.tsx`:** shows every state for screenshots, then gets deleted before merge.
- **Replaces:** `components/landing/zesty.tsx`, which gets deleted.

## Phase 3: Homepage, top half

- **`app/page.tsx`:** rewritten section by section to the brief. The current sections go: Every order…, the rotating line, Your best customers…, Found. Ordered…, the old agents copy and the demo player.
- **Nav:** How it works · Agents · Soundbox · Questions · On Zomato or Swiggy? · Log in · Start free, plus the theme switch and the language switch. *Question 4.*
- **Hero sequence (new `components/landing/hero-sequence.tsx`):** handwritten menu board (drawn in CSS) → scan → dishes lift onto the Meena's Kitchen phone page → WhatsApp bubble → "Paid ₹270" chip → into the Soundbox → KOT → accept. About 8 seconds, then a new order every 10 seconds while in view. Built with CSS keyframes plus `motion` for the dish hand-off.
- **"One day at Meena's Kitchen" (new `components/landing/day.tsx`):**
  - **Desktop:** the Soundbox sticks on the left while six moments scroll on the right. An IntersectionObserver drives which line the Soundbox speaks.
  - **Mobile:** a horizontal swipe with scroll-snap, the Soundbox above.
- **Agents (`components/landing/flow.tsx`, reused):**
  - Five agents: Storefront, Orders and delivery, Regulars, Reviews, Growth.
  - Five new scenarios: A new order, A lunch rush, A quiet Tuesday, A complaint, A festival is coming.
  - The loop geometry moves to five positions, and each scenario ends with "What changed".
- **Deleted:** `components/landing/demo.tsx`.

## Phase 4: Homepage, bottom half

**New sections**
- Get found (phone search plus four panels lit in sequence).
- Soundbox section with features placed around the device, plus the waitlist.
- Delivery your way (a small SVG neighbourhood map, one order three ways).
- Sold out? Just say it (the sync demo, reused, with four channels).
- Your regulars (three guest cards).
- Start in a minute, FAQ and footer.

**Waitlist**
- Table `soundbox_waitlist`: id, name, business, phone, city, type, page, section, created_at.
- New `app/api/waitlist/route.ts`: zod validation, a 10-digit Indian mobile check, rate limit.
- New `components/landing/waitlist.tsx` with success and error states.
- **The migration** is a `CREATE TABLE IF NOT EXISTS` added to `SCHEMA` in `db.ts`, plus its Drizzle definition. I'll show you that diff before it runs anywhere.

**Reused / deleted**
- `components/landing/mocks.tsx` (`PhonePage`) is reused for the phone views.
- `components/landing/router.tsx` (the "Get started" dialog) is deleted if nothing else uses it. "Start free" goes to `/join`.

## Phase 5: /restaurants

- **New `app/restaurants/page.tsx`:**
  - The hero with Soundbox and channel chips, plus the link form that reuses the `/join?zomato=` prefill.
  - One voice for every order, with the waitlist.
  - The morning-summary WhatsApp mock-up with the privacy promise.
  - A page for your regulars, linking to `/r/rasoi-27`, then FAQ.
- **Shared header and footer:** taken out into `components/landing/site-header.tsx` and `site-footer.tsx`.

## Phase 6: Hindi parity

- Every string on both pages as `{en, hi}`.
- The language switch returns: `lib/state.tsx` reads the saved language again, and `LangToggle` is restored in `bits.tsx` for the marketing pages. *Question 4.*
- Devanagari line height raised for `:lang(hi)`.
- Screenshots in both languages at 360, 768 and 1440 px.

## Phase 7: QA and honesty

**Checks**
- Reduced motion, keyboard focus on every demo, contrast.
- No horizontal scroll at 360 px.
- Lighthouse mobile ≥ 90, throttled. *Question 5.*

**"Coming soon" labels:** I'll check each item against the code, label everything in the brief's list that isn't live, and report which were already working. Expected result:
- **Live:** the own ordering page, UPI to the seller, review reply drafts, customer list.
- **Partly built:** menu-photo reading (needs the Claude key).
- **Not live:** everything else on the list.

**Anti-slop checklist:** each item reported as pass or fail.

## Branching and preview

All work happens on the branch `feat/landing-brief`, with a commit per phase. The branch is pushed so Vercel builds a preview URL; production stays as it is until you say merge.

## Questions before I start

1. **Palette scope.** Apply the new tokens to the website only (`/`, `/restaurants`), leaving the owner app as is? (Recommended.)
2. **Meena's Kitchen photos.** No rajma chawal, aloo paratha or sweets box photos exist in the repo. Options:
   - (a) I find openly licensed photos on Wikimedia Commons and download them into `public/photos`, credited. I'll list each file before downloading.
   - (b) You send photos.
   - (c) I reuse the existing thali and dal photos for now.
3. **"Hear it" clips.** The brief wants pre-recorded clips. I can generate them on this Mac with its built-in Hindi (Lekha) and Indian English (Rishi, Tara) voices: about 6 small .m4a files, roughly 30 KB each. Or you record them. Generate them for now?
4. **Language switch.** You asked me to remove it two rounds ago; the brief says keep it. Bring it back on the website, alongside the light/dark switch? Should the owner app get it back too?
5. **Tools and links.**
   - **Lighthouse:** I'd run it with `npx lighthouse`, which downloads the tool temporarily but doesn't add it to the project. OK?
   - **"Start on WhatsApp":** needs a Zest WhatsApp number. Do you have one? If not, the button opens the waitlist with a "Coming soon" label.
6. **Pricing.** Ship "Free to start" as written?
