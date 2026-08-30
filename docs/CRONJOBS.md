# CRONJOBS

How Briefly NewsStream wakes news collect, translate, publish, and auto-heal.

Timezone is **Asia/Kuwait** (`APP_TIMEZONE`, UTC+3). The site on Vercel does **not** run cron inside the Node process. Something outside must call the app, or GitHub must run the pipeline.

Implementation notes (locks, pg-boss, bilingual checks): [CRON.md](./CRON.md).

---

## Daily schedule (source of truth)

| Kuwait | UTC | Host | Job | Kind |
|--------|-----|------|-----|------|
| every 2h at :30 | `30 */2 * * *` | **GitHub Actions** | Workflow `Ops heal` | Zombie locks + abandon stale raw (never steals a live collect heartbeat). |
| 06:00 / 14:00 / 22:00 | 03:00 / 11:00 / 19:00 | **GitHub Actions** | Workflow `Collect news` | **Pre-heal → collect → translate → confirm**. |
| 08:00 / 12:00 / 16:00 / 20:00 | 05:00 / 09:00 / 13:00 / 17:00 | **GitHub Actions** | Workflow `Translate news` | Bilingual backfill; skips if collect is live. |
| 07:00 | 04:00 | **Vercel Cron** | `GET /api/cron/collect` | Short HTTP backup only. |
| 11:00 | 08:00 | **Vercel Cron** | `GET /api/cron/ops-heal` | HTTP heal backup. |
| 23:00 | 20:00 | **Vercel Cron** | `GET /api/cron/translate` | HTTP translate backup. |
| 03:30 | 00:30 | **Vercel Cron** | `GET /api/cron/archive` | Prune hot window / optional R2. |

This repo is **public**, so standard GitHub Actions Linux runners do not burn the private-plan minute budget. Prefer GHA for reliability.

---

## Collect news (main pipeline)

File: `.github/workflows/collect.yml`

Four jobs every run:

1. **Pre-heal** — stop running/stuck **translate** (and other job locks) + abandon stale raw  
2. **Collect** — full DB pipeline (`run-once.ts`, up to 180 minutes)  
3. **Translate** — force `translate` job after collect (up to 120 minutes)  
4. **Confirm** — newest story &lt; 8h and translation backlog sane; repair (collect + translate) if not  

If translate is mid-run when collect is about to start, pre-heal releases its lock. Translate always runs again after collect.

---

## Translate news (between collects)

File: `.github/workflows/translate.yml`

- Four times daily between collect slots  
- Clears zombie locks, then force-runs translate  
- **Skips** when collect holds a live lock (`--skip-if-collect-running`)

---

## Ops heal

File: `.github/workflows/ops-heal.yml`

- Every 2 hours (+ **Run workflow**)  
- Clears **zombie** locks only + abandons stale raw  

---

## Edge-case behaviour

| Situation | What happens |
|-----------|----------------|
| Translate stuck / running, collect starts | Pre-heal stops translate locks → collect → translate again |
| Collect interrupted / cancelled | Next ops-heal + next collect pre-heal clears lock; confirm repair can re-collect |
| Translate backlog after collect | Post-collect translate job + confirm `--repair` + standalone Translate workflow |
| Collect live during Translate cron | Translate exits skipped; collect workflow translates afterward |
| Stale raw backlog (old publish dates) | Abandoned before normalize (pipeline + heal) |

---

## If the feed looks stuck

1. Actions → **Ops heal** → Run workflow  
2. Actions → **Collect news** → Run workflow (includes translate + confirm)  
3. Actions → **Translate news** → Run workflow (backfill only)  
4. Or Platform operations → **Run auto-heal** / **Force collect**

Do **not** cancel a running Collect job early.
