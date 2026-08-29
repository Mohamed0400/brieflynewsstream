# CRONJOBS

How Briefly NewsStream wakes news collect, translate, publish, and auto-heal.

Timezone is **Asia/Kuwait** (`APP_TIMEZONE`, UTC+3). The site on Vercel does **not** run cron inside the Node process. Something outside must call the app, or GitHub must run the pipeline.

Implementation notes (locks, pg-boss, bilingual checks): [CRON.md](./CRON.md).

---

## Daily schedule (source of truth)

| Kuwait | UTC | Host | Job | Kind |
|--------|-----|------|-----|------|
| every 4h | `0 */4 * * *` | **GitHub Actions** | Workflow `Ops heal` | Clear zombie locks + abandon stale raw (never force-kills a live collect). |
| 06:00 | 03:00 | **GitHub Actions** | Workflow `Collect news` | Pre-heal → full collect → confirm (+ repair if stale). |
| 07:00 | 04:00 | **Vercel Cron** | `GET /api/cron/collect` | Short HTTP backup only. |
| 11:00 | 08:00 | **Vercel Cron** | `GET /api/cron/ops-heal` | HTTP heal backup. |
| 14:00 | 11:00 | **GitHub Actions** | Workflow `Collect news` | Pre-heal → full collect → confirm. |
| 14:00 | 11:00 | **cron-job.org** | HTTP `/api/cron/collect` | Optional short midday ping (dashboard). Prefer GHA at this hour. |
| 22:00 | 19:00 | **GitHub Actions** | Workflow `Collect news` | Pre-heal → full collect → confirm. |
| 23:00 | 20:00 | **Vercel Cron** | `GET /api/cron/translate` | HTTP backfill for leftover `ar` / `en` pairs. |
| 03:30 | 00:30 | **Vercel Cron** | `GET /api/cron/archive` | Prune hot window / optional R2. |

This repo is **public**, so standard GitHub Actions Linux runners do not burn the private-plan 2,000-minute budget. Prefer GHA for reliability.

---

## GitHub Actions — Collect news

File: `.github/workflows/collect.yml`

Three jobs every run:

1. **Pre-heal** — force-clear stuck locks + abandon stale raw (`ops-heal-once --pre-collect`)
2. **Collect** — full DB pipeline (`run-once.ts`, up to 180 minutes)
3. **Confirm** — assert newest `publishedAt` within 8h; if not, heal + force collect once (`ops-confirm-once --repair`)

Schedules: `0 3,11,19 * * *` UTC (= 06:00 / 14:00 / 22:00 Kuwait), plus **Run workflow**.

Secrets: `DATABASE_URL`, `DIRECT_URL`, `GOOGLE_API_KEY`. Optional HTTP fallback: `CRON_SECRET` / `ADMIN_API_KEY` / `SITE_URL`.

---

## GitHub Actions — Ops heal

File: `.github/workflows/ops-heal.yml`

- Every 4 hours + **Run workflow**
- Clears **zombie** locks only (does not steal a live collect heartbeat)
- Abandons raw rows outside the live window

---

## Vercel Cron

File: `vercel.json`

```json
{
  "crons": [
    { "path": "/api/cron/collect", "schedule": "0 4 * * *" },
    { "path": "/api/cron/archive", "schedule": "30 0 * * *" },
    { "path": "/api/cron/translate", "schedule": "0 20 * * *" },
    { "path": "/api/cron/ops-heal", "schedule": "0 8 * * *" }
  ]
}
```

Set `CRON_SECRET` on the Vercel project.

---

## If the feed looks stuck

1. Actions → **Ops heal** → Run workflow (clears zombies)
2. Actions → **Collect news** → Run workflow (pre-heal → collect → confirm)
3. Or Platform operations → **Run auto-heal** / **Force collect**

Do **not** cancel a running Collect job early — that leaves `collect` interrupted until the next pre-heal.
