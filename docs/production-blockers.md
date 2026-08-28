# Production blockers — Briefly NewsStream

Last updated: 2026-08-28  
Domain target: `https://brieflynewsstream.com`  
Repo: https://github.com/Mohamed0400/brieflynewsstream

Use this checklist before / during Vercel go-live.

---

## Hard blockers

These block a correct production launch.

### 1. Vercel project + environment variables

Code is on `main`, but production needs a Vercel project with **all** secrets imported.

**Import file (local, gitignored):** `.env` or `.env.vercel`  
Vercel → Project → Settings → Environment Variables → **Import .env**  
Apply to **Production** (and Preview if desired).

Required groups:

| Group | Keys |
| --- | --- |
| Database | `DATABASE_URL`, `DIRECT_URL` |
| Supabase Auth | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Site | `NEXT_PUBLIC_SITE_URL=https://www.brieflynewsstream.com`, `NEXT_PUBLIC_APP_ENV=live` |
| Billing (Lemon Squeezy) | `BILLING_PROVIDER=lemonsqueezy`, `LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_STORE_ID`, `LEMONSQUEEZY_VARIANT_ID`, `LEMONSQUEEZY_ENTERPRISE_VARIANT_ID`, `LEMONSQUEEZY_WEBHOOK_SECRET`; set `LEMONSQUEEZY_TEST_MODE=false` in Production (use test keys + `true` only for staging) |
| API / console | `API_KEY`, `ADMIN_API_KEY`, `CONSOLE_SESSION_SECRET`, `SUPER_ADMIN_EMAILS` |
| Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_URL`, optional `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` (static CDN; also in `src/lib/media-cloud.json`) |
| Optional AI | `GOOGLE_API_KEY`, `GOOGLE_GROUNDED_SEARCH_ENABLED`, `GOOGLE_EDITORIAL_ENABLED`, `GEMINI_MODEL` |

Also see `.env.example` for the full key list (placeholders only; safe to commit).

### 2. Prisma on Vercel build

`package.json` build script is:

```bash
prisma generate && next build
```

Run migrations against production once:

```bash
npx prisma migrate deploy
```

(using `DIRECT_URL` / production DB credentials).

### 3. Supabase Auth allowlist

In Supabase → Authentication → URL configuration, allow:

- Site URL: `https://brieflynewsstream.com`
- Redirect URLs: `https://brieflynewsstream.com/**`, plus your `*.vercel.app` URLs if using previews

Without this, console login / signup / password reset break in production.

### 4. Domain DNS

Point `brieflynewsstream.com` (and `www` if used) at Vercel. Until DNS propagates, only the `*.vercel.app` URL works.

### 5. News ingestion cron

Use **GitHub Actions** (once daily, 22:00 Kuwait) plus **Vercel Cron** (07:00 collect) and **cron-job.org** (14:00 collect) hitting `/api/cron/collect`. Do not rely on in-process `node-cron` on Vercel. See `docs/CRON.md`.

---

## Soft / launch-quality blockers

App can boot; product or ops still incomplete.

### 6. CI pipeline

GitHub Actions runs a single `verify` job: `prisma generate` → `typecheck` → `unit tests` → `next build`.  
Playwright e2e is **not** in CI (Postgres-only schema; run locally with `npm run test:e2e` when needed).

### 7. Lemon Squeezy billing (production keys)

Billing is wired for **Lemon Squeezy** checkout, webhooks, PDF receipts, and super-admin invoice controls.

| Plan | List price |
| --- | --- |
| Free | $0 |
| Pro | **$80 / month** |
| Enterprise | $150 / month |

**Production env (Vercel):**

```bash
BILLING_PROVIDER=lemonsqueezy
LEMONSQUEEZY_TEST_MODE=false
LEMONSQUEEZY_API_KEY=          # Live API key (Lemon Squeezy dashboard, Test mode OFF)
LEMONSQUEEZY_STORE_ID=
LEMONSQUEEZY_VARIANT_ID=       # Live Pro variant ($80/month in Lemon Squeezy)
LEMONSQUEEZY_ENTERPRISE_VARIANT_ID=
LEMONSQUEEZY_WEBHOOK_SECRET=   # Live webhook signing secret
```

**Webhook URL (must include `https://`):**  
`https://www.brieflynewsstream.com/api/webhooks/billing/lemonsqueezy`

**Webhook events to enable (only these three — the app ignores all others):**

| Event | Why |
| --- | --- |
| `order_created` | One-time / first checkout paid |
| `subscription_created` | Subscription checkout started |
| `subscription_payment_success` | Recurring subscription payment |

You do **not** need `order_refunded`, `subscription_cancelled`, `subscription_payment_failed`, license-key events, etc. — they are not handled yet (the endpoint returns `ignored` and does not change plans).

**Store ID:** Required in Vercel for checkout to show as live (`paymentsLive`). Lemon Squeezy → Settings → Stores → copy the numeric store ID into `LEMONSQUEEZY_STORE_ID`. (Checkout can auto-discover the store at runtime, but the billing page treats payments as live only when this env var is set.)

**Variant IDs (Production):** set in env, not in code:

```bash
LEMONSQUEEZY_VARIANT_ID=              # Pro $80/month variant
LEMONSQUEEZY_ENTERPRISE_VARIANT_ID=   # Enterprise $150/month variant
```

After updating env vars, **redeploy Production** and smoke-test: `/console/billing` → upgrade → checkout → webhook → plan active.

### 8. Legal stubs

Footer Privacy / Terms may be incomplete until real pages ship.

### 9. Ops email

Contact CTAs use `hello@brieflynewsstream.com`. Mailbox / DNS for that address may not exist yet.

---

## Already cleared

- Code on GitHub `main` (no secrets committed)
- Marketing landing at `/` + newsroom at `/news`
- Plans / quotas / billing UI with Lemon Squeezy checkout (`BILLING_PROVIDER=lemonsqueezy`)
- Local env files remain gitignored (`.env*`)
- Edge middleware no longer pulls `node:crypto` (CORS lives in `src/lib/api-cors.ts`)
- Build script includes `prisma generate`

---

## Highest-leverage order

1. Import `.env` / `.env.vercel` into Vercel  
2. Confirm build uses `prisma generate && next build`  
3. Configure Supabase Auth redirect URLs  
4. Attach domain DNS  
5. Set `CRON_SECRET` on Vercel and `DATABASE_URL` on GitHub Actions so collect runs once daily on GHA, staggered from Vercel and cron-job.org  

---

## Vercel import quick start

1. Open local file: `.env` (same contents as `.env.vercel`)  
2. Confirm `NEXT_PUBLIC_SITE_URL="https://www.brieflynewsstream.com"` and `NEXT_PUBLIC_APP_ENV="live"`  
3. Vercel → Environment Variables → Import  
4. Redeploy Production  
5. Test: `/`, `/news`, `/console/login`, one authenticated API call with an account key  
