# Neon Free limits (Auth project only)

**Production data** lives on **DigitalOcean Managed Postgres** (`gs-news`). See [NEON-CUTOVER.md](./NEON-CUTOVER.md).

**Neon** is used for **Auth only** (`cool-bread-17251650` / `gs-news-auth`). Keep article collect off Neon so Auth does not burn Free **egress**.

**Goal (Auth Neon):** Never exceed Neon Free caps — especially **storage (0.5 GB)**, also **egress (5 GB/mo)** and **compute (100 CU-hours/mo)**.

Verified against [Neon plans](https://neon.com/docs/introduction/plans) (Free per project):

| Resource | Free cap | What suspends |
|----------|----------|----------------|
| Storage | **0.5 GB** | Writes that grow storage fail / project suspends |
| Public network (egress) | **5 GB / month** | Compute suspends until next billing cycle |
| Compute | **100 CU-hours / month** | Compute suspends until next billing cycle |
| Autoscaling | Up to 2 CU; scale-to-zero after ~5 min | — |

This app targets **Arabic-only collect** on Free (`MAIN_COLLECT_ENABLED=false`). See [EGRESS-GUARD.md](./EGRESS-GUARD.md).

## Storage targets

| Signal | Neon-safe target |
|--------|------------------|
| DB size | Stay **≤ ~350 MB** operational headroom under 512 MB |
| `Article` rows | Age ≤ **3 days**; hard cap **20_000** |
| `RawArticle` rows | Processed ≤ **1 day**; hard cap **25_000** |
| Soft floor | Never delete articles newer than **36h** (env 24–72) even when over row cap |

Rough math: ~15–20k articles + thin raws after strip ≈ well under 0.5 GB. Unpruned processed `RawArticle` (especially with `rawJson`) is the usual blow-up.

## Defaults (code + recommended Vercel / GHA)

| Env | Default | Notes |
|-----|---------|--------|
| `ARCHIVE_HOT_RETENTION_DAYS` | **3** | Covers `NEWS_MAX_AGE_HOURS=72` |
| `ARCHIVE_RAW_RETENTION_DAYS` | **1** | Max recommended **2** |
| `ARCHIVE_ARTICLE_COUNT_CAP` | **20000** | `0` disables count backstop |
| `ARCHIVE_RAW_COUNT_CAP` | **25000** | Prefer processed raws first |
| `ARCHIVE_COUNT_CAP_MIN_AGE_HOURS` | **36** | Soft floor for article cap deletes |
| `COLLECT_GNEWS_LIMIT` | **5** | Arabic GHA also sets 5 |
| `ARABIC_COLLECT_CONCURRENCY` | **2** | |
| `NORMALIZE_BATCH_SIZE` | **1000** | |
| `NORMALIZE_PASSES` | **4** | |
| `ARABIC_MAX_ARTICLES_PER_RUN` | **2500** | Soft create cap per Arabic run (`0` = off) |
| `MAIN_COLLECT_ENABLED` | **false** on Free | Keep off |

`rawJson` is stripped to `{}` as soon as a raw row is processed (`pipeline.ts`).

## What prunes when

| Trigger | When | What |
|---------|------|------|
| **Age retention** | Archive job / GHA prune | Articles older than hot days; processed raws older than raw days; any raw published older than hot days |
| **Count caps** | After age prune in same run | Oldest articles beyond N (respecting soft floor); oldest processed raws beyond M |
| **Vercel cron** | `/api/cron/archive` daily (`vercel.json`) | Same `runArchiveAndPrune` |
| **GHA Ops heal** | Every 2h | Locks + stale raw, then **prune** |
| **GHA Collect Arabic** | After each Arabic collect | Prune |
| **GHA Watchdog Arabic** | Hourly (when gate on) | Prune even on soft-skip |

Without R2 secrets, mode is **prune-only** (no cold upload). That is intentional on Free.

## Kill switches

```bash
MAIN_COLLECT_ENABLED=false       # always on Free
ARABIC_COLLECT_ENABLED=false     # last resort only
ARCHIVE_ARTICLE_COUNT_CAP=0      # disable article row cap (not recommended)
ARCHIVE_RAW_COUNT_CAP=0          # disable raw row cap
ARABIC_MAX_ARTICLES_PER_RUN=0    # disable per-run create cap
```

## Manual prune

```bash
npm run archive:live          # prune (and archive if R2 set)
npm run archive:dry           # dry-run counts
```

## Related

- [EGRESS-GUARD.md](./EGRESS-GUARD.md) — egress priority + MAIN off
- [CRONJOBS.md](./CRONJOBS.md) — schedules
- [R2-CLOUDFLARE-SETUP.md](./R2-CLOUDFLARE-SETUP.md) — optional cold storage
