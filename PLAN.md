# Restaurant AI Agent — Product & Build Plan

Product name: **Zest**.

One place where a restaurant owner can **start, run and grow** a restaurant across Zomato, Swiggy and their own dine-in. It has two halves:
a clean **operations UI** and a **conversational copilot** that can act on the owner's behalf. The copilot is an orchestrator agent backed by specialist agents.

---

## 1. Product principles

1. **Chat and UI are one surface.** Every module also works in chat. Every chat answer comes back as a usable UI card, such as a chart, a menu diff, a review reply to approve or a payout breakdown. Owners never have to choose between the two.
2. **Mobile first, WhatsApp native.** Most owners run the business from a phone. The web app must work at 360px wide, and WhatsApp is a full channel, not just notifications.
3. **Read first, then draft, then act.** Trust is earned in steps. Agents start read-only, then draft for approval, and act on their own only where the owner opts in.
4. **Zero-effort connection.** Getting value should take one connection, starting with email.
5. **Speak the owner's language.** Hindi and English first, regional languages next, voice input from the start.
6. **Every action is logged and reversible where possible.** Keep an audit trail, offer undo, and enforce spend caps.

---

## 2. Entry journeys (the router on the landing page)

```
Landing ─► "Tell us about your restaurant"
   │
   ├─ A. I want to START a restaurant ──────────► Onboarding track (pre-launch)
   │      (idea / kitchen ready / docs pending)     docs → menu → listing → go-live
   │
   └─ B. I already OWN a restaurant
          │
          ├─ B1. Not live on Zomato/Swiggy ─────► Onboarding track (listing only)
          │
          └─ B2. Live on Zomato and/or Swiggy
                 │
                 ├─ B2a. Uses a POS (Petpooja, Posist, UrbanPiper…) ─► connect POS
                 └─ B2b. Uses partner apps directly ───────────────► connect email (+ portal)
                                │
                                ▼
                     Lifecycle stage auto-detected:
                     New (<90 days live)  →  Operate  →  Scale & Grow
```

**Platform neutrality.** The product does not favour Zomato or Swiggy. The owner ticks where they are live: Zomato, Swiggy, both, or neither. Only those platforms appear in the connect step, in Today, and in every module. Each platform is one interchangeable **connector**, and adding another platform later (ONDC, Magicpin, own website) means adding a connector, not changing modules.

**Connect step (B2).** Email comes first, then every live platform offers the same three ways to connect:

1. **Connect email** (Gmail/Outlook OAuth). Payout mails, statements of account, weekly reports, onboarding status and complaint escalations from both platforms arrive here. This gives instant value with no partner dependency.
2. **Connect each live platform.** The owner picks one method per platform:

   | Method | What the owner provides | How we use it | Live data? |
   |---|---|---|---|
   | **Official API** | OAuth sign-in or API key from the partner programme | Direct API calls and webhooks | Yes |
   | **MCP server** | URL of an MCP server (official, POS-provided or self-hosted) plus its token | Its tools are registered with the agents | Depends on the server |
   | **Partner portal sign-in** | Partner portal phone or email and password; OTP when asked | A sandboxed browser agent signs in, reads data and takes approved actions | Polling (every few minutes) |

   All three methods feed the same data model, so modules and agents never care which one was used. The UI shows per-platform health ("Swiggy · portal sign-in · synced 3 min ago") and suggests upgrading to the API when one is available.
3. **Connect POS** (optional, for owners who have one). This brings real-time orders, menu and inventory from both platforms at once.
4. **Connect WhatsApp** (opt-in), so the owner gets summaries and can chat with the copilot there.

---

## 3. Lifecycle tracks and modules

| Track | What the owner gets |
|---|---|
| **1. Onboarding** | Document checklist (FSSAI, GST, PAN, bank, cancelled cheque, shop licence). Documents are read with vision OCR and checked. A menu is built from photos of the paper menu. Dish photo quality is checked. Listing applications are tracked, and the go-live checklist is followed up automatically. |
| **2. New restaurant support** (first 90 days) | A playbook of daily nudges, comparison against similar outlets nearby, first-review handling, rating recovery, prep-time and acceptance-rate coaching, and a starter promo plan. |
| **3. Scale & Grow** | Ads and promo recommendations, then execution. Menu engineering (stars, plowhorses, dogs), pricing, combos, new outlets or cloud-kitchen brands, a leaderboard against local peers. |

**Modules available in every track:**

