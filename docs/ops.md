# Running Zest

## Settings and secrets

Set in Vercel → Project → Settings → Environment Variables. Values never go in the repository.

| Name | What it does | Without it |
|---|---|---|
| `DATABASE_URL`, `DATABASE_AUTH_TOKEN` | Turso database | A temporary database that resets on restart |
| `ZEST_SECRET_KEY` | Encrypts stored credentials, signs sessions, hashes staff PINs | Production refuses to start. Changing it signs everyone out, makes stored platform credentials unreadable, and invalidates every staff PIN |
| `CRON_SECRET` | Lets the schedulers call `/api/jobs/run` and `/api/cron` | Background jobs never run |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Gmail connection and "Continue with Google" sign-in | Owners can't sign in in production (development has a test sign-in) |
| `ANTHROPIC_API_KEY` | Full copilot, document and menu reading, `npm run eval` | Copilot answers with keyword rules |
| `WEBHOOK_SECRET` | Signed order webhooks | Webhooks are refused |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | Error reports (server, browser) | No error reports |
| `LISTING_FETCH_VIA` | Scraping relay for Zomato listing reads | Owners type their details by hand |
| `WHATSAPP_*` | WhatsApp Cloud API | Messages stay queued in the outbox |

### Still to set up (placeholders)

- **Google sign-in redirect.** In the Google Cloud OAuth client used for Gmail, add `https://zest-dusky.vercel.app/api/auth/google/callback` as an authorised redirect URI. Until then owners can't sign in on production, so don't deploy the sign-in change before this is done.
- **Per-minute scheduler.** In cron-job.org, add a job that calls `GET https://zest-dusky.vercel.app/api/jobs/run` every minute with the header `Authorization: Bearer <CRON_SECRET>`. Also set the `ZEST_URL` and `CRON_SECRET` repository secrets in GitHub so the 15-minute backup trigger runs.
- **Sentry.** Create a project on the free Developer plan and set both DSN variables.
- **Claude.** Add `ANTHROPIC_API_KEY` with a monthly spend limit in the Anthropic console, then run `npm run eval` and expect at least 90%.

## Sign-in

- Owners and managers use Google. The first Google sign-in from a browser that started a restaurant before sign-in existed, or with the Gmail address connected to a restaurant, becomes that restaurant's owner.
- Kitchen, cashier and rider staff sign in at `/login/staff` with the restaurant code (Connections → Staff) and their 4-digit PIN. Five wrong PINs lock the code for 15 minutes. Removing a person ends their access on their next request.

## Background jobs

- `/api/jobs/run` (every minute) queues an order sync per connected outlet every 5 minutes and runs due jobs for up to 50 seconds.
- `/api/cron` (daily, Vercel Cron) queues inbox syncs and campaign checks.
- A job that throws is retried after 1, 5, 25 and 60 minutes, then marked failed. A job cut off mid-run is picked up again once its 2-minute lock passes.

Failed jobs, newest first:

```sql
SELECT kind, payload, attempts, last_error, finished_at FROM jobs WHERE status = 'failed' ORDER BY finished_at DESC LIMIT 50;
```

Retry one by setting it back to queued:

```sql
UPDATE jobs SET status = 'queued', attempts = 0, run_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = '<id>';
```

## Backups and restore

Turso keeps point-in-time history for each database; how far back depends on the plan. To restore, create a new database from a moment before the problem, check it, then point `DATABASE_URL` at it:

```bash
turso db create zest-restored --from-db zest --timestamp 2026-10-21T09:00:00Z
turso db shell zest-restored "SELECT COUNT(*) FROM orders"
```

Then update `DATABASE_URL` and `DATABASE_AUTH_TOKEN` in Vercel and redeploy. Keep the old database until the restored one is confirmed.

## Rate limits

| What | Limit |
|---|---|
| Copilot messages | 20 a minute per restaurant (per address on the sample restaurant) |
| Listing previews (sign-up form) | 10 an hour per address |
| Staff PIN attempts | 5 wrong a quarter-hour per restaurant code |

Counters live in the `rate_limits` table, one row per key per window. Old rows are harmless; clear them with `DELETE FROM rate_limits WHERE window_start < strftime('%s','now') - 86400`.

## Local development

The dev database lives in `.data/`, which `.gitignore` covers. If you move it (`ZEST_DATA_DIR`) or write log files, keep them outside the repository or in a folder listed in `.gitignore`; otherwise the dev server's file watcher sees every write and reloads the page in a loop.
