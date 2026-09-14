# Arabic-only collect pipeline

Separate ingest path for **native Arabic RSS** and **Google News Arabic (`hl=ar`)** feeds.
No Gemini translation — articles are stored with `language=ar` and Arabic title/summary only.

## Desk coverage

| Region | Focus |
|--------|--------|
| **Kuwait** | Gold, oil/gas, energy, markets, banking, investment (primary) |
| **Global** | Gold, oil, energy, markets, FX, commodities |
| **China** | Economy, trade, gold, energy, markets (+ TW/HK) |
| **Europe** | Eurozone, ECB, gold, oil, DE/FR/GB/CH |

## Kill switch

Set in Vercel / GitHub variables:

```bash
ARABIC_COLLECT_ENABLED=false   # stops cron + worker (default off locally) — last resort
ARABIC_COLLECT_ENABLED=true    # enable scheduled runs (GHA default)
ARABIC_COLLECT_FORCE=true      # refetch every source each run (GHA sets this)

# Prefer pausing MAIN collect under egress pressure — keep Arabic online:
MAIN_COLLECT_ENABLED=false

# Gemini bilingual translation — keep OFF unless you explicitly want to pay for it:
TRANSLATE_ENABLED=false
```

See [EGRESS-GUARD.md](./EGRESS-GUARD.md).

## Run locally

```bash
# Sync Arabic sources to DB
npm run sync:arabic-sources

# One-shot collect (requires ARABIC_COLLECT_ENABLED=true)
ARABIC_COLLECT_ENABLED=true npm run collect:arabic

# HTTP cron (production backup)
curl -X POST "$SITE_URL/api/cron/collect-arabic" \
  -H "Authorization: Bearer $CRON_SECRET"
```

## GitHub Actions

Workflow: **Collect Arabic news** (`.github/workflows/collect-arabic.yml`)

- **3× daily** (egress-throttled; was 5×) + `workflow_dispatch`
- Timeout **90 minutes**; DB lock window **2 hours** (heartbeats renew)
- `if: always()` cleanup marks `collect-arabic` interrupted if still running after cancel/timeout
- Does **not** run translate or confirm
- Independent concurrency group `collect-arabic-news`
- Highest priority under Free-plan limits — pause **main** collect first

### Self-healing

| Workflow | Cadence | Behavior |
|----------|---------|----------|
| **Watchdog Arabic** | Hourly | Soft-heal: re-collect only if Arabic ≥5h stale or last job failed |
| **Ops heal** | Every 2h | Clears zombie `collect-arabic` / `collect` locks |

No manual re-trigger required for stuck locks or missed slots. Kill switches: `ARABIC_COLLECT_ENABLED` (last resort), `MAIN_COLLECT_ENABLED=false` (preferred under egress pressure).

## Source catalog

- Native Arabic RSS + Google News `hl=ar` matrix (see `arabicSourceCatalogStats()`)
- Native publishers: `src/lib/sources/arabic-publishers.ts` (Kuwait + MENA + pan-Arab business)
- Generated matrix: `src/lib/sources/arabic-google-sources.ts` (Kuwait-first + denser MENA desks)
- Kuwait coverage includes major dailies via native RSS and Google News `site:` feeds (Al-Rai, Al-Qabas, Al-Anba, Al-Jarida, Annahar, Al-Watan, Al-Shahed, KUNA)
- All codes prefixed `AR_` / `AR_GN_`
- DB field: `Source.collectPipeline = "arabic"`, `sourceLocale = "ar"`

Main English collect **does not** fetch these sources. Translation stays off for Arabic-native rows.

## API

Arabic pipeline articles appear in the public API with `language=ar`.
Use `?language=ar` or `?lang=ar` — no English pair required for display.
