# Cron jobs

**Schedule of record:** [CRONJOBS.md](./CRONJOBS.md) (who runs, at what hour, GitHub minutes). This page is the implementation detail.

This app needs an **external wake-up**. Collecting news from ~70 countries takes minutes. Serverless Next.js (Vercel) sleeps between requests, so in-process `node-cron` is only a backup on a long-lived host.

Timezone is `APP_TIMEZONE` (default `Asia/Kuwait`). Three hosts wake collect at **different hours** so they do not overlap locks or burn the same GitHub minutes:

| Kuwait | UTC | Host | What |
|--------|-----|------|------|
| 07:00 | 04:00 | **Vercel Cron** | HTTP `/api/cron/collect` (short serverless backup) |
| 14:00 | 11:00 | **cron-job.org** | HTTP `/api/cron/collect` — set this time in their dashboard |
| 22:00 | 19:00 | **GitHub Actions** | Full database pipeline (the long run, once a day) |
| 23:00 | 20:00 | **Vercel Cron** | HTTP `/api/cron/translate` backfill |

GitHub Actions used to run 3× daily plus an hourly self-heal. That burned the 2,000 included minutes. One evening collect is enough; Vercel and cron-job.org cover the other two slots.

## How we run cron (pick the host)

| Host | Mechanism | What to configure |
|------|-----------|-------------------|
| **Vercel** | `vercel.json` → collect and translate HTTP routes | Collect at 07:00 Kuwait (`0 4 * * *` UTC), translate at 23:00 Kuwait (`0 20 * * *` UTC). Set `CRON_SECRET`. |
| **cron-job.org** | HTTP GET/POST to `/api/cron/collect` | Once daily at **14:00 Kuwait (11:00 UTC)**. Header `Authorization: Bearer $CRON_SECRET`. |
| **DigitalOcean / other VPS** | pg-boss durable worker via `npm run worker:live` | Set `DATABASE_URL` or preferably `DIRECT_URL`, then keep one worker process running. |
| **GitHub Actions** | `.github/workflows/collect.yml` | Once daily at 22:00 Kuwait. Secrets `DATABASE_URL` + `DIRECT_URL` (preferred) or `CRON_SECRET`/`ADMIN_API_KEY` + `SITE_URL` for HTTP collect. |

GitHub Actions is the one long collect (ingest + translate + edition, up to 180 min). Do not add hourly or extra daily GHA crons — they consume Actions minutes even when collect is already fresh. Vercel Cron and cron-job.org are the other two daily wakes. The DB job lock lasts at least 3 hours, is stamped with `lastRunAt` at claim time, and is heartbeat-extended every 60s. Health checks upsert missing jobs only — they do not clear live locks.

Vercel currently allows up to 100 cron jobs per project on Hobby and Pro. Hobby restricts each job to once daily with hour-level timing; Pro supports once-per-minute schedules with minute-level timing. The two daily backup jobs above work on Hobby. See [Vercel Cron usage and pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing).

## HTTP routes

Vercel and any external cron (cron-job.org, Cloudflare Workers, curl) call these. GET or POST. Auth is `Authorization: Bearer $CRON_SECRET` or `X-API-Key: $ADMIN_API_KEY`.

| Path | Job |
|------|-----|
| `/api/cron/collect` | Fetch every country source, fill markets below 3 stories, translate, refresh today's edition |
| `/api/cron/translate` | Backfill missing `ar`/`en` pairs |
| `/api/cron/publish` | Rebuild `/today` |
| `/api/v1/admin/collect` | Same as `/api/cron/collect` (console / admin alias) |

