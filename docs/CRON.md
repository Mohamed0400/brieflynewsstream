# Cron jobs

This app needs an **external wake-up**. Collecting news from ~70 countries takes minutes. Serverless Next.js (Vercel) sleeps between requests, so in-process `node-cron` is only a backup on a long-lived host.

Timezone is `APP_TIMEZONE` (default `Asia/Kuwait`). Collect runs **three times daily**: 06:00, 14:00, 22:00 Kuwait (03:00, 11:00, 19:00 UTC).

## How we run cron (pick the host)

| Host | Mechanism | What to configure |
|------|-----------|-------------------|
| **Vercel** | `vercel.json` → `GET /api/cron/collect` | Hobby allows **one** daily cron (`0 3 * * *`, 06:00 Kuwait). Set `CRON_SECRET`. GitHub Actions still covers 06:00, 14:00, and 22:00. |
| **DigitalOcean / other VPS** | In-process `node-cron` via `src/instrumentation.ts` | `npm start` or `npm run worker:live` on a process that stays up. Do **not** set `VERCEL`. |
| **Any host (recommended)** | GitHub Actions `.github/workflows/collect.yml` | Secrets `DATABASE_URL` + `DIRECT_URL` (preferred) or `CRON_SECRET`/`ADMIN_API_KEY` + `SITE_URL` to HTTP-call `/api/cron/collect`. |

GitHub Actions is the guaranteed 3× daily runner. Vercel Cron and node-cron are extras. The DB job lock prevents a double collect if two of them fire at once.

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
| `translate` | `*/15 * * * *` | node-cron on VPS only (collect already translates) |
| `publish-daily` | `0 6 * * *` | node-cron on VPS; collect also refreshes today's edition |

On Vercel, `node-cron` does **not** start (`VERCEL=1`). Set `ENABLE_EMBEDDED_SCHEDULER=true` only if you are sure the Node process never sleeps.

Set `CRON_SECRET` in the Vercel project env. Vercel Cron sends `Authorization: Bearer $CRON_SECRET` to `GET /api/cron/collect`. Without that secret the scheduled run returns 401.

## GitHub Actions secrets

| Secret | Required | Purpose |
|--------|----------|---------|
| `DATABASE_URL` | Yes (preferred) | Run the pipeline in the Actions runner (no Vercel timeout) |
| `DIRECT_URL` | With `DATABASE_URL` | Prisma session URL |
| `GOOGLE_API_KEY` | No | Translate during collect |
| `CRON_SECRET` or `ADMIN_API_KEY` | HTTP fallback | If `DATABASE_URL` is missing, POST `/api/cron/collect` |
| `SITE_URL` | HTTP fallback | Defaults to `https://www.brieflynewsstream.com` |

After adding secrets: **Actions → Collect news → Run workflow** once. Then leave the schedule on. You do not need Console → Run now.

## Coverage floor

Each collect run upserts publisher + Google News sources for all catalog countries, fetches them in parallel, then fills any country still below `MIN_COUNTRY_ARTICLES` (default 3) in the last 72 hours.

## Bilingual contract

A stored article is complete only when English title/summary are Latin and Arabic title/summary contain Arabic script. Collect translates after ingest. The translate route catches leftovers.

## Production checks

`GET /api/v1/health` (no API key):

- `jobs`: `collect`, `translate`, `publish-daily` exist and are enabled
- `bilingual.today` / `bilingual.fresh`: every article in the window has real `ar` and `en`
- On Vercel, `checks.scheduler` is often `offline`. That is expected. GitHub/Vercel HTTP collect still writes articles.

```bash
BASE_URL="https://www.brieflynewsstream.com" npm run smoke
```
