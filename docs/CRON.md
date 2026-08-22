# Cron jobs

This app needs an **external wake-up**. Collecting news from ~70 countries takes minutes. Serverless Next.js (Vercel) sleeps between requests, so in-process `node-cron` is only a backup on a long-lived host.

Timezone is `APP_TIMEZONE` (default `Asia/Kuwait`). Collect runs **three times daily**: 06:00, 14:00, 22:00 Kuwait (03:00, 11:00, 19:00 UTC).

## How we run cron (pick the host)

| Host | Mechanism | What to configure |
|------|-----------|-------------------|
| **Vercel** | `vercel.json` → collect and translate HTTP routes | Daily backups: collect at 07:00 Kuwait (`0 4 * * *` UTC), translate at 23:00 Kuwait (`0 20 * * *` UTC). Set `CRON_SECRET`. |
| **DigitalOcean / other VPS** | In-process `node-cron` via `src/instrumentation.ts` | `npm start` or `npm run worker:live` on a process that stays up. Do **not** set `VERCEL`. |
| **Any host (recommended)** | GitHub Actions `.github/workflows/collect.yml` | Secrets `DATABASE_URL` + `DIRECT_URL` (preferred) or `CRON_SECRET`/`ADMIN_API_KEY` + `SITE_URL` to HTTP-call `/api/cron/collect`. |

GitHub Actions is the primary 3× daily runner. The workflow splits **collect** (ingest + edition, up to 90 min) and **translate** (drain all pending ar/en pairs, up to 90 min) so neither step hits the old 45-minute ceiling. Vercel Cron and node-cron are backups. The DB job lock (45 minutes, matching each Actions step budget) prevents duplicate work if two runners overlap.

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
| `collect` | `0 6,14,22 * * *` | Vercel Cron, GitHub Actions, node-cron on VPS |
| `translate` | `*/15 * * * *` | Vercel daily backup and node-cron on VPS; collect also drains pending translations |
| `publish-daily` | `0 6 * * *` | node-cron on VPS; collect also refreshes today's edition |

On Vercel, `node-cron` does **not** start (`VERCEL=1`). Set `ENABLE_EMBEDDED_SCHEDULER=true` only if you are sure the Node process never sleeps.

Set `CRON_SECRET` in the Vercel project env. Vercel Cron sends `Authorization: Bearer $CRON_SECRET` to the configured routes. Without that secret scheduled runs return 401.

## GitHub Actions secrets

| Secret | Required | Purpose |
|--------|----------|---------|
| `DATABASE_URL` | Yes (preferred) | Run the pipeline in the Actions runner (no Vercel timeout) |
| `DIRECT_URL` | With `DATABASE_URL` | Prisma session URL |
| `GOOGLE_API_KEY` | Yes | Translate during collect |
| `CRON_SECRET` or `ADMIN_API_KEY` | HTTP fallback | If `DATABASE_URL` is missing, POST `/api/cron/collect` |
| `SITE_URL` | HTTP fallback | Defaults to `https://www.brieflynewsstream.com` |

The workflow timeout is **180 minutes** (`timeout-minutes` in `.github/workflows/collect.yml`). A 45-minute cap was cancelling every scheduled run before collect could finish ~949 sources. If runs still approach the limit, raise `COLLECT_CONCURRENCY` (default `8` in Actions) or split collection across more frequent smaller runs.

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
