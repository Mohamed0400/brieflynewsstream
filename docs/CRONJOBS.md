# CRONJOBS

How Briefly NewsStream wakes news collect, translate, publish, and auto-heal.

Timezone is **Asia/Kuwait** (`APP_TIMEZONE`, UTC+3). Times below are **Kuwait local, 12-hour**.

---

## All-day loop (Kuwait)

| Workflow | When (Kuwait) |
|----------|----------------|
| **Ops heal** | Every 2 hours |
| **Collect news** | 6:00 AM · 10:00 AM · 2:00 PM · 6:00 PM · 10:00 PM *(always force-refetch sources; then translate + confirm)* |
| **Translate news** | 8:00 AM · 12:00 PM · 4:00 PM · 8:00 PM *(skips if collect is live)* |

Rough day flow:
- **6:00 AM** — collect → translate → confirm  
- **8:00 AM** — translate backfill  
- **10:00 AM** — collect → translate → confirm  
- **12:00 PM** — translate backfill  
- **2:00 PM** — collect → translate → confirm  
- **4:00 PM** — translate backfill  
- **6:00 PM** — collect → translate → confirm  
- **8:00 PM** — translate backfill  
- **10:00 PM** — collect → translate → confirm  
- **Ops heal** — every 2 hours in between  

---

## Why force-refetch on Collect

GHA sets `CRON_FORCE_COLLECT=true`. Without that, `COLLECT_REFRESH_HOURS` can skip every source when a collect starts less than N hours after the previous fetch — the job looks “running” but no new articles appear. Scheduled Collect runs must always re-hit sources.

---

## Collect news jobs

File: `.github/workflows/collect.yml`

1. **Pre-heal** — stop stuck/running translate + clear locks  
2. **Collect** — force-fetch all sources (`run-once.ts --force`)  
3. **Translate** — force translate after collect  
4. **Confirm** — freshness + translation backlog; repair if needed  

---

## Translate news

File: `.github/workflows/translate.yml` — backfill between collects; skips while collect is live.

## Ops heal

File: `.github/workflows/ops-heal.yml` — zombie locks + abandon stale raw every 2 hours.

---

## If the feed looks stuck

1. Actions → **Ops heal** → Run workflow  
2. Actions → **Collect news** → Run workflow  
3. Actions → **Translate news** → Run workflow  

Do **not** cancel Collect early unless it is clearly stuck with zero source fetches.
