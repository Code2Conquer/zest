# Phase A: Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put in place everything the all-in-one phases build on, at no running cost: tests, Google sign-in for owners and PIN sign-in for staff with roles, brands, the widened order model, order lines, a job runner, live order updates, opening hours, a consent ledger, copilot evals and ops basics, without breaking any screen that works today.

**Architecture:** Same Next.js app and libSQL database. New tables are created in `lib/server/db.ts` the way existing ones are (`CREATE TABLE IF NOT EXISTS` in `TABLES`, additive `ALTER TABLE` in `COLUMNS`, idempotent data fixes in `migrate()`). New server logic lives in focused files under `lib/server/`, each with pure functions that tests call directly against an in-memory database.

**Tech Stack:** Next.js 16 (App Router), TypeScript 7, Drizzle ORM on `@libsql/client`, zod 4, Vitest (new, dev), `@sentry/nextjs` (new).

**Spec:** `docs/superpowers/specs/2026-10-21-all-in-one-restaurant-design.md` (Phase A row of §13; §7.0, §7.1, §7.2, §7.7 consent, §7.17, §11; §15 items 7–11 override the paid services)

## Global Constraints

- Read the relevant guide in `node_modules/next/dist/docs/` before writing route handlers, middleware or streaming code (`AGENTS.md`: this Next.js has breaking changes).
- Every user-visible string ships in English and Hindi (`{ en, hi }` or the `t()` dictionary in `lib/i18n.ts`).
- Money is integer rupees, shown as `₹` with `en-IN` grouping.
- Server modules start with `import "server-only";`.
- Every write records an `audit()` row; from Task 5 on, the actor is `user:<userId>` when a person did it, `system` or the agent name otherwise.
- The sample restaurant stays browsable without login and read-only in production unless `ZEST_DEMO_WRITABLE=1`.
- No new runtime dependencies besides `@sentry/nextjs`; `vitest` and `tsx` are dev dependencies.
- Existing API response shapes stay compatible; new fields are additive.
- Times are stored as ISO strings in UTC; opening hours are interpreted in `Asia/Kolkata`.
- No paid service is required to run anything in this plan (spec §15 items 7–11). Integrations that will be paid later sit behind an interface with a free implementation.

## Review Focus

1. **A pilot outlet created before this phase (cookie only, no user)** must stay reachable: the first Google sign-in from the browser that holds its cookie, or by the Gmail address connected to it, makes that person its owner. Test in Task 5.
2. **Webhook senders still posting old statuses** (`picked`, `delivered`) must be accepted and mapped, not rejected. Test in Task 2.
3. **Overnight hours** (6 pm to 2 am) and a server clock in UTC must still say "open" at 1:30 am IST. Test in Task 8.
4. **A job whose handler throws or whose run is cut off** must run again later, never stay "running" forever. Test in Task 6.
5. **PIN guessing** on a shared kitchen device must be stopped, and a staff member removed by the owner must lose access at once. Test in Task 5.

---

## Before you start (owner actions, not code)

All free. Paid services wait until the product is ready and 50 restaurants are onboarded (spec §15).

- [ ] Rotate the Turso token that was shared in chat (PLAN §13 step 7) and set `CRON_SECRET` in Vercel.
- [ ] In the existing Google Cloud OAuth client, add `<site>/api/auth/google/callback` as a redirect URI (sign-in reuses the Gmail client).
- [ ] Create a free cron-job.org account; after Task 6 is deployed, add a job calling `GET https://zest-dusky.vercel.app/api/jobs/run` every minute with header `Authorization: Bearer <CRON_SECRET>`.
- [ ] Optional: a free Sentry account and `SENTRY_DSN` (Task 11 works without it).

---

### Task 1: Test harness and CI

**Files:**
- Create: `vitest.config.ts`, `tests/setup.ts`, `tests/stubs/server-only.ts`, `tests/helpers.ts`, `tests/server/smoke.test.ts`
- Modify: `package.json` (scripts `test`, `test:watch`; devDependency `vitest`), `.github/workflows/ci.yml` (add `npm test` after `tsc`)

**Interfaces:**
- Produces: `npm test`; `tests/helpers.ts` → `freshOutlet(overrides?: Partial<typeof outlets.$inferInsert>): Promise<Outlet>` (inserts an outlet with a random id and returns it; Task 4 extends it to create a brand first).

- [ ] **Step 1: Write the smoke test** in `tests/server/smoke.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { dinePrice } from "@/lib/server/dining";
import { createApproval, listApprovals } from "@/lib/server/approvals";
import { freshOutlet } from "../helpers";

describe("harness", () => {
  it("prices dine-in at the lowest platform price", () => {
    expect(dinePrice({ price: { zomato: 199, swiggy: 189 } })).toBe(189);
  });
  it("talks to a real database", async () => {
    const o = await freshOutlet();
    await createApproval(o.id, { agent: "menu", kind: "menu_change", title: "t", payload: { changes: [] } });
    expect(await listApprovals(o.id, "pending")).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/server/smoke.test.ts`
Expected: FAIL (vitest not installed / no config)

- [ ] **Step 3: Add the harness**

