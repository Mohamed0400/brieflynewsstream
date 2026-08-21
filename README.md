# Market News API

Next.js/TypeScript API for market and financial-news readers. It collects live public feeds, removes off-topic stories, tags country/category, scores market impact, stores every article in **Arabic and English**, and keeps a daily Top 10–15 edition.

Operator docs:

- [App functionality](docs/APP.md)
- [Cron jobs and bilingual storage](docs/CRON.md)

## Daily updates (stored in database)

Each calendar day in `APP_TIMEZONE` gets one durable `DailyEdition` row plus ranked `DailyEditionItem` rows. That is the unit you will later keep or migrate into another database.

| Behavior | Detail |
|----------|--------|
| Collect | every 30 minutes, configurable in the console Schedule page |
| Translate | every 15 minutes, fills missing `titleAr`/`titleEn` pairs |
| Today’s edition | refreshed as new stories arrive, or on demand from Schedule |
| Morning publish | 06:00 Asia/Kuwait by default, configurable in Schedule |
| Language pairs | every stored article has `en` and `ar` title/summary fields |
| Past days | locked and not overwritten |
| Storage now | SQLite (`prisma/data/test.db` / `live.db`) |

## Configurable retrieval limits

Collection is uncapped by default. Relevance filters, API pagination, and rate limits decide what clients see.

| Env var | Default | Meaning |
|---------|---------|---------|
| `COLLECT_RSS_LIMIT` | `0` | Max items per RSS feed (`0` = all) |
| `COLLECT_HTML_LIMIT` | `0` | Max items per HTML listing (`0` = all) |
| `COLLECT_SITEMAP_LIMIT` | `0` | Max items per sitemap (`0` = all) |
| `COLLECT_GEMINI_LIMIT` | `50` | Max grounded Google Search articles |
| `COLLECT_NATIONALITY_LIMIT` | `60` | Max grounded expatriate-audience articles per search |
| `NATIONALITY_SEARCH_INTERVAL_HOURS` | `12` | Hours between nationality searches |
| `NEWS_MAX_AGE_HOURS` | `72` | Maximum age for briefing articles and daily-edition candidates |
| `SOURCE_HEALTH_MAX_AGE_HOURS` | `24` | Successful-fetch window used by source health metrics |
| `NATIONALITY_NEWS_MAX_AGE_HOURS` | `48` | Hard freshness window for nationality feeds |
| `NATIONALITY_FEED_LIMIT` | `12` | Default items in a two-minute briefing |
| `NORMALIZE_BATCH_SIZE` | `0` | Raw articles processed per run (`0` = all pending) |
| `DAILY_CANDIDATE_POOL` | `0` | Ranking pool size (`0` = all scored in window) |
| `DAILY_EDITION_SIZE` | `15` | Top N stored in daily edition |
| `DAILY_REGION_CAP` | `0` | Soft max per region (`0` = no region cap) |
| `API_DEFAULT_LIMIT` | `50` | Default `?limit=` for filter API |
| `API_MAX_LIMIT` | `500` | Absolute max `?limit=` |
| `DASHBOARD_LIMIT` | `50` | Homepage list size |
| `TRANSLATE_BATCH_SIZE` | `40` | Articles translated per job run (`0` = all pending) |
| `EDITIONS_LIST_LIMIT` | `90` | Editions index page size |

## Editorial display copy

The original publisher copy is always preserved in `Article.title` and `Article.summary`. For large-screen presentation, selected daily stories also receive:

- `displayTitle` — standalone, factual agency-style headline with no ellipses or clipped wording
- `displaySummary` — one concise context sentence explaining why the story matters
- `editorializedAt` — audit timestamp

The API returns display copy as `title` / `summary` and exposes untouched source copy as `originalTitle` / `originalSummary`. Gemini edits only from supplied source text; if it fails, a conservative deterministic cleanup is stored instead.

## Run test

```bash
npm install
npm run db:test
npm run seed:test
npm run pipeline:test
npm run dev:test
```

Open `http://localhost:3001`. Collection now starts with the website process. Use **Console → Schedule** to change cron jobs or click **Run now**. `npm run worker:test` is optional if you want a dedicated scheduler process.

```bash
npm test
npm run test:e2e
npm run smoke
```

`GET /api/v1/health` reports cron job status and whether fresh articles are fully bilingual. After a live deploy, run `npm run smoke:live` or `BASE_URL=https://your-domain npm run smoke`. Set the GitHub Actions variable `PRODUCTION_BASE_URL` to run that same smoke check in CI.

## API console

