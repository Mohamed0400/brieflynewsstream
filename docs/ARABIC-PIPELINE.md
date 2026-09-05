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

- **3× daily** (egress-throttled; was 5×)
- Does **not** run translate or confirm
- Independent concurrency group `collect-arabic-news`
- Highest priority under Free-plan limits — pause **main** collect first

## Source catalog

- **975** Arabic-only feeds (31 native RSS + 944 Google News `hl=ar`)
- Native publishers: `src/lib/sources/arabic-publishers.ts` (incl. Cointelegraph, BeInCrypto, Argaam)
- Generated matrix: `src/lib/sources/arabic-google-sources.ts`
- **213** crypto/blockchain feeds (`Category.CRYPTO`)
- **29** Kuwait-focused feeds
- All codes prefixed `AR_` / `AR_GN_`
- DB field: `Source.collectPipeline = "arabic"`, `sourceLocale = "ar"`

Main bilingual collect **does not** fetch these sources.

## API

Arabic pipeline articles appear in the public API with `language=ar`.
Use `?language=ar` or `?lang=ar` — no English pair required for display.