`vitest.config.ts`: node environment; alias `@` → repo root and `server-only` → `tests/stubs/server-only.ts` (empty module); `setupFiles: ["tests/setup.ts"]`. `tests/setup.ts` sets `process.env.DATABASE_URL = ":memory:"` and `ZEST_SECRET_KEY` to a fixed 32-byte base64 test key before any import of `lib/server/db`, then `await ready()`. `freshOutlet` inserts into `outlets` with `crypto.randomUUID()` ids so tests never collide.

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test`
Expected: PASS, 2 tests

- [ ] **Step 5: Wire CI and commit**

CI order: `npm ci` → `npx tsc --noEmit` → `npm test` → `npm run build`.

```bash
git add vitest.config.ts tests package.json package-lock.json .github/workflows/ci.yml
git commit -m "test: add Vitest harness on an in-memory database and run it in CI"
```

---

### Task 2: Widen channels and order statuses

**Files:**
- Modify: `lib/platforms.ts`, `lib/types.ts:59-63`, `lib/server/schema.ts` (`orders`), `lib/server/db.ts` (`COLUMNS`, `migrate()`), `lib/server/connectors.ts:33`, `lib/server/sync.ts`, `app/api/webhooks/[platform]/route.ts`, `lib/server/queries.ts:117-129`, `lib/server/seed.ts`, `app/app/orders/page.tsx`, `app/app/page.tsx`, `components/bits.tsx`, `app/globals.css`
- Create: `lib/orders.ts`
- Test: `tests/server/orders-model.test.ts`

**Interfaces:**
- Produces (in `lib/platforms.ts`): `type Channel = "zomato" | "swiggy" | "ondc" | "web" | "whatsapp" | "phone" | "dine"`; `DIRECT_CHANNELS: readonly ["web", "whatsapp", "phone"]`; `isDirect(c: Channel): boolean`; `CHANNEL_NAME` and `CHANNEL_COLOR` for every channel (`web` "Website", `whatsapp` "WhatsApp", `phone` "Phone", `ondc` "ONDC"; all three direct channels use `var(--ch-direct)`, ONDC uses `var(--ch-ondc)`).
- Produces (in `lib/orders.ts`): `type OrderStatus = "new" | "accepted" | "preparing" | "ready" | "out_for_delivery" | "picked_up" | "served" | "completed" | "rejected" | "cancelled"`; `ACTIVE_STATUSES: OrderStatus[]` = `new, accepted, preparing, ready`; `fromLegacyStatus(s: string): { status: OrderStatus; delayed: boolean }`.
- Produces: `orders.delayed` (boolean, default false) and `orders.promised_at` (nullable ISO). `OrderDTO` gains `delayed: boolean` and `promisedAt: string | null`.

- [ ] **Step 1: Write the failing tests**

```ts
describe("order model", () => {
  it("maps every legacy status", () => {
    expect(fromLegacyStatus("preparing")).toEqual({ status: "preparing", delayed: false });
    expect(fromLegacyStatus("delayed")).toEqual({ status: "preparing", delayed: true });
    expect(fromLegacyStatus("picked")).toEqual({ status: "out_for_delivery", delayed: false });
    expect(fromLegacyStatus("delivered")).toEqual({ status: "completed", delayed: false });
    expect(fromLegacyStatus("cancelled")).toEqual({ status: "cancelled", delayed: false });
    expect(fromLegacyStatus("ready")).toEqual({ status: "ready", delayed: false });
  });
  it("passes new statuses through", () => {
    expect(fromLegacyStatus("served")).toEqual({ status: "served", delayed: false });
  });
  it("migrates stored rows idempotently", async () => {
    // insert raw rows with status 'picked', 'delivered', 'delayed' via client().execute, run migrate() twice,
    // then expect statuses out_for_delivery / completed / preparing and delayed=1 on the third
  });
  it("accepts a legacy webhook status", async () => {
    // POST to the webhook handler with a valid HMAC and status "picked"; expect 200 and the row stored as out_for_delivery
  });
  it("counts sales for every channel", async () => {
    // insert one completed `web` order of ₹300 today; salesForDay(outlet.id, 0).sales.web equals { amount: 300, orders: 1 }
  });
});
```

`migrate` must be exported from `lib/server/db.ts` for the test. The webhook test calls the exported `POST` with a `Request` built in the test and `WEBHOOK_SECRET` set in `process.env`.

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run tests/server/orders-model.test.ts`
Expected: FAIL (`fromLegacyStatus` not defined)

- [ ] **Step 3: Implement**

