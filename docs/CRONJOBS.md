# CRONJOBS

How Briefly NewsStream wakes news collect, translate, and publish.

Timezone is **Asia/Kuwait** (`APP_TIMEZONE`, UTC+3). The site on Vercel does **not** run cron inside the Node process. Something outside must call the app, or GitHub must run the pipeline.

Three hosts do that work at **different hours**. They must not share the same clock, or they fight the same database lock and GitHub burns extra Actions minutes.

Implementation notes (locks, pg-boss, bilingual checks): [CRON.md](./CRON.md).

---

## Daily schedule (source of truth)

| Kuwait | UTC | Host | Job | Kind |
|--------|-----|------|-----|------|
| 07:00 | 04:00 | **Vercel Cron** | `GET /api/cron/collect` | Short HTTP. Hobby functions often time out before a full country pass. Backup only. |
| 14:00 | 11:00 | **cron-job.org** | `GET` or `POST /api/cron/collect` | Short HTTP. Set this time in the cron-job.org dashboard. |
| 22:00 | 19:00 | **GitHub Actions** | Workflow `Collect news` | **The long run.** Ingest + translate + today’s edition on a 180-minute runner. Once per day. |
| 23:00 | 20:00 | **Vercel Cron** | `GET /api/cron/translate` | HTTP backfill for leftover `ar` / `en` pairs after the evening collect. |
| 03:30 | 00:30 | **Vercel Cron** | `GET /api/cron/archive` | Prune Supabase older than `ARCHIVE_HOT_RETENTION_DAYS` (default 5). Optional R2 upload — [R2-CLOUDFLARE-SETUP.md](./R2-CLOUDFLARE-SETUP.md). |

Do not add a GitHub hourly job. Do not run GitHub collect three times a day. That is what used up the 2,000 included Actions minutes.

---

## Why three hosts

| Host | Strength | Limit |
|------|----------|--------|
| **GitHub Actions** | Can run 40–180 minutes. This is the only reliable full collect. | **Public repos:** standard Linux runners are free (no private-minute bill). **Private repos:** free plan is **2,000 minutes / month**; extras bill unless spending limit is $0. |
| **Vercel Cron** | Always on with the deploy. No GitHub minutes. | Hobby: about one run per path per day, hour-level timing. Serverless timeout is too short for a full collect. |
| **cron-job.org** | Free HTTP ping. No GitHub minutes. | Same Vercel timeout as Vercel Cron. Use it as a midday refresh, not as the full pipeline. |

This repo is **public**, so the daily GitHub collect should not hit the private-repo Actions spending limit again. Keep the schedule staggered (once daily on GitHub) so runs stay short and do not overlap locks.

If GitHub Actions is ever disabled, **the website and API stay up**. Midday Vercel / cron-job.org HTTP collect still refreshes what it can within the serverless timeout.

CI (typecheck, tests, build on push) also uses Actions minutes. Collect is the expensive one.

---

## GitHub Actions

File: `.github/workflows/collect.yml`

- Trigger: `0 19 * * *` UTC = **22:00 Kuwait**, plus **Run workflow** in the Actions UI.
- Timeout: 180 minutes.
- One job: collect (ingest, translate, edition). No second 90-minute translate job.
- Needs secrets: `DATABASE_URL`, `DIRECT_URL`, `GOOGLE_API_KEY`. Optional: `CRON_SECRET` / `ADMIN_API_KEY` / `SITE_URL` for HTTP fallback if `DATABASE_URL` is missing.

After changing the workflow, it only applies once it is on `main`.

Do **not** re-enable:

- `20 * * * *` hourly `--if-stale` (starts a runner even when collect is already fresh)
- Extra daily crons at 03:00 or 11:00 UTC

---

## Vercel Cron

File: `vercel.json`

```json
{
  "crons": [
    { "path": "/api/cron/collect", "schedule": "0 4 * * *" },
    { "path": "/api/cron/archive", "schedule": "30 0 * * *" },
    { "path": "/api/cron/translate", "schedule": "0 20 * * *" }
  ]
}
```

Set `CRON_SECRET` on the Vercel project. Vercel sends `Authorization: Bearer $CRON_SECRET`. Without it, scheduled hits return 401.

Hobby: one collect per day and one translate per day is the intended shape. Do not stack more Vercel crons on the same hour as GitHub or cron-job.org.

---

## cron-job.org

This is **not** in the repo. You configure it in their dashboard.

| Field | Value |
|-------|--------|
| URL | `https://www.brieflynewsstream.com/api/cron/collect` |
| Method | GET or POST |
| Header | `Authorization: Bearer <CRON_SECRET>` |
| Schedule | **Once daily, 14:00 Asia/Kuwait** (11:00 UTC) |
| Timezone | Asia/Kuwait |

If the job still uses the old GitHub times (06:00, 14:00, and 22:00), delete the extra times. Keep **only 14:00**.

---

## HTTP routes

Auth: `Authorization: Bearer $CRON_SECRET` or `X-API-Key: $ADMIN_API_KEY`.

| Path | What it does |
|------|----------------|
| `/api/cron/collect` | Fetch sources, fill countries below 3 stories, translate, refresh today’s edition |
| `/api/cron/translate` | Backfill missing Arabic / English pairs |
| `/api/cron/publish` | Rebuild `/today` |
| `/api/v1/admin/collect` | Same as collect (console / admin) |

```bash
curl -X GET "https://www.brieflynewsstream.com/api/cron/collect" \
  -H "Authorization: Bearer $CRON_SECRET"
```

Manual collect: GitHub → **Actions → Collect news → Run workflow**, or Console → Schedule → Run.

---

## Locks

Only one collect should run at a time. `ScheduledJob.lockedUntil` lasts **4 hours**, with a heartbeat every 60 seconds.

That is why the three hosts are hours apart (07:00 / 14:00 / 22:00). If two fire together, the second is skipped or waits on the lock.

Health (`GET /api/v1/health`) does **not** steal a live lock.

---

## Optional: long-lived worker

Not required in production if the three HTTP/GHA wakes above are running.

On a VPS: `npm run worker:live` (pg-boss on Postgres). Default queues still list 06:00 / 14:00 / 22:00 Kuwait for collect — do **not** also run that worker if GitHub + Vercel + cron-job.org are already covering those hours, or you will double-run.

---

## Checklist

- [ ] Vercel `CRON_SECRET` set; crons in `vercel.json` unchanged (07:00 collect, 23:00 translate Kuwait)
- [ ] cron-job.org: one job at **14:00 Kuwait** with Bearer `CRON_SECRET`
- [ ] GitHub secrets `DATABASE_URL`, `DIRECT_URL`, `GOOGLE_API_KEY`
- [ ] GitHub workflow on `main` with a **single** `0 19 * * *` schedule
- [ ] GitHub Actions spending limit $0 if you do not want overage bills
- [ ] After a collect: `GET https://www.brieflynewsstream.com/api/v1/health`

```bash
BASE_URL="https://www.brieflynewsstream.com" npm run smoke
```
