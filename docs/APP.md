# App functionality

Arabic-first market news for Kuwait and related markets. The public homepage defaults to Arabic. The API defaults to `lang=ar`. Every article is stored in both languages.

## Surfaces

| Surface | URL | Purpose |
|---------|-----|---------|
| Homepage | `/` | Arabic hero, filters, live article list |
| English homepage | `/?lang=en` | Same feed with English titles |
| Console | `/console` | Schedule, API keys, explorer, docs |
| Public API | `/api/v1/*` | Machine-readable feeds (`X-API-Key`) |
| Health | `/api/v1/health` | Database, cron jobs, bilingual coverage |
| OpenAPI | `/api/v1/openapi.json` | API schema |

Sign in to the console with your **email and password** (Supabase Auth). New accounts confirm via email OTP. Schedule is limited to super-admins listed in `SUPER_ADMIN_EMAILS`.

## Images (Cloudinary)

Set `CLOUDINARY_URL` (or `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`).

- **Static brand/marketing assets**: `npm run media:upload` uploads logos, heroes, concepts, and OG card to `briefly-newsstream/static/*` with stable public IDs. UI uses `CloudinaryImage` + `src/lib/media.ts` (`f_auto`, `q_auto`, `dpr_auto`, width limits). Cloud name is committed in `src/lib/media-cloud.json` (override with `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`).
- Console upload: `POST /api/console/uploads` (multipart `file`, console session required) → stores under `briefly-newsstream/uploads` and returns `url` + `optimizedUrl`.
- API article payloads rewrite `imageUrl` through Cloudinary fetch (`f_auto`, `q_auto`, width limit) when configured.
- Smoke: `npm run smoke:cloudinary` · re-upload static: `npm run media:upload`

## Database

Production data lives in **Supabase Postgres** (`DATABASE_URL` pooler + `DIRECT_URL` for migrations). Prisma owns the schema under `prisma/migrations/`. The local SQLite files under `prisma/data/` are read-only backups after cutover.

One-time cutover from SQLite:

```bash
npx tsx scripts/migrate-sqlite-to-supabase.ts
npm run seed:live
```

## Article lifecycle

1. **Collect** pulls public RSS, HTML, sitemap, and optional Gemini grounded search. Country-local RSS covers the 70 ISO markets (publisher feeds where they return XML; Google News RSS where they do not).
2. **Classify** drops off-topic items before insert and tags category, country, and nationality audience.
3. **Store** writes the original publisher title/summary plus the source-language pair (`titleEn` or `titleAr`). Stored articles are a permanent archive and are not deleted; the 72-hour window only filters the live homepage/API feed.
4. **Translate** fills the other language in the background and sets `translatedAt` when both sides exist.
5. **Score** ranks market impact.
6. **Daily edition** stores a ranked Top N for the Kuwait calendar day.
7. Homepage and API read stored `titleAr`/`titleEn`. They do not invent a language at request time except as a last-resort fill that is then saved.

## API

Send `X-API-Key` on every feed request. `lang=ar` (default) or `lang=en` changes display titles. `language=en` filters by source language and is not the same as `lang`.

| Endpoint | Role |
|----------|------|
| `GET /api/v1/market-news` | Filterable live stream (72-hour default window) |
| `GET /api/v1/market-news/today` | Today's stored edition |
| `GET /api/v1/market-news/daily?date=YYYY-MM-DD` | Historical edition |
| `GET /api/v1/market-news/editions` | Edition index |
| `GET /api/v1/market-news/nationality?nationality=IN` | Community briefing |
| `GET /api/v1/sources` | Source health |
| `GET /api/v1/meta/categories` | Categories |
| `GET /api/v1/meta/countries` | ~70 ISO countries (plus EU/Global) |
| `GET /api/v1/meta/nationalities` | Kuwait-facing nationality audiences |
| `GET /api/v1/health` | Production readiness |
| `POST /api/v1/admin/rebuild-edition` | Rebuild a stored edition |

Each article payload includes `title`, `summary` (localized), `titleAr`, `titleEn`, `summaryAr`, `summaryEn`, and `translated`.

Country filters cover about 70 ISO markets plus EU/Global. The Kuwait community briefing (`nationality=`) is a smaller audience list, not the full country catalog.

## Console

- **Language**: Arabic by default. Header switcher (العربية / English) stores `mna_console_lang`. Login `?lang=en` sets the same cookie.
- **Overview**: request activity
- **Explorer**: live API queries, Arabic results by default
- **Keys**: create, copy, rotate, revoke
- **Schedule**: cron presets and Run now for collect, translate, publish
- **Docs**: quick start plus full API reference at `/console/docs/api`

## Tests

```bash
npm test                 # unit tests, including bilingual field rules
npm run seed:test        # sources plus bilingual ar/en fixtures (test DB only)
npm run test:e2e         # Playwright: console, homepage, cron jobs, stored ar/en articles
npm run smoke            # production-style health gate (fails if any fresh article lacks ar or en)
```

`test:e2e` checks cron jobs plus stored bilingual fixtures (`E2EBILINGUAL`). Run `npm run seed:test` first. Full-window bilingual coverage is the production smoke gate, not the local Playwright suite, because a test database may still hold older untranslated rows.

See [CRON.md](./CRON.md) for job schedules and the bilingual storage contract.
