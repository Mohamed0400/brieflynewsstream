# Cloudflare R2 cold archive setup

The archive code is already in the repo (`src/lib/archive/*`, `/archive` pages, `GET /api/v1/archive`, cron job `archive`).  
**The app runs fine without R2.** Until you finish this guide, daily jobs **prune** Supabase only (default hot window: **5 days**) and do not upload cold storage.

Use this doc when you are ready to keep history outside the free Supabase 500 MB limit.

---

## Why R2

| Layer | Role | Default without R2 |
|-------|------|--------------------|
| **Hot (Supabase)** | Live API + `/news` | Keep ≤ `ARCHIVE_HOT_RETENTION_DAYS` (default **5**); processed RawArticles ≤ `ARCHIVE_RAW_RETENTION_DAYS` (default **2**) |
| **Cold (Cloudflare R2)** | Long-term gzip JSONL by day | Optional — skipped until credentials exist |

Without R2, articles older than the hot window are **deleted** from Postgres so the free DB stays under ~500 MB. With R2, the same rows are uploaded first, then deleted from Supabase, and remain readable on `/archive` and the archive API.

---

## Prerequisites

1. Cloudflare account (same account can host DNS + R2).
2. Enable **R2** in the dashboard: [R2 overview](https://dash.cloudflare.com/?to=/:account/r2) → accept the free tier / enable storage if prompted.
   - API create fails with `10042` until this step is done in the UI.
3. Note your **Account ID** (R2 overview sidebar / account home).

---

## 1. Create the bucket

Dashboard: **R2** → **Create bucket**

| Field | Suggested value |
|-------|-----------------|
| Name | `briefly-newsstream-archive` |
| Location | Automatic (or closest to your users) |

Object layout written by the worker:

```text
articles/YYYY/MM/DD.jsonl.gz
manifests/YYYY/MM/DD.json
index/days.json
```

---

## 2. Create an R2 API token

Dashboard: **R2** → **Manage R2 API Tokens** → **Create API token**

| Setting | Value |
|---------|--------|
| Permissions | **Object Read & Write** on `briefly-newsstream-archive` (or account-wide R2 if you prefer) |
| TTL | No expiry (or rotate on your schedule) |

Copy once:

- **Access Key ID** → `R2_ACCESS_KEY_ID`
- **Secret Access Key** → `R2_SECRET_ACCESS_KEY`

---

## 3. Environment variables

Set on **Vercel** (Production + Preview if needed) and in local `.env` / `.env.live`:

```bash
R2_ACCOUNT_ID="your_cloudflare_account_id"
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="briefly-newsstream-archive"
# Optional override (default built from account id):
# R2_ENDPOINT="https://<ACCOUNT_ID>.r2.cloudflarestorage.com"

# Hot window in Supabase (days). Default 5 keeps free-plan size in check.
ARCHIVE_HOT_RETENTION_DAYS="5"
ARCHIVE_RAW_RETENTION_DAYS="2"
```

`r2Configured()` requires the four `R2_*` values. If any are empty, archive upload is skipped; **prune still runs**.

---

## 4. Verify locally

```bash
# Dry-run: counts what would upload / delete
npm run archive:dry

# Live against .env.live (uploads if R2 set, then prunes)
npm run archive:live
```

Expected when R2 is configured:

```json
{
  "ok": true,
  "daysArchived": 1,
  "articlesArchived": 1200,
  "articlesDeleted": 1200,
  "rawDeleted": 5000
}
```

Expected when R2 is **not** configured (current default):

```json
{
  "ok": true,
  "mode": "prune-only",
  "articlesDeleted": 1200,
  "rawDeleted": 5000,
  "message": "R2 not configured; pruned hot Supabase window only."
}
```

---

## 5. Production schedule

| Trigger | Path / command |
|---------|----------------|
| Vercel Cron | `GET /api/cron/archive` (see `vercel.json`, ~03:30 UTC) |
| Manual / ops | `npm run archive:live` |
| Scheduler key | `archive` (`JOB_ARCHIVE` in `src/lib/scheduler.ts`) |

After env vars are set on Vercel, redeploy so the cron can see them.

---

## 6. Website + API once R2 is live

| Surface | Behavior |
|---------|----------|
| `/archive` | Lists archived days from `index/days.json` |
| `/archive/[date]` | Day reader |
| `GET /api/v1/archive` | List / query |
| `GET /api/v1/archive/[id]` | Single archived article |

Until R2 is configured, those pages show “not configured” / empty — live `/news` is unaffected.

---

## Code map (do not delete)

| Path | Role |
|------|------|
| `src/lib/archive/r2.ts` | S3-compatible R2 client, gzip JSONL helpers |
| `src/lib/archive/export.ts` | Archive-then-prune **or** prune-only |
| `src/lib/archive/reader.ts` | Read API for marketing + `/api/v1/archive` |
| `src/worker/archive-once.ts` | CLI entry |
| `src/app/api/cron/archive/route.ts` | Cron HTTP |
| `src/app/(marketing)/archive/**` | Public archive UI |

---

## Cutover checklist

- [ ] Enable R2 in Cloudflare dashboard
- [ ] Create bucket `briefly-newsstream-archive`
- [ ] Create R2 API token (read/write)
- [ ] Set `R2_*` + `ARCHIVE_HOT_RETENTION_DAYS=5` on Vercel
- [ ] Redeploy
- [ ] `npm run archive:dry` then `npm run archive:live`
- [ ] Open `/archive` and confirm a day appears
- [ ] Confirm Supabase DB size stays well under 500 MB

---

## Notes

- Free Supabase is **500 MB database**. A 5-day hot window is the intentional safeguard while R2 is off.
- Live feed freshness (`NEWS_MAX_AGE_HOURS`, default 72h) is separate from hot retention.
- Cursor MCP `cloudflare-api` can manage R2 **after** the dashboard enable step; token secrets still belong in Vercel/env, not in git.
