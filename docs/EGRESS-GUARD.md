# Never exceed Free egress

**Goal:** Never hit `exceed_egress_quota` again (Supabase or Neon Free ≈ 5 GB egress).

## Priority

| Priority | Pipeline | Kill switch | Default under pressure |
|----------|----------|-------------|------------------------|
| **1 (keep)** | Arabic desk | `ARABIC_COLLECT_ENABLED` | **Leave on** |
| **2 (pause first)** | Main English collect | `MAIN_COLLECT_ENABLED` | **Set `false` first** |
| **3 (cost)** | Gemini translation | `TRANSLATE_ENABLED` | **Keep `false`** |

Arabic is the product priority. When egress is tight or Auth/DB returns quota errors:

```bash
# GitHub → Settings → Variables (or Vercel env)
MAIN_COLLECT_ENABLED=false    # pause main immediately
ARABIC_COLLECT_ENABLED=true   # keep Arabic
TRANSLATE_ENABLED=false       # never spend Gemini under pressure
```

Main English collect can run with `MAIN_COLLECT_ENABLED=true` and `TRANSLATE_ENABLED=false` (index English without bilingual drain).

Only disable Arabic as a last resort.

## Cadence (GHA)

- **Arabic:** 3×/day (08:00, 14:00, 20:00 Kuwait)
- **Arabic watchdog (soft-heal):** hourly — re-collects **only** if Arabic feed/job is ≥5h stale or last run failed; never enables MAIN collect
- **Ops heal:** every 2h — clears zombie `collect` / `collect-arabic` locks + abandons stale raw
- **Main:** 1×/day (06:00 Kuwait), concurrency 2, `COLLECT_GNEWS_LIMIT=5` — enable with `MAIN_COLLECT_ENABLED=true`; keep `TRANSLATE_ENABLED=false` unless you want Gemini cost
- **Translate:** gated by `TRANSLATE_ENABLED` (default off)

## Self-healing (no manual re-trigger)

| Layer | What it does |
|-------|----------------|
| Lock TTL + heartbeats | Arabic lock window is 2h (covers 90m GHA timeout); zombies clear when heartbeats stop or `lockedUntil` expires |
| GHA `if: always()` cleanup | `collect-arabic` / watchdog mark `collect-arabic` interrupted if still running after cancel/timeout |
| Ops heal | Clears expired/zombie locks every 2h |
| Watchdog Arabic | Soft-heal freshness: skip when fresh; run Arabic collect when stale |

Kill switches stay as above — do **not** set `MAIN_COLLECT_ENABLED=true` to “fix” freshness; use Arabic collect / watchdog.

## Always-on code guards

- Strip `rawJson` after normalize (`pipeline.ts`)
- Short `ARCHIVE_RAW_RETENTION_DAYS` (default **1**; max **2**)
- Hot articles `ARCHIVE_HOT_RETENTION_DAYS` (default **3**)
- Row caps: `ARCHIVE_ARTICLE_COUNT_CAP=20000`, `ARCHIVE_RAW_COUNT_CAP=25000` (soft floor 36h)
- Modest GNews / concurrency / normalize defaults in `limits.ts`
- `ARABIC_MAX_ARTICLES_PER_RUN` (default **2500**)

## Neon Free

Moving `DATABASE_URL` to Neon does **not** remove Free ceilings (0.5 GB storage, 5 GB egress, 100 CU-hours). Keep these guards after cutover. Full numbers: [NEON-FREE-LIMITS.md](./NEON-FREE-LIMITS.md).

See also: [CRONJOBS.md](./CRONJOBS.md), [ARABIC-PIPELINE.md](./ARABIC-PIPELINE.md), [NEON-CUTOVER.md](./NEON-CUTOVER.md).
