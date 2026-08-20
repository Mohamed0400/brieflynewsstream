# Cron jobs

The app stores every fresh article with both language pairs:

- `titleEn` / `summaryEn`
- `titleAr` / `summaryAr`

Cron jobs keep collection, translation, and the daily edition running after deploy. The Next.js server starts the scheduler from `src/instrumentation.ts`. A dedicated worker (`npm run worker:live`) can run the same jobs if you prefer a separate process.

Timezone is `APP_TIMEZONE` (default `Asia/Kuwait`).

## Jobs

| Key | Name | Default cron | What it does |
|-----|------|--------------|--------------|
| `collect` | Collect news | `*/30 * * * *` | Fetch RSS/HTML/Gemini sources, store new articles, seed the source-language side (`en` or `ar`), translate the other side, refresh today's edition |
| `translate` | Translate articles | `*/15 * * * *` | Backfill any fresh article missing a real Arabic or English title/summary pair |
| `publish-daily` | Publish today's edition | `0 6 * * *` | Rebuild the stored `/today` edition, then fill remaining `ar`/`en` pairs |

Change schedules in **Console → Schedule**. Presets are listed there. **Run now** executes the same job the cron would run.

## Bilingual contract

A stored article is complete only when:

- English title and summary contain Latin letters and no Arabic script
- Arabic title and summary contain Arabic script

Failed Gemini calls must not copy English into `titleAr`. Collect runs translation after ingest. Publish runs translation after editorial rewrite. The 15-minute translate job catches anything still pending.

## Production checks

The deploy gate is `GET /api/v1/health` (no API key). It fails closed:

- `jobs`: `collect`, `translate`, `publish-daily` must exist and be enabled
- `bilingual.today` and `bilingual.fresh`: every article in the window must have real `ar` and `en` title/summary text
- `status`: `ok`, `degraded` (scheduler heartbeat offline), or `error` (HTTP 503)

```bash
# Test app (localhost:3001)
npm run smoke

# Local live app
npm run smoke:live

# Deployed URL
BASE_URL="https://your-domain" npm run smoke
```

CI also runs Playwright (`tests/bilingual.spec.ts`) after `npm run seed:test`. That seed writes bilingual `E2EBILINGUAL` fixtures into the test/CI SQLite files only, never into live. Playwright asserts those stored `ar`/`en` pairs plus cron job presence. Full-window coverage (`every` fresh article bilingual) is enforced by `npm run smoke` against production. Set GitHub Actions variable `PRODUCTION_BASE_URL` so `smoke-production` hits the deployed app on every push to `main`.

The Next.js Node process must stay running so `src/instrumentation.ts` can tick cron. Serverless freeze/unfreeze is not enough; use `npm start` or `npm run worker:live` on a long-lived host.

After deploy:

1. Confirm `GET /api/v1/health` is `200` with `checks.jobs=ok` and `checks.bilingual=ok`
2. Run `BASE_URL=https://your-domain npm run smoke`
3. Open Console → Schedule and confirm last run times move after collect / translate / publish
4. Spot-check `/api/v1/market-news?lang=ar` and `?lang=en` for `titleAr` / `titleEn`
