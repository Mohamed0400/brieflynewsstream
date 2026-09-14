# CRONJOBS

How Briefly NewsStream wakes news collect, translate, publish, and auto-heal.

Timezone is **Asia/Kuwait** (`APP_TIMEZONE`, UTC+3). Times below are **Kuwait local, 12-hour**.

---

## Never exceed Free egress (`exceed_egress_quota`)

Free plan (Supabase **or** Neon) includes ~**5 GB** unified egress. Collecting ~3400 sources with force-refresh burns it; Auth then returns 402 until upgrade or billing reset.

**Ops rule — Arabic first:**

1. **Pause main collect first** — set GitHub repo variable / Vercel env `MAIN_COLLECT_ENABLED=false`
2. **Keep Arabic collect running** — `ARABIC_COLLECT_ENABLED=true` (default in GHA)
3. **Keep translation off** — `TRANSLATE_ENABLED=false` (Gemini costs money; main English collect still works)
4. Only pause Arabic as a last resort (`ARABIC_COLLECT_ENABLED=false`)

Also keep: `COLLECT_GNEWS_LIMIT` ≤ 5, low concurrency, short `ARCHIVE_RAW_RETENTION_DAYS` (default **1**), hot articles **3d**, and `rawJson` stripped after normalize. Full Neon Free targets: [NEON-FREE-LIMITS.md](./NEON-FREE-LIMITS.md).

Migrating to Neon does **not** remove the Free egress ceiling — these guards stay mandatory.

---

## All-day loop (Kuwait) — egress-throttled

| Workflow | When (Kuwait) |
|----------|----------------|
| **Watchdog Arabic** *(soft-heal)* | Every hour — collect **only if** Arabic ≥5h stale / job failed |
| **Ops heal** | Every 2 hours — zombie locks + stale raw |
| **Collect Arabic** *(priority)* | 8:00 AM · 2:00 PM · 8:00 PM |
| **Collect news** *(main English)* | 6:00 AM only *(1×/day; kill with `MAIN_COLLECT_ENABLED=false`; no Gemini unless `TRANSLATE_ENABLED=true`)* |
| **Translate news** | 8:00 AM · 12:00 PM · 4:00 PM · 8:00 PM *(gated by `TRANSLATE_ENABLED`; skips if collect is live)* |

Rough day flow:
- **6:00 AM** — main English collect (translation optional / off by default)
- **8:00 AM** — Arabic collect (+ translate backfill only if `TRANSLATE_ENABLED=true`)
- **2:00 PM** — Arabic collect  
- **8:00 PM** — Arabic collect (+ translate backfill only if enabled)  
- **Watchdog Arabic** — hourly soft-heal if a slot was missed/cancelled  
- **Ops heal** — every 2 hours clears stuck locks  

---

## Why force-refetch on Collect

GHA sets `CRON_FORCE_COLLECT=true` / `ARABIC_COLLECT_FORCE=true` on scheduled runs so refresh-hours backoff does not skip every source. With main at **1×/day** and Arabic at **3×/day**, force is still safe if concurrency/GNews caps stay low.

## Archive hot retention vs live feed

The public feed uses `NEWS_MAX_AGE_HOURS` (default **72**). Hot **articles** are pruned by `ARCHIVE_HOT_RETENTION_DAYS` (default **3**) on the archive cron (Vercel) **and** GHA ops-heal / Arabic collect / watchdog prune steps. **Processed** `RawArticle` rows use `ARCHIVE_RAW_RETENTION_DAYS` (default **1**, max **2**). After age prune, hard row caps (`ARCHIVE_ARTICLE_COUNT_CAP` / `ARCHIVE_RAW_COUNT_CAP`) delete oldest excess while never touching the last **36h** of articles.

Default **3d** article retention matches the 72h briefing window on Neon Free. Raise only if you have storage headroom (or R2 cold archive). See [NEON-FREE-LIMITS.md](./NEON-FREE-LIMITS.md).

---

## Collect news jobs (main)

File: `.github/workflows/collect.yml`

1. **Gate** — skip entire workflow if `MAIN_COLLECT_ENABLED=false`  
2. **Pre-heal** — stop stuck/running translate + clear locks  
3. **Collect** — force-fetch sources (`run-once.ts --force`) with concurrency 2 / GNews ≤5  
4. **Translate** — force translate after collect  
5. **Confirm** — freshness + translation backlog; repair if needed  

## Collect Arabic (priority)

File: `.github/workflows/collect-arabic.yml` — 3× daily; independent concurrency group; no translate/confirm; 90m timeout; `if: always()` lock cleanup.

## Watchdog Arabic (self-heal)

File: `.github/workflows/watchdog-arabic.yml` — hourly. Clears stale locks, then runs Arabic collect **only** when newest `language=ar` article `createdAt` (or last job) is older than **5 hours**, or last status is `error`/`interrupted`. Soft-skip when fresh. Does **not** enable MAIN collect.

## Translate news

File: `.github/workflows/translate.yml` — backfill between collects; skips while collect is live.

## Ops heal

File: `.github/workflows/ops-heal.yml` — zombie locks (incl. `collect-arabic`) + abandon stale raw every 2 hours, then **prune** hot window / row caps (Neon Free backstop).

---

## If the feed looks stuck

Automation should recover within ~1–5 hours via watchdog + ops-heal. Manual fallback:

1. Actions → **Ops heal** → Run workflow  
2. Actions → **Watchdog Arabic** → Run workflow *(soft-heal; no-ops if fresh)*  
3. Actions → **Collect Arabic news** → Run workflow *(priority)*  
4. Actions → **Collect news** → Run workflow *(only if main is enabled and egress allows)*  
5. Actions → **Translate news** → Run workflow  

Do **not** cancel Collect early unless it is clearly stuck with zero source fetches. Do **not** flip `MAIN_COLLECT_ENABLED=true` just to unstick Arabic.
