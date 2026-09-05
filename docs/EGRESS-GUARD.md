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
- **Main:** 1×/day (06:00 Kuwait), concurrency 2, `COLLECT_GNEWS_LIMIT=5`

## Always-on code guards

- Strip `rawJson` after normalize (`pipeline.ts`)
- Short `ARCHIVE_RAW_RETENTION_DAYS` (default **2**)
- Modest GNews / concurrency defaults in `limits.ts`

## Neon note

Moving `DATABASE_URL` to Neon does **not** remove the Free egress ceiling. Keep these guards after cutover.

See also: [CRONJOBS.md](./CRONJOBS.md), [ARABIC-PIPELINE.md](./ARABIC-PIPELINE.md), [NEON-CUTOVER.md](./NEON-CUTOVER.md).
