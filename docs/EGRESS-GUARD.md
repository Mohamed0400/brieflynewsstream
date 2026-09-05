# Never exceed Free egress

**Goal:** Never hit `exceed_egress_quota` again (Supabase or Neon Free ≈ 5 GB egress).

## Priority

| Priority | Pipeline | Kill switch | Default under pressure |
|----------|----------|-------------|------------------------|
| **1 (keep)** | Arabic desk | `ARABIC_COLLECT_ENABLED` | **Leave on** |
| **2 (pause first)** | Main bilingual collect | `MAIN_COLLECT_ENABLED` | **Set `false` first** |

Arabic is the product priority. When egress is tight or Auth/DB returns quota errors:

```bash
# GitHub → Settings → Variables (or Vercel env)
MAIN_COLLECT_ENABLED=false    # pause main immediately
ARABIC_COLLECT_ENABLED=true   # keep Arabic
```

Only disable Arabic as a last resort.

## Cadence (GHA)

- **Arabic:** 3×/day (08:00, 14:00, 20:00 Kuwait)
- **Arabic watchdog (soft-heal):** hourly — re-collects **only** if Arabic feed/job is ≥5h stale or last run failed; never enables MAIN collect
- **Ops heal:** every 2h — clears zombie `collect` / `collect-arabic` locks + abandons stale raw
- **Main:** 1×/day (06:00 Kuwait), concurrency 2, `COLLECT_GNEWS_LIMIT=5` — keep `MAIN_COLLECT_ENABLED=false` under Free egress

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
- Short `ARCHIVE_RAW_RETENTION_DAYS` (default **2**)
- Modest GNews / concurrency defaults in `limits.ts`

## Neon note

Moving `DATABASE_URL` to Neon does **not** remove the Free egress ceiling. Keep these guards after cutover.

See also: [CRONJOBS.md](./CRONJOBS.md), [ARABIC-PIPELINE.md](./ARABIC-PIPELINE.md), [NEON-CUTOVER.md](./NEON-CUTOVER.md).