Open `http://localhost:3001/console/login` and sign in with email and password. Emails in `SUPER_ADMIN_EMAILS` get super-admin access (Schedule). The console provides:

- real 7-day request activity and top endpoint reporting
- a visual API explorer with text, source, geography, nationality, category, language, date, sort, and pagination controls
- persistent API key creation with one-time plaintext display
- SHA-256 key storage, last-used timestamps, and immediate revocation
- a Schedule page to change collect/publish cron jobs and run the pipeline immediately
- Billing with plan limits, Open / Void / Paid invoice history, and PDF receipts

Set a separate, long random `CONSOLE_SESSION_SECRET` in shared or live environments. Run `npm run test:e2e` to verify console authentication, dark mode, 44px touch targets, and responsive layouts from 320px through 1440px.

## API

Read APIs require `X-API-Key`:

```bash
# Today's stored daily edition
curl -H "X-API-Key: test-market-news-key" \
  "http://localhost:3001/api/v1/market-news/today"

# Historical daily edition by date
curl -H "X-API-Key: test-market-news-key" \
  "http://localhost:3001/api/v1/market-news/daily?date=2026-08-17"

# List stored daily editions
curl -H "X-API-Key: test-market-news-key" \
  "http://localhost:3001/api/v1/market-news/editions"

# Filterable article stream
curl -H "X-API-Key: test-market-news-key" \
  "http://localhost:3001/api/v1/market-news?category=oil&country=US&limit=15"

# Newest-first stream for one day
curl -H "X-API-Key: test-market-news-key" \
  "http://localhost:3001/api/v1/market-news?sort=date&from=2026-08-18&to=2026-08-18&limit=20"

# Fresh two-minute Indian community briefing
curl -H "X-API-Key: test-market-news-key" \
  "http://localhost:3001/api/v1/market-news/nationality?nationality=IN"
```

Filters on the stream: `q`, `searchIn`, `category`, `country`, `region`, `nationality`, `source`, `language`, `date`, `from`, `to`, `limit`, `offset`, `sort`.

Without `date`, `from`, or `to`, the briefing only returns articles published within `NEWS_MAX_AGE_HOURS` (72 hours by default). Explicit date filters provide access to stored historical records without mixing them into the current briefing.

Endpoints:

- `GET /api/v1/market-news`
- `GET /api/v1/market-news?nationality=IN` (also accepts slugs and comma-separated values)
- `GET /api/v1/market-news/nationality?nationality=IN` (48-hour, two-minute rotation payload)
- `GET /api/v1/market-news/today`
- `GET /api/v1/market-news/daily?date=YYYY-MM-DD`
- `GET /api/v1/market-news/editions`
- `GET /api/v1/sources`
- `GET /api/v1/meta/categories`
- `GET /api/v1/meta/countries`
- `GET /api/v1/meta/nationalities`
- `POST /api/v1/admin/rebuild-edition`

Admin rebuild body: `{ "date": "2026-08-17", "force": true }`.

## Run live

First change both keys in `.env.live`, then:

```bash
npm run db:live
npm run seed:live
npm run pipeline:live
npm run dev:live
```

## Source policy

The seed contains verified public RSS feeds from the Federal Reserve (including monetary policy), ECB, BBC Business, CNBC Markets, MarketWatch, Mining.com Gold, Investing.com commodities, Northern Miner, Gulf News, Times Kuwait Business, Arab Times and Al Jazeera. Kitco, World Gold Council and Central Bank of Kuwait stay on HTML adapters because their public XML is stale, HTML-only, or missing. Reuters and Bloomberg remain experimental sitemap adapters, not licensed feeds.

Experimental adapters also read Reuters' public sitemap, Bloomberg's public latest-news sitemap, and KUNA's public English listing page. They collect only public metadata (headline, canonical link, timestamp/image when exposed). They do not bypass authentication or Bloomberg paywalls and do not use KUNA's subscription-only XML service.

The collector stores titles, summaries, links and metadata and sends readers to the publisher. Review each publisher's terms before commercial deployment.

When `GOOGLE_GROUNDED_SEARCH_ENABLED=true`, Gemini's Google Search grounding supplements direct feeds. It requests current market news plus fresh community briefings with original publisher URLs, then keeps only a conservative domain allowlist before applying freshness, relevance and deduplication checks. Nationality options are editorial audience choices, not a claimed demographic ranking. `AFRICA` is exposed as a regional group rather than incorrectly being presented as a nationality.

Keep `GOOGLE_API_KEY` in env only. Search grounding can incur Google API charges, and a key pasted into chat should be rotated before production use.