```bash
curl -X GET "https://www.brieflynewsstream.com/api/cron/collect" \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Jobs stored in the database

| Key | Default cron | Used by |
|-----|--------------|---------|
| `collect` | `0 6,14,22 * * *` | Staggered external wakes (Vercel 07:00, cron-job.org 14:00, GitHub 22:00 Kuwait); pg-boss worker if running |
| `translate` | `*/15 * * * *` | pg-boss worker; Vercel daily backup; collect also drains pending translations |
| `publish-daily` | `0 6 * * *` | pg-boss worker; collect also refreshes today's edition |

On Vercel, `node-cron` does **not** start (`VERCEL=1`). Set `ENABLE_EMBEDDED_SCHEDULER=true` only if you are sure the Node process never sleeps.

## Celery-like (Node)

The long-lived Node worker uses **pg-boss**. This was chosen over Redis-backed queues because it gives Celery-like durable jobs, retries, and cron schedules while using the existing Supabase Postgres database. No Redis service is required.

pg-boss stores its own queue tables in the `pgboss` schema by default and schedules these queues in `APP_TIMEZONE` (default `Asia/Kuwait`):

| Queue | Schedule |
|-------|----------|
| `brieflynewsstream.collect` | `0 6,14,22 * * *` |
| `brieflynewsstream.translate` | `*/15 * * * *` |
| `brieflynewsstream.publish-daily` | `0 6 * * *` |

Run it on a long-lived host:

```bash
npm run worker:live
```

For a host without `.env.live`, set env directly and run:

```bash
APP_TIMEZONE=Asia/Kuwait \
PG_BOSS_DATABASE_URL="$DIRECT_URL" \
npm run worker:boss
```

`PG_BOSS_DATABASE_URL` is optional; the worker falls back to `DIRECT_URL`, then `DATABASE_URL`. Prefer a direct Supabase Postgres URL because pg-boss creates/migrates its own schema and benefits from normal Postgres sessions. Override the schema with `PG_BOSS_SCHEMA` only if you need a non-default schema.

The pg-boss worker does **not** bypass existing app locks. Every queued job calls `runScheduledJob(key)`, so the `ScheduledJob.lockedUntil` semantics still prevent duplicate collect/translate/publish work when GitHub Actions, Vercel Cron, HTTP calls, and the worker overlap.

Legacy in-process `node-cron` is still available for local/VPS debugging:

```bash
npm run worker:cron:live
```

Set `CRON_SECRET` in the Vercel project env. Vercel Cron sends `Authorization: Bearer $CRON_SECRET` to the configured routes. Without that secret scheduled runs return 401.

## GitHub Actions secrets

| Secret | Required | Purpose |
|--------|----------|---------|
| `DATABASE_URL` | Yes (preferred) | Run the pipeline in the Actions runner (no Vercel timeout) |
| `DIRECT_URL` | With `DATABASE_URL` | Prisma session URL |
| `GOOGLE_API_KEY` | Yes | Translate during collect |
| `CRON_SECRET` or `ADMIN_API_KEY` | HTTP fallback | If `DATABASE_URL` is missing, POST `/api/cron/collect` |
| `SITE_URL` | HTTP fallback | Defaults to `https://www.brieflynewsstream.com` |

The workflow timeout is **180 minutes** (`timeout-minutes` in `.github/workflows/collect.yml`). A 45-minute cap was cancelling runs before collect could finish ~949 sources. GitHub runs this **once per day** to stay inside the 2,000 included Actions minutes. Vercel and cron-job.org cover the other two daily slots.

After adding secrets: **Actions → Collect news → Run workflow** once. Then leave the schedule on. You do not need Console → Run now.

## Coverage floor

Each collect run upserts publisher + Google News sources for all catalog countries, fetches them in parallel, then fills any country still below `MIN_COUNTRY_ARTICLES` (default 3) in the last 72 hours.

## Bilingual contract

A stored article is complete only when English title/summary are Latin and Arabic title/summary contain Arabic script. Collect translates after ingest and repeats bounded batches until no fresh article remains, translation makes no progress, or the safety limit is reached. The daily translate route catches leftovers.

## Production checks

`GET /api/v1/health` (no API key):

- `jobs`: `collect`, `translate`, `publish-daily` exist and are enabled
- `bilingual.today` / `bilingual.fresh`: every article in the window has real `ar` and `en`
- On Vercel, `checks.scheduler` is `external`; this is healthy because GitHub Actions and Vercel Cron invoke the jobs. `offline` means an expected embedded scheduler is not running.

```bash
BASE_URL="https://www.brieflynewsstream.com" npm run smoke
```
