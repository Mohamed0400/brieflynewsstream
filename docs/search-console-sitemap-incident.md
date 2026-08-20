# Search Console sitemap — what happened

Last updated: 2026-08-20  
Site: `https://www.brieflynewsstream.com`  
Outcome: **Success — Discovered pages: 5**

---

## Timeline

1. Site deployed on Vercel, but Google had **0 indexed / undiscovered** pages.
2. Domain verified in Google Search Console (HTML file + meta tag).
3. Sitemap submitted → first failures / “could not fetch” / unrecognized entries.
4. Root causes fixed (host mismatch, then invalid sitemap shape).
5. Simplified sitemap redeployed → GSC reported **Discovered pages: 5**.

---

## What went wrong

### 1. Apex vs `www` mismatch

Vercel serves the live site on **`www`** and **308-redirects** apex:

- `https://brieflynewsstream.com` → `https://www.brieflynewsstream.com`

Early sitemap / robots / canonicals used the **apex** host while the property and live URLs used **www**. Google then tried to fetch redirected locs and discovery stalled.

**Fix:** `publicSiteUrl()` normalizes `brieflynewsstream.com` → `www.brieflynewsstream.com`.  
Robots now advertise:

```text
Host: www.brieflynewsstream.com
Sitemap: https://www.brieflynewsstream.com/sitemap.xml
```

### 2. Sitemap shape Google rejected

The generated sitemap previously included:

- Dozens of **query-string** URLs (`?lang=en`, `?country=…`, `?category=…`)
- Heavy **`xhtml:link` hreflang** alternates on every entry

Search Console returned errors along the lines of:

> We were unable to read your Sitemap. It may contain an entry we are unable to recognize.

That pattern is a common GSC failure mode (especially query locs + xhtml alternates together).

**Fix:** `src/app/sitemap.ts` now emits **only clean path URLs**:

| URL |
| --- |
| `https://www.brieflynewsstream.com/` |
| `https://www.brieflynewsstream.com/news` |
| `https://www.brieflynewsstream.com/pricing` |
| `https://www.brieflynewsstream.com/developers` |
| `https://www.brieflynewsstream.com/coverage` |

Language alternates stay in page `<head>` (`hreflang` / metadata), not in the sitemap XML.

---

## What to submit in Search Console

Use the **www** URL property, then:

**Sitemap URL:** https://www.brieflynewsstream.com/sitemap.xml

Expected after a successful read: **Discovered pages = 5** (matching the five locs above).

---

## Related verification (ownership)

GSC ownership was verified with:

1. HTML file: `/google0900465eea138a83.html` (in `public/`)
2. Meta tag via root layout `verification.google`

Both must be **deployed on production** before Verify works (branch-only deploys are not enough).

---

## Operational notes

- Deploying to Vercel ≠ automatic Google ranking. Indexing still takes time after discovery.
- “Discovered: 5” means Google **accepted and listed** the sitemap URLs. Ranking / “Indexed” counts can lag days–weeks.
- Brand search for “Briefly” is noisy (other apps). Prefer exact domain / branded queries once indexed.
- Keep `NEXT_PUBLIC_SITE_URL` aligned with www in Vercel when possible:
  - `NEXT_PUBLIC_SITE_URL=https://www.brieflynewsstream.com`

---

## Code touchpoints

| File | Role |
| --- | --- |
| `src/lib/site-url.ts` | Canonical origin (forces www in production) |
| `src/app/sitemap.ts` | Google-safe path-only sitemap |
| `src/app/robots.ts` | Points crawlers at sitemap + host |
| `src/app/layout.tsx` | Google site verification meta |
| `public/google0900465eea138a83.html` | HTML file verification |

---

## Contrast: other projects (audit note)

While debugging, similar GSC “unrecognized entry” failures on **Sultan Gold** (`Frontend-Gold`) were traced to **corrupt `xhtml:link` URLs** (path duplication like `/news/news`) and sitemap XML files listed as page `<loc>`s. That is a separate codebase issue from Briefly NewsStream.

**Gold Standard KW** static sitemap shape was largely valid (clean path locs).

---

## Checklist if sitemap fails again

1. Open https://www.brieflynewsstream.com/sitemap.xml — confirm 5 `<url>` entries, no `?`, no `xhtml:link`.
2. Confirm property in GSC is `https://www.brieflynewsstream.com` (or Domain property covering www + apex).
3. Resubmit sitemap; wait for “Success” / discovered count.
4. Use URL Inspection → Request indexing on `/` if discovery is slow.
5. Do not reintroduce query-string country/category locs into the sitemap without validating in [Google’s sitemap docs](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) first.