- `migrate()` adds the two columns via `COLUMNS`, then runs these updates (each is idempotent): `delayed`→`preparing` with `delayed=1`; `picked`→`out_for_delivery`; `delivered`→`completed`.
- `schema.ts` `orders.channel` and `orders.status` enums use the new unions.
- `IncomingOrder.status` (connectors) and the webhook zod enum accept the union of legacy and new values; `upsertOrders` stores `fromLegacyStatus(...)`. The webhook route's channel param accepts all channels except `web`, `whatsapp` and `phone` (those are created by Zest itself, never pushed in).
- `salesForDay` initialises a zero entry for every channel and counts `completed`, `served` and the in-flight statuses, excluding `rejected` and `cancelled`.
- Orders page: "active" uses `ACTIVE_STATUSES`; the late bar uses `o.delayed`; the channel filter lists the outlet's live platforms, `dine`, and one "Direct" option that matches all three direct channels.
- Today's channel split shows direct channels as one "Direct" segment when any direct sales exist.
- `globals.css`: add `--ch-direct` and `--ch-ondc` for light and dark, checked for 3:1 contrast against `--surface` in both themes like the existing channel tokens.
- Seed: demo orders use the new statuses.

- [ ] **Step 4: Run tests, typecheck and build**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(orders): add direct and ONDC channels and the full order lifecycle, migrating stored statuses"
```

---

### Task 3: Order lines

**Files:**
- Modify: `lib/server/db.ts` (`TABLES`), `lib/server/schema.ts`, `lib/server/dining.ts` (settle), `lib/server/queries.ts` (`orderDTO`), `lib/types.ts` (`OrderDTO`)
- Create: `lib/server/order-lines.ts`
- Test: `tests/server/order-lines.test.ts`

**Interfaces:**
- Produces: table `order_lines(id, order_id, item_id NULL, name, qty, unit_price, options JSON default '[]', line_total)` with index on `order_id`; `type OrderLineInput = { itemId: string | null; name: string; qty: number; unitPrice: number; options?: { group: string; choice: string; priceDelta: number }[] }`; `addOrderLines(orderId: string, lines: OrderLineInput[]): Promise<void>`; `linesFor(orderIds: string[]): Promise<Map<string, OrderLineDTO[]>>`; `OrderDTO.lines?: OrderLineDTO[]`; `summariseLines(lines: OrderLineInput[]): string` (the text kept in `orders.items`).

- [ ] **Step 1: Write the failing tests**

```ts
it("computes line totals including option prices", async () => {
  // addOrderLines(order.id, [{ itemId: null, name: "Thali", qty: 2, unitPrice: 279, options: [{ group: "Extra", choice: "Raita", priceDelta: 40 }] }])
  // linesFor([order.id]).get(order.id)![0].lineTotal === 638
});
it("summarises lines the way the board shows them", () => {
  expect(summariseLines([{ itemId: null, name: "Butter naan", qty: 2, unitPrice: 59 }, { itemId: null, name: "Dal makhani", qty: 1, unitPrice: 249 }]))
    .toBe("2 butter naan, dal makhani");
});
it("rejects zero or negative quantities", async () => {
  await expect(addOrderLines(order.id, [{ itemId: null, name: "x", qty: 0, unitPrice: 10 }])).rejects.toThrow();
});
it("writes lines when a dine-in tab is settled", async () => {
  // seat a party, add 2 dishes, settle by UPI; the created dine order has 2 order_lines whose totals add up to the tab total
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run tests/server/order-lines.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement** the table, the three functions, and the call in dining's settle path (same transaction as the order insert). `getOrders` attaches lines through one `linesFor` query, not one query per order.

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(orders): store order lines, written by dine-in settlement"
```

---

### Task 4: Brands

**Files:**
- Modify: `lib/server/db.ts`, `lib/server/schema.ts`, `lib/server/seed.ts`, `app/api/outlet/route.ts` (POST), `lib/server/queries.ts` (`outletDTO` adds `brandId`), `lib/types.ts`, `tests/helpers.ts`
- Create: `lib/server/brands.ts`
- Test: `tests/server/brands.test.ts`

**Interfaces:**
- Produces: table `brands(id, name, created_at)`; column `outlets.brand_id TEXT` (nullable in SQL, always set after migration); `ensureBrands(): Promise<number>` (creates one brand per outlet that has none, named after the outlet, returns how many); `brandOutlets(brandId: string): Promise<Outlet[]>`; `freshOutlet()` now creates a brand first and returns the outlet with `brandId` set.

- [ ] **Step 1: Write the failing tests**

```ts
it("gives every existing outlet a brand of its own", async () => {
  // insert two outlets with brand_id NULL via raw SQL; await ensureBrands(); both have distinct brand ids; brand names equal outlet names
});
it("is idempotent", async () => { await ensureBrands(); expect(await ensureBrands()).toBe(0); });
it("creates a brand with a new restaurant", async () => {
  // call POST /api/outlet handler as a new owner; returned outlet has a brandId and brandOutlets(brandId) has length 1
});
```

- [ ] **Step 2: Run to verify they fail** — `npx vitest run tests/server/brands.test.ts` → FAIL

- [ ] **Step 3: Implement.** `ready()` calls `ensureBrands()` after `migrate()`. The demo seed creates brand id `DEMO_BRAND_ID` ("Rasoi 27"). Outlet creation inserts the brand and the outlet together.

- [ ] **Step 4: Run tests** — `npm test` → PASS

- [ ] **Step 5: Commit** — `git commit -am "feat: add brands above outlets and backfill one per outlet"`

---

### Task 5: Users, roles, Google sign-in and staff PINs

**Files:**
- Create: `lib/server/rate-limit.ts`, `lib/server/auth.ts`, `lib/server/staff.ts`, `app/api/auth/google/start/route.ts`, `app/api/auth/google/callback/route.ts`, `app/api/auth/pin/route.ts`, `app/api/auth/logout/route.ts`, `app/api/staff/route.ts`, `app/api/staff/[id]/route.ts`, `app/login/page.tsx`, `app/login/staff/page.tsx`, `components/staff-card.tsx`
- Modify: `lib/server/db.ts`, `lib/server/schema.ts`, `lib/server/session.ts`, `lib/server/http.ts`, `lib/server/oauth-state.ts` (a purpose field, so sign-in and Gmail states can't be swapped), `lib/server/approvals.ts` (`decided_by`), every mutating route under `app/api/` (role lists below), `app/join/page.tsx` and `app/start/page.tsx` (continue with Google before the restaurant is created), `app/app/connections/page.tsx` (Staff card), `components/shell.tsx` (signed-in person, sign out), `lib/i18n.ts`, `.env.example`
- Test: `tests/server/auth.test.ts`, `tests/server/staff.test.ts`

**Interfaces:**
- Tables: `users(id, email UNIQUE NULL, phone UNIQUE NULL, name, created_at)`; `memberships(id, user_id, brand_id, role, outlet_ids JSON NULL, pin_hash NULL, active INTEGER DEFAULT 1, created_at)` with `role ∈ owner | manager | kitchen | cashier | rider` and `outlet_ids` NULL meaning every outlet of the brand; `rate_limits(key, window_start, count, PRIMARY KEY(key, window_start))`; columns `outlets.staff_code TEXT UNIQUE` (6 characters from `ABCDEFGHJKMNPQRSTUVWXYZ23456789`, set for every outlet in `migrate()`), `approvals.decided_by TEXT`.
- `checkRate(key: string, limit: number, windowSec: number): Promise<boolean>` (true when allowed; fixed window).
- Google sign-in: `/api/auth/google/start` redirects with scopes `openid email profile` (no Gmail scope) using `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`; the callback checks state, exchanges the code, reads the verified email from the ID token, and calls `signIn`.
- `type SessionUser = { user: UserRow; membership: MembershipRow; outlet: Outlet }`; `currentSession(): Promise<SessionUser | null>`; `signIn(identity: { email: string; name: string }): Promise<SessionUser | null>` (find or create the user; link legacy outlets as below; set cookie `zest_session` = signed `{ userId, membershipId, outletId }`, 30 days); `requireRole(session: SessionUser | null, roles: Role[]): SessionUser` (401 without a session, 403 with the wrong role).
- Staff: `addStaff(brandId: string, input: { name: string; role: "manager" | "kitchen" | "cashier" | "rider"; outletIds: string[] | null; pin: string }): Promise<MembershipRow>` (owner only; PIN is exactly 4 digits and unique among active staff of each of its outlets; stored as HMAC-SHA256 with `ZEST_SECRET_KEY`); `removeStaff(membershipId: string): Promise<void>` (sets `active=0`); `pinSignIn(staffCode: string, pin: string): Promise<SessionUser>` — at most 5 wrong PINs per staff code per 15 minutes (`checkRate("pin:"+staffCode, 5, 900)`), then 429 for the rest of the window; one generic error for a wrong code or PIN. A manager may be given a Google email instead of a PIN.
- `currentSession` re-reads the membership on every request and returns null when it is inactive, so removing a person ends their access on their next request.
- `handler` keeps its signature `(req, outlet, params)` and gains an optional first argument: `handler({ roles: Role[] }, fn)` where `fn` receives `(req, outlet, params, session)`. Without a session, mutating handlers with `roles` refuse with 401, except on the demo outlet where the existing `assertWritable` rule still applies.

**Legacy access (Review Focus 1):** on `signIn`, if the user has no membership: (a) if the browser holds the old `zest_outlet` cookie for an outlet with no owner membership, the user becomes its owner, and that cookie is cleared; (b) otherwise, if a connected mailbox's `address` equals the user's email, the user becomes owner of that mailbox's outlet. A new user with neither goes to `/join`.

**Route roles** (all GET routes: any member; demo: no login):
- owner only: `/api/connections` (POST, DELETE), `/api/mail*` (except GET), `/api/outlet` (PATCH), `/api/outlet/demo` (DELETE), `/api/staff*`
- owner, manager: `/api/approvals/[id]`, `/api/menu/*` writes, `/api/growth/*` writes, `/api/reviews/[id]/reply`, `/api/copilot` (POST, DELETE), `/api/ingest/email`, `/api/onboarding/*`, `/api/dining/tables*`, `/api/sync`
- owner, manager, cashier: `/api/dining/tabs*`, `/api/dining/reservations*`
- system (secret header, unchanged): `/api/cron`, `/api/jobs/run`, `/api/webhooks/*`
- Kitchen and rider roles have no write routes yet; their screens arrive in Phases B and C.

- [ ] **Step 1: Write the failing tests**

```ts
describe("auth", () => {
  it("makes the first signer-in the owner of a cookie-only pilot outlet", async () => {
    // outlet with no memberships; signIn({ email: "a@x.in", name: "A" }) with the old cookie set to it → owner membership on its brand
  });
  it("links an outlet by its connected Gmail address", async () => {
    // mailbox address "owner@x.in" for outlet O; signIn({ email: "owner@x.in", name: "O" }) → owner of O's brand
  });
  it("refuses a kitchen member approving a draft", async () => { /* requireRole(kitchen, ["owner","manager"]) throws status 403 */ });
  it("still serves the demo without a session", async () => { /* GET /api/today, no cookie → demo outlet */ });
  it("refuses a write to a real outlet without a session", async () => { /* POST /api/menu/changes, no session → 401 */ });
  it("rejects a sign-in callback with a Gmail-purpose state", async () => { /* → 400 */ });
});
describe("staff", () => {
  it("signs in with the restaurant code and PIN", async () => { /* addStaff kitchen pin "4821"; pinSignIn(code, "4821") → role kitchen */ });
  it("locks the code after 5 wrong PINs", async () => { /* 5 wrong → 6th with the right PIN rejects with status 429 */ });
  it("ends access when the owner removes the person", async () => { /* removeStaff → currentSession() for that cookie returns null */ });
  it("refuses a duplicate PIN at the same outlet", async () => { /* second addStaff with "4821" throws */ });
});
```

- [ ] **Step 2: Run to verify they fail** — `npx vitest run tests/server/auth.test.ts tests/server/staff.test.ts` → FAIL

- [ ] **Step 3: Implement** the tables, `rate-limit.ts`, `auth.ts`, `staff.ts`, the auth and staff routes, and the role lists on every listed route. `/login` offers "Continue with Google" and a link to `/login/staff` (restaurant code and a PIN pad with large keys for a kitchen tablet). The Staff card on Connections lists people with role and outlets, adds staff with a PIN, shows the restaurant code, and removes staff. Hindi and English throughout. `app/join` and `app/start` ask the owner to continue with Google before the restaurant is created, and the owner membership is created with it. `approve`, `skip` and `undo` record `decided_by`.

- [ ] **Step 4: Run tests, typecheck and build** — `npm test && npx tsc --noEmit && npm run build` → PASS

- [ ] **Step 5: Commit** — `git commit -am "feat(auth): Google sign-in for owners, PIN sign-in for staff, roles per brand, and linking pilot outlets"`

---

### Task 6: Job runner

**Files:**
- Create: `lib/server/jobs.ts`, `lib/server/job-handlers.ts`, `app/api/jobs/run/route.ts`
- Modify: `lib/server/db.ts`, `lib/server/schema.ts`, `app/api/cron/route.ts`, `.github/workflows/sync.yml` (call `/api/jobs/run` as a backup trigger), `README.md` (Scheduling)
- Test: `tests/server/jobs.test.ts`

**Interfaces:**
- Table `jobs(id, kind, payload JSON, run_at, status, attempts, last_error, locked_until, dedupe_key UNIQUE NULL, created_at, finished_at)`, `status ∈ queued | running | done | failed`, index on `(status, run_at)`.
- `enqueue(kind: string, payload: Record<string, unknown>, opts?: { runAt?: Date; dedupeKey?: string }): Promise<JobRow | null>` — returns null when `dedupeKey` already exists.
- `registerHandler(kind: string, fn: (payload: Record<string, unknown>) => Promise<void>): void`.
- `runDueJobs(opts: { limit: number; deadlineMs: number; now?: Date }): Promise<{ ran: number; failed: number }>` — claims due jobs with one `UPDATE … WHERE id IN (SELECT … LIMIT ?) RETURNING *` setting `status='running'` and `locked_until = now + 2 min`; also reclaims `running` jobs whose `locked_until` has passed; on throw: `attempts+1`, `run_at = now + [1, 5, 25, 60][attempts-1] minutes`, back to `queued`; after 5 attempts `failed` with `last_error`.
- `job-handlers.ts` registers `sync.outlet` (calls `syncOutlet`), `mail.sync` (calls `syncMailbox`), `growth.check` (calls `checkCampaigns`). `/api/jobs/run` (CRON_SECRET) enqueues `sync.outlet` for every outlet with a connection with dedupe key `sync:<outletId>:<5-minute bucket>`, then calls `runDueJobs({ limit: 25, deadlineMs: 50_000 })`.
- Driven every minute by the free external cron (cron-job.org, see "Before you start"). `vercel.json` keeps only its daily `/api/cron`, which now enqueues `mail.sync` and `growth.check` per outlet instead of running them inline, then calls `runDueJobs` as a safety net. The GitHub Actions workflow calls `/api/jobs/run` every 15 minutes as a backup trigger.

- [ ] **Step 1: Write the failing tests**

```ts
it("runs a due job once", async () => { /* register "t" handler counting calls; enqueue; runDueJobs twice; count === 1, status done */ });
it("skips jobs not yet due", async () => { /* runAt +10 min → ran 0 */ });
it("dedupes by key", async () => { /* second enqueue with same dedupeKey returns null */ });
it("retries with backoff then fails after 5 attempts", async () => {
  // handler always throws; run, advance time per backoff, run… after 5th: status failed, attempts 5, last_error set
});
it("reclaims a job whose run was cut off", async () => {
  // set a job to running with locked_until in the past; runDueJobs runs it
});
```

- [ ] **Step 2: Run to verify they fail** — `npx vitest run tests/server/jobs.test.ts` → FAIL

- [ ] **Step 3: Implement** the table, runner, handlers, route and config.

- [ ] **Step 4: Run tests** — `npm test` → PASS

- [ ] **Step 5: Commit** — `git commit -am "feat: durable job runner with retries and dedupe, driven by an external per-minute cron"`

---

### Task 7: Live order updates

**Files:**
- Create: `app/api/orders/stream/route.ts`, `lib/use-order-stream.ts`
- Modify: `lib/server/queries.ts` (add `ordersChangedSince`), `app/app/orders/page.tsx`, `app/app/page.tsx` (active-order count)
- Test: `tests/server/order-stream.test.ts`

**Interfaces:**
- `ordersChangedSince(outletId: string, cursor: string | null, limit = 100): Promise<{ orders: OrderDTO[]; cursor: string | null }>` — the cursor is `"<updated_at>|<id>"` of the last row returned; returns orders whose `(updated_at, id)` pair is greater than the cursor's (all of today's when `cursor` is null), ordered by that pair, so rows with the same timestamp are never skipped.
- `GET /api/orders/stream` — `text/event-stream`; reads `Last-Event-ID` as the cursor; every 2 seconds sends `id: <cursor>\nevent: orders\ndata: <JSON OrderDTO[]>\n\n` when there are changes and `: ping` every 15 seconds; ends after 55 seconds (`maxDuration = 60`). Any signed-in member or the demo.
- `useOrderStream(onOrders: (o: OrderDTO[]) => void): { mode: "live" | "polling" }` — `EventSource` (browser reconnects with `Last-Event-ID`); after 2 errors in 30 seconds falls back to polling `GET /api/orders` every 10 seconds and shows "Updating every 10 seconds" on the board.
- `upsertOrders` and every status change set `updated_at` (already true for upserts; confirm for dining settle).

- [ ] **Step 1: Write the failing tests**

```ts
it("returns only orders changed after the cursor", async () => {
  // insert A; c1 = ordersChangedSince(o, null).cursor; insert B; ordersChangedSince(o, c1).orders map id equals [B.id]
});
it("streams a change as an SSE event", async () => {
  // call GET with an AbortController; insert an order; read the body until "event: orders"; abort; the data JSON contains the order id
});
it("orders the same timestamp deterministically", async () => {
  // two orders with identical updated_at; neither is lost across two pages of limit 1 (cursor ties broken by id)
});
```


- [ ] **Step 2: Run to verify they fail** — `npx vitest run tests/server/order-stream.test.ts` → FAIL

- [ ] **Step 3: Implement** the query, the route (read the streaming guide in `node_modules/next/dist/docs/` first), the hook, and the board using the hook to merge changes into its list.

- [ ] **Step 4: Run tests and check by hand.** `npm test` → PASS. Then `npm run dev`, open `/app/orders`, POST a signed webhook order with `curl`, and see it appear within 5 seconds without reloading.

- [ ] **Step 5: Commit** — `git commit -am "feat(orders): live order updates over server-sent events with a polling fallback"`

---

### Task 8: Opening hours

**Files:**
- Create: `lib/hours.ts` (pure, shared by server and client), `lib/server/hours.ts`, `app/api/hours/route.ts`, `components/hours-editor.tsx`
- Modify: `lib/server/db.ts`, `lib/server/schema.ts`, `lib/server/seed.ts`, `app/app/connections/page.tsx` (an "Opening hours" card), `lib/i18n.ts`
- Test: `tests/hours.test.ts`

**Interfaces:**
- Tables: `outlet_hours(outlet_id, weekday 0–6 with 0 = Sunday, opens "HH:MM", closes "HH:MM", channel NULL meaning every channel)`, several rows per day allowed (split shifts); `special_hours(id, outlet_id, date "YYYY-MM-DD", closed boolean, opens, closes, note)`.
- `type WeeklyHours = { weekday: number; opens: string; closes: string; channel?: Channel | null }[]`; `type SpecialHours = { date: string; closed: boolean; opens?: string; closes?: string; note?: string }[]`.
- `isOpenAt(weekly: WeeklyHours, special: SpecialHours, at: Date, channel?: Channel): boolean` — converts `at` to `Asia/Kolkata`; a span with `closes <= opens` runs past midnight and counts on the next calendar day too; a special-hours entry for the IST date replaces that date's weekly spans; channel-specific rows override the `null` rows for that channel.
- `nextChange(weekly, special, at, channel?): { open: boolean; at: Date } | null` — when the state next flips, within 7 days.
- `GET/PUT /api/hours` — `{ weekly, special }`; PUT is owner or manager, validates `HH:MM`, rejects overlapping spans on one day.
- Demo seed: 11:00–23:30 every day.

- [ ] **Step 1: Write the failing tests**

```ts
const IST = (s: string) => new Date(s + "+05:30");
const late: WeeklyHours = [0,1,2,3,4,5,6].map((d) => ({ weekday: d, opens: "18:00", closes: "02:00" }));
it("is open at 1:30 am after an overnight span", () => expect(isOpenAt(late, [], IST("2026-10-22T01:30:00"))).toBe(true));
it("is closed at 2:00 am exactly", () => expect(isOpenAt(late, [], IST("2026-10-22T02:00:00"))).toBe(false));
it("honours a holiday closure", () =>
  expect(isOpenAt(late, [{ date: "2026-11-08", closed: true }], IST("2026-11-08T19:00:00"))).toBe(false));