- **Today** is the home screen. It shows the morning brief: yesterday's sales by channel, payouts due, open complaints, rating change, and the three suggested actions.
- **Orders** is a live board across Zomato, Swiggy and dine-in, with delays, rejections, cancellations and kitchen load.
- **Menu Studio** holds one master menu mapped to each channel. It handles item on/off and stock-outs, price changes, and shows a diff across channels.
- **Reviews & Complaints** is a single inbox. The agent drafts replies in the brand's voice, and the owner approves them or turns on auto-reply for 4★ and above. Refund and complaint disputes are handled here too.
- **Money** covers payouts, statements of account, settlement reconciliation (expected vs received), commission and deduction breakdowns, and GST/TDS summaries.
- **Dining** covers tables, reservations, waitlist, QR menu and dine-in billing (or a POS link).
- **Growth** covers ads and promos on each platform, ROI tracking, experiments, and a calendar of festivals and events.
- **Brand & Marketing** covers dish photo enhancement, menu descriptions, social posts and a Google Business profile.
- **Connections & Settings** covers email, POS, portals, WhatsApp, staff roles and autonomy controls.

---

## 4. Agent architecture

```
                 ┌───────────────── Channels ─────────────────┐
                 │  Web app copilot   ·   WhatsApp   ·  Voice   │
                 └────────────────────────┬───────────────────┘
                                          ▼
                         ┌────────────────────────────────┐
                         │      ORCHESTRATOR AGENT        │
                         │ intent → plan → route → verify │
                         │ memory: outlet profile, prefs  │
                         └──┬────┬────┬────┬────┬────┬────┘
        ┌───────────────────┘    │    │    │    │    └────────────────────┐
        ▼            ▼           ▼    ▼    ▼           ▼                   ▼
   Onboarding   Online Orders   Menu  Reviews &   Finance          Growth (Ads/Promos)
     Agent        Agent        Agent  Complaints  (Payouts/SOA/     + Marketing & Brand
                                       Agent       Recon) Agent          Agents
        └───────────────┬────────────── Dining Agent ──────────────────────┘
                        ▼
         ┌──────────────── Tool layer (MCP servers) ─────────────────┐
         │ zomato-partner · swiggy-partner · pos-petpooja · pos-     │
         │ urbanpiper · email-ingest · whatsapp · browser-agent ·    │
         │ vision (OCR, photo QA) · analytics-sql · notifications    │
         └──────────────────────────┬────────────────────────────────┘
                                    ▼
             Unified data layer (Postgres + event stream + doc store)
```

**Design decisions:**
- **The orchestrator** runs on the most capable model (Claude Opus class). Specialists run on cheaper and faster models (Sonnet or Haiku class) for classification, extraction and review replies.
- **Every integration is an MCP server** with a typed schema. This lets the same tools serve the web copilot, the WhatsApp bot and background jobs. The `mcp-builder` skill is installed for this.
- **Action tiers** are enforced in the tool layer, not just in prompts:
  - `read` runs freely.
  - `draft` creates a pending approval card.
  - `execute` needs owner approval or an opt-in policy, such as "auto-reply to reviews of 4★ and above" or "pause an item when stock runs out".
  - `spend` (ads and promos) always has hard caps, and confirmation in Phase 5.
- **Long-running work runs as durable workflows** (Temporal or Inngest). Examples are onboarding over weeks, payout reconciliation and campaign monitoring. The agents start these workflows and check on them, rather than holding them in a chat turn.
- **Vision** covers documents, paper-menu photos, dish photo quality, kitchen hygiene photos (later) and statement PDFs.
- **Browser use** runs Playwright in a sandbox, or computer use, against partner portals that have no API. It is the last resort, sits behind feature flags, and flags OTP and 2FA steps to the owner.
- **Memory** has three parts: an outlet profile (cuisine, hours, brand voice, targets), owner preferences and autonomy settings, and episodic history in pgvector.

---

## 5. Integration and data strategy

