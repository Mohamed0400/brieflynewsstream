# CRONJOBS

How Briefly NewsStream wakes news collect, translate, publish, and auto-heal.

Timezone is **Asia/Kuwait** (`APP_TIMEZONE`, UTC+3). Times below are **Kuwait local, 12-hour**.

---

## Never exceed Free egress (`exceed_egress_quota`)

Free plan (Supabase **or** Neon) includes ~**5 GB** unified egress. Collecting ~3400 sources with force-refresh burns it; Auth then returns 402 until upgrade or billing reset.

**Ops rule — Arabic first:**

1. **Pause main collect first** — set GitHub repo variable / Vercel env `MAIN_COLLECT_ENABLED=false`
2. **Keep Arabic collect running** — `ARABIC_COLLECT_ENABLED=true` (default in GHA)
3. Only pause Arabic as a last resort (`ARABIC_COLLECT_ENABLED=false`)

Also keep: `COLLECT_GNEWS_LIMIT` ≤ 5–6, low concurrency, short `ARCHIVE_RAW_RETENTION_DAYS` (default 2), and `rawJson` stripped after normalize.

Migrating to Neon does **not** remove the Free egress ceiling — these guards stay mandatory.

---

## All-day loop (Kuwait) — egress-throttled

| Workflow | When (Kuwait) |
|----------|----------------|
| **Ops heal** | Every 2 hours |
| **Collect Arabic** *(priority)* | 8:00 AM · 2:00 PM · 8:00 PM |
| **Collect news** *(main / bilingual)* | 6:00 AM only *(1×/day; kill with `MAIN_COLLECT_ENABLED=false`)* |
| **Translate news** | 8:00 AM · 12:00 PM · 4:00 PM · 8:00 PM *(skips if collect is live)* |

Rough day flow:
- **6:00 AM** — main collect → translate → confirm (optional; pause under egress pressure)  
- **8:00 AM** — Arabic collect + translate backfill  
- **2:00 PM** — Arabic collect  
- **8:00 PM** — Arabic collect + translate backfill  
- **Ops heal** — every 2 hours in between  

---

## Why force-refetch on Collect

GHA sets `CRON_FORCE_COLLECT=true` / `ARABIC_COLLECT_FORCE=true` on scheduled runs so refresh-hours backoff does not skip every source. With main at **1×/day** and Arabic at **3×/day**, force is still safe if concurrency/GNews caps stay low.

## Archive hot retention vs live feed

The public feed uses `NEWS_MAX_AGE_HOURS` (default **72**). Hot **articles** are pruned by `ARCHIVE_HOT_RETENTION_DAYS` (default **5**) on the **archive** cron (Vercel). **Processed** `RawArticle` rows use a shorter `ARCHIVE_RAW_RETENTION_DAYS` (default **2**) — they are not needed after normalize and are a major egress/disk driver when left for 5 days.

Set article retention to **at least 4–5 days** in production so archive does not delete articles still inside the 72h briefing window. If production shows `retention 3d` in the archive job summary, raise `ARCHIVE_HOT_RETENTION_DAYS=5` on Vercel.

---

## Collect news jobs (main)

File: `.github/workflows/collect.yml`

1. **Gate** — skip entire workflow if `MAIN_COLLECT_ENABLED=false`  
2. **Pre-heal** — stop stuck/running translate + clear locks  
3. **Collect** — force-fetch sources (`run-once.ts --force`) with concurrency 2 / GNews ≤5  
4. **Translate** — force translate after collect  
5. **Confirm** — freshness + translation backlog; repair if needed  

## Collect Arabic (priority)

File: `.github/workflows/collect-arabic.yml` — 3× daily; independent concurrency group; no translate/confirm.

## Translate news

File: `.github/workflows/translate.yml` — backfill between collects; skips while collect is live.

## Ops heal

File: `.github/workflows/ops-heal.yml` — zombie locks + abandon stale raw every 2 hours.

---

## If the feed looks stuck

1. Actions → **Ops heal** → Run workflow  
2. Actions → **Collect Arabic news** → Run workflow *(priority)*  
3. Actions → **Collect news** → Run workflow *(only if main is enabled and egress allows)*  
4. Actions → **Translate news** → Run workflow  

Do **not** cancel Collect early unless it is clearly stuck with zero source fetches.