it("uses special hours instead of the week", () =>
  expect(isOpenAt(late, [{ date: "2026-11-08", closed: false, opens: "11:00", closes: "18:00" }], IST("2026-11-08T12:00:00"))).toBe(true));
it("lets a channel close earlier", () => {
  const h: WeeklyHours = [...late, ...[0,1,2,3,4,5,6].map((d) => ({ weekday: d, opens: "18:00", closes: "23:00", channel: "web" as const }))];
  expect(isOpenAt(h, [], IST("2026-10-22T23:30:00"), "web")).toBe(false);
  expect(isOpenAt(h, [], IST("2026-10-22T23:30:00"), "dine")).toBe(true);
});
it("finds the next opening", () => expect(nextChange(late, [], IST("2026-10-22T03:00:00"))).toEqual({ open: true, at: IST("2026-10-22T18:00:00") }));
```

- [ ] **Step 2: Run to verify they fail** — `npx vitest run tests/hours.test.ts` → FAIL

- [ ] **Step 3: Implement** the logic (use `Intl.DateTimeFormat` with `timeZone: "Asia/Kolkata"`; no date library), tables, API, seed and the editor card (a row per weekday with one or two spans, a "Closed" toggle, and a list of special dates).

- [ ] **Step 4: Run tests** — `npm test` → PASS

- [ ] **Step 5: Commit** — `git commit -am "feat: opening hours with overnight spans, special dates and per-channel overrides"`

---

### Task 9: Consent ledger

**Files:**
- Create: `lib/server/consent.ts`
- Modify: `lib/server/db.ts`, `lib/server/schema.ts`
- Test: `tests/server/consent.test.ts`

**Interfaces:**
- Table `consents(id, brand_id, phone, purpose, granted, wording, source, actor, created_at)`, append-only (no update or delete paths in code), index on `(brand_id, phone, purpose, created_at)`; `purpose ∈ whatsapp_marketing | sms_marketing | whatsapp_transactional`.
- `recordConsent(input: { brandId: string; phone: string; purpose: ConsentPurpose; granted: boolean; wording: string; source: string; actor: string }): Promise<void>` — `wording` is required and non-empty (the exact text the person saw); phone normalised as in Task 5.
- `hasConsent(brandId: string, phone: string, purpose: ConsentPurpose): Promise<boolean>` — the latest row decides; no rows means false.
- `optOutAll(brandId: string, phone: string, source: string): Promise<void>` — writes `granted=false` for both marketing purposes (not transactional).
- `isStopMessage(text: string): boolean` — true for `STOP`, `stop`, `Stop.`, `UNSUBSCRIBE`, `रुको`, `बंद करो` (trimmed, case-insensitive, trailing punctuation ignored).

- [ ] **Step 1: Write the failing tests**

```ts
it("is false with no record", async () => expect(await hasConsent(b, "+919800000001", "whatsapp_marketing")).toBe(false));
it("latest record wins", async () => { /* grant, then withdraw → false; grant again → true */ });
it("opt-out leaves transactional alone", async () => { /* grant transactional + marketing; optOutAll; marketing false, transactional true */ });
it("refuses a record without wording", async () => { await expect(recordConsent({ ...base, wording: "" })).rejects.toThrow(); });
it("recognises stop words", () => {
  for (const s of ["STOP", " stop. ", "Unsubscribe", "बंद करो"]) expect(isStopMessage(s)).toBe(true);
  expect(isStopMessage("stop the biryani")).toBe(false);
});
```

- [ ] **Step 2: Run to verify they fail** — `npx vitest run tests/server/consent.test.ts` → FAIL

- [ ] **Step 3: Implement.**

- [ ] **Step 4: Run tests** — `npm test` → PASS

- [ ] **Step 5: Commit** — `git commit -am "feat: append-only consent ledger per brand"`

---

### Task 10: Copilot eval harness

**Files:**
- Create: `evals/copilot/*.json` (one file per agent: `finance`, `reviews`, `menu`, `orders`, `growth`), `evals/run.ts`, `tests/evals.test.ts`
- Modify: `package.json` (script `eval` = `tsx evals/run.ts`; devDependency `tsx`), `.github/workflows/ci.yml` (rules evals run inside `npm test`)

**Interfaces:**
- Case shape: `{ "id": string, "message": string, "uiLang": "en" | "hi", "expect": { "agent": Agent, "replyLang": "en" | "hi", "approvalKinds"?: ApprovalKind[], "cardTypes"?: CopilotCard["type"][], "mentions"?: string[] } }`.
- `runCase(c: EvalCase, engine: "rules" | "claude"): Promise<{ id: string; pass: boolean; failures: string[] }>` — runs `runCopilot` against a fresh copy of the demo restaurant (`freshDemoCopy(): Promise<Outlet>` in `evals/run.ts`: `freshOutlet()` with the demo's name, area and live platforms, then `seedRestaurantData(outlet.id)` from `lib/server/seed.ts`) so approvals from one case don't leak into another.
- At least 10 cases per agent, of which at least 3 are in Hindi (Devanagari) and 3 in Hinglish.
- `tests/evals.test.ts` runs every case with `engine: "rules"` (deterministic, in CI). `npm run eval` runs every case with `engine: "claude"` when `ANTHROPIC_API_KEY` is set and prints a pass table; it exits non-zero below 90% pass.

- [ ] **Step 1: Write the cases and the failing test** (`tests/evals.test.ts` iterates the JSON files and expects `pass` for each under `rules`).

Examples to include verbatim:
```json
{ "id": "finance-hinglish-1", "message": "swiggy ka paisa kam kyun aaya is hafte", "uiLang": "en",
  "expect": { "agent": "finance", "replyLang": "hi", "cardTypes": ["payout"] } }
{ "id": "menu-hi-1", "message": "पनीर ख़त्म है, पनीर वाली डिश बंद करो", "uiLang": "en",
  "expect": { "agent": "menu", "replyLang": "hi", "approvalKinds": ["menu_change"], "mentions": ["Paneer"] } }
```

- [ ] **Step 2: Run to verify it fails** — `npx vitest run tests/evals.test.ts` → FAIL (no runner)

- [ ] **Step 3: Implement** the runner. If a rules case fails because the keyword rules are wrong, fix the rule in `lib/server/copilot.ts` rather than the case, unless the case expects behaviour the spec doesn't ask for.

- [ ] **Step 4: Run** — `npm test` → PASS; with a key, `npm run eval` → at least 90% pass, with failures listed for prompt work.

- [ ] **Step 5: Commit** — `git commit -am "test: golden copilot conversations in Hindi, English and Hinglish"`

---

### Task 11: Ops basics

**Files:**
- Create: `instrumentation.ts`, `sentry.server.config.ts`, `sentry.client.config.ts`, `docs/ops.md`
- Modify: `next.config.ts` (Sentry wrapper), `app/api/copilot/route.ts` and `app/api/listing/preview/route.ts` (rate limits), `.env.example`, `package.json`
- Test: `tests/server/rate-limits.test.ts`

**Interfaces:**
- Consumes: `checkRate` (Task 5).
- Copilot POST: 20 messages per outlet per minute (`copilot:<outletId>`), else 429 with a Hindi/English message.
- Listing preview POST: 10 per IP per hour (`listing:<ip>`; IP from `x-forwarded-for` first entry).
- Sentry: errors from route handlers and the browser, with `beforeSend` removing phone numbers (`/\+?91\d{10}/g` → `[phone]`) and request bodies. Free Developer plan; disabled when `SENTRY_DSN` is unset, so nothing breaks without an account.
- `docs/ops.md`: how to restore the Turso database to a point in time, the env vars and secrets list with owners, the cron and job runner, and how to read the failed-jobs list (`SELECT … FROM jobs WHERE status='failed'`).

- [ ] **Step 1: Write the failing tests**

```ts
it("allows 20 copilot messages a minute and refuses the 21st", async () => { /* call POST handler 21 times; last status 429 */ });
it("scrubs phone numbers before sending to Sentry", () => {
  expect(scrubEvent({ message: "OTP for +919876543210 failed" }).message).toBe("OTP for [phone] failed");
});
```

`scrubEvent` is exported from `sentry.server.config.ts` for the test.

- [ ] **Step 2: Run to verify they fail** — `npx vitest run tests/server/rate-limits.test.ts` → FAIL

- [ ] **Step 3: Implement.**

- [ ] **Step 4: Run everything** — `npm test && npx tsc --noEmit && npm run build` → PASS

- [ ] **Step 5: Commit** — `git commit -am "chore: Sentry with phone scrubbing, rate limits on copilot and listing preview, ops notes"`

---

## Exit check for Phase A (spec §13)

- [ ] Every existing screen works on the new order model: Today, Orders, Menu, Reviews, Money, Dining, Growth, Connections, the copilot, and `/m/[outletId]` (click through in `npm run dev` on the demo and on a newly created restaurant).
- [ ] Tests run in CI on every push.
- [ ] Owners sign in with Google and staff with a PIN; a pilot outlet created before the change is reachable by its owner.
- [ ] cron-job.org calls `/api/jobs/run` every minute and `jobs` shows `sync.outlet` runs completing.
- [ ] Owner actions from "Before you start" are done.

## Next plans

Write after Phase A merges, each from spec §7 and §13: Phase B (storefront, variants and add-ons, UPI-link payments, order hub and kitchen screen, phone orders, GST receipts, customers), then C to F.