| Source | What it gives | Realtime? | Notes |
|---|---|---|---|
| **Email (Gmail/Outlook)** | Payout advice, statements of account, weekly business reports, onboarding status, complaint mails | Near-realtime (push/watch) | Phase 1. Parsers for each sender template, with an LLM fallback. |
| **Zomato connector** | Orders, menu, ratings/reviews, complaints, payouts, ads/promos | API/MCP: yes. Portal: polling | One connector with three methods: API, MCP, portal sign-in. Note: [Zomato's public MCP server](https://www.f22labs.com/blogs/zomato-mcp-server-guide-architecture-and-features) is consumer-facing (search/order), so a merchant-side MCP or API is still needed. |
| **Swiggy connector** | Same | Same | Same connector shape. No public partner API was found, and [Swiggy Builders Club MCP](https://mcp.swiggy.com/builders) is consumer-side, so most Swiggy owners will start on portal sign-in. |
| **POS: Petpooja, Restroworks/Posist, UrbanPiper** | Aggregator orders from both platforms, dine-in bills, menu, inventory | Yes (webhooks) | No public Petpooja developer docs; it pushes orders through [webhooks with a shared secret](https://cloud.frappe.io/marketplace/apps/petpooja). Partnerships are needed. UrbanPiper-style middleware covers both aggregators at once. |
| **Owner uploads** | Docs, menu photos, bank statements | — | Vision pipeline. |
| **WhatsApp Business Cloud API** | Outbound templates and two-way chat | Yes | Pre-approved templates are needed for summaries, payouts and alerts. Opt-in has to be recorded. |

**Canonical data model** (channel-agnostic, every row tagged with `channel` and `source`):
`Owner, Outlet, ChannelListing, MenuItem(master) ↔ ChannelItemMapping, Order, OrderEvent, Settlement/Payout, Deduction, Review, Complaint, Campaign(ad/promo), Document, Task/Approval, AgentAction(audit), Notification`.

---

## 6. UX and visual direction

- **Layout (desktop).** A slim left nav for modules, a main canvas, and a **copilot panel on the right that is always available**. The panel can collapse, and ⌘K opens a command bar. **Mobile:** bottom tabs (Today, Orders, Copilot, Money, More), with the copilot as the centre tab.
- **Generative UI cards.** The copilot answers with interactive components such as `PayoutCard`, `MenuDiffCard`, `ReviewReplyCard [Approve | Edit | Skip]`, `OrderTimeline`, `PromoProposal [ROI estimate]` and `DocChecklist`. All of them come from the same component library the modules use.
- **Approvals inbox.** All pending agent drafts sit in one queue, with a badge in the nav and on WhatsApp ("Reply 1 to approve").
- **Trust affordances.** Each action shows its source data ("from Swiggy payout mail, 14 Oct"), the agent that did it, and undo.
- **Visual language.** Use a calm, high-contrast "kitchen ticket" aesthetic. Pair a sturdy grotesk with a mono for numbers and order IDs. Use channel colour only as small chips (red for Zomato, orange for Swiggy, neutral for dine-in) and keep platform branding out of the chrome. Support light and dark themes; dark matters for kitchen screens. The `frontend-design` skill is installed to enforce a distinctive, non-templated result.
- **Accessibility and language.** WCAG AA, large tap targets, a Hindi/English toggle (the only two languages at launch), and voice input in chat. The copilot replies in whichever language or Hinglish mix the owner writes in.

---

## 7. Phase-wise implementation

### Phase 0 — Foundations (weeks 0–2)
- Monorepo: **Next.js (App Router) + TypeScript + Tailwind + shadcn/ui** for the web app; a **TypeScript or Python agent service**; Postgres (with pgvector) and Redis; a durable workflow engine (Temporal or Inngest).
- Design system: tokens, the core components, and the generative-UI card kit.
- Agent runtime: an orchestrator skeleton (Claude Agent SDK or tool-runner loop), an MCP tool registry, enforcement of action tiers, an audit log, and an **eval harness** (golden conversations for each agent).
- Auth: phone OTP and multi-outlet roles (owner, manager, staff).
- **Legal and policy track begins.** Review the terms of service for portal credential use, DPDP Act data handling, WhatsApp template approval, and partner agreements with POS vendors.
- **Exit:** a clickable prototype of the landing page, router, Today screen and copilot, running on seeded data.

### Phase 1 — MVP: the read-only owner copilot for small app-only owners (weeks 3–8)
Priority segment: small owners who run everything from the Zomato and Swiggy partner apps, with no POS.
- Landing page and entry router (§2), in Hindi and English.
- **Email connect** flow, and parsers for payouts, statements of account and weekly reports from both platforms, plus extraction from PDF statements.
- **Platform connectors, neutral and symmetric**: the same connect screen for Zomato and Swiggy with API, MCP and portal sign-in options. The portal sign-in browser agent is read-only in this phase (orders, ratings, reviews, payouts), with the credential vault and OTP hand-off built in. It ships behind the legal sign-off from Phase 0.
- **Today**, **Money** (payouts, statements, deductions) and a read-only **Orders** history.
- Copilot Q&A over the owner's data ("Why was my Swiggy payout lower this week?").
- **WhatsApp:** a daily order summary, payout-credited alerts and a weekly leaderboard.
- **Exit:** 20–50 pilot outlets; connected to first insight in under 5 minutes; at least 40% of owners active weekly on WhatsApp.

### Phase 2 — Onboarding agent (weeks 6–12, overlapping Phase 1)
- A guided onboarding wizard and an agent for track A and B1.
- Vision OCR and validation for FSSAI, GST, PAN and bank documents, with expiry reminders.
- **Menu from photo:** a picture of the paper menu becomes a structured menu with categories, variants and add-ons, plus suggested descriptions and dish photo QA.
- Application status tracking through email, a go-live checklist, and WhatsApp nudges.
- **Exit:** median time from signup to go-live cut by at least 30% against the baseline.

### Phase 3 — Operate: orders, menu, reviews, reconciliation (weeks 10–18)
- Platform connectors gain **write actions** (item on/off, review replies, complaint responses) through API, MCP or the portal agent, always behind approval.
- **POS connectors** (Petpooja and UrbanPiper first) for the smaller set of owners who have a POS.
- A **live Orders board** with delay and rejection alerts.
- **Menu Studio:** one master menu, channel mapping, item on/off and stock-out sync, and a diff view (`draft` then `execute` with approval).
- **Reviews & Complaints agent:** a single inbox, replies drafted in the brand's voice, opt-in auto-reply, and complaint and refund dispute handling.
- **Reconciliation:** expected vs received payouts per order, with wrong deductions flagged and dispute drafts.
- **Exit:** review response rate above 90%; at least 1% of GMV in payout discrepancies found for pilot outlets.

### Phase 4 — Dining and new restaurant support (weeks 16–22)
- **Dining:** tables, reservations and waitlist, QR menu, dine-in sales in the same analytics.
- **First-90-days playbook:** daily coaching, comparison with similar outlets nearby, rating recovery.
- Leaderboards and goals.
- **Exit:** better 90-day retention and ratings for new outlets compared with a control group.

### Phase 5 — Growth: ads, promos and marketing (weeks 20–30)
- Map out the ad and promo products each platform offers, and the APIs or portal flows for them.
- A **Growth agent** that recommends, simulates ROI, proposes a campaign, and executes after approval with spend caps, then monitors and auto-pauses underperformers.
- An events calendar (IPL, festivals, weather) that triggers promos.
- **Brand & Marketing agent:** photo enhancement, social posts, Google Business profile.
- **Exit:** a measurable lift in ROAS against the owner's own past campaigns, with no spend over the caps.

### Phase 6 — Autonomy and scale (week 30 onward)
- More platform connectors (ONDC, Magicpin, own website ordering).
- Policy-based autonomy ("run my store"), multi-outlet chains and cloud-kitchen multi-brand, and an inventory and purchasing agent.
- Voice ordering hotline and a staff-facing kitchen display copilot.

---

## 8. Risks and how to handle them

| Risk | Mitigation |
|---|---|
| Storing partner portal credentials (Zomato or Swiggy) may breach platform terms of service or law | Offer API and MCP alongside sign-in and nudge owners to upgrade when available. Gate the browser agent behind legal sign-off, with explicit owner consent. Keep a KMS vault, never show secrets to the LLM, and keep the browser session in a sandbox. |
| The agent takes a wrong action (wrong price, bad reply, ad overspend) | Action tiers in code, approvals, hard spend caps, undo, an audit log, and evals in CI. |
| Email parsing breaks when templates change | Parsers for each template, an LLM fallback with confidence scores, and alerts on drift. |
| POS partner dependency | Start with middleware (UrbanPiper) that covers many POS systems; email is the fallback. |
| WhatsApp template rejections and spam perception | Few templates with high value, frequency chosen by the owner, and recorded opt-in. |
| Data privacy (DPDP Act) | Consent records, data minimisation, retention limits, and data hosted in India. |

---

## 9. Success metrics

North star: **weekly active outlets that took at least one agent-assisted action**.
Supporting metrics: time to first insight, onboarding time, review response rate, payout discrepancy recovered (₹), rating change, ROAS lift, WhatsApp engagement, and approval rate for agent drafts (a trust signal).

---

## 10. Skills set up for this build

Installed in `.claude/skills/` from the official `anthropics/skills` repo:
- **frontend-design**: distinctive, non-templated UI direction.
- **mcp-builder**: building the integration MCP servers (Zomato, POS, email, WhatsApp).
- **webapp-testing**: Playwright-based checks of the running web app.

Already available in this session: **dataviz** (charts for Money and Growth), **claude-api** (agent and SDK reference).
Third-party skills worth evaluating (not installed, unverified): UI/UX Pro Max, Impeccable, and Compound Engineering's `ce-frontend-design`.

---

## 11. Decisions

1. **Platform access.** The owner connects Zomato and Swiggy themselves, each by official API, MCP server or partner portal sign-in.
2. **Neutrality.** No platform is favoured. The product shows only the platforms the owner is live on.
3. **First segment.** Small owners who use the partner apps directly. Email plus portal sign-in is the main path, and POS support comes later.
4. **Languages at launch.** Hindi and English.
