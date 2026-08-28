# SEO / AEO / GEO Audit — Gulf, Kuwait & Arabic Markets

**Date:** 2026-08-28  
**Domain:** https://www.brieflynewsstream.com  
**Primary wedge:** Arabic / Gulf / MENA market news API & live briefing  
**Constraint:** No explicit “Kuwait focus” on homepage hero — regional signals only (Gulf, MENA, regional desks)

---

## Executive summary

Briefly NewsStream has a **strong technical SEO foundation** (Arabic-default site, hreflang, JSON-LD, AI crawlers allowed, `llms.txt`, news sitemap). The main gaps for ranking in Kuwait, the Gulf, and the wider Arabic world were **signal mismatch**, not missing infrastructure:

- Kuwait stories were excluded from the default `/news` feed
- News sitemap declared all articles as English
- No `/markets/kuwait` hub while SA/UAE/EG hubs existed
- Product positioning as “API” rather than a news briefing destination

**Estimated overall readiness:** 7.2/10 — solid base; domain authority and head-term competition still limit instant “#1 on Google” for generic news queries.

---

## Target keywords (validate in Search Console)

| Cluster | Primary terms | Landing surface |
| --- | --- | --- |
| Gulf API | Gulf news API, GCC news API, أخبار الخليج | `/markets/gcc`, `/news` |
| Kuwait API | Kuwait news API, أخبار الكويت | `/markets/kuwait` (metadata/hub — not homepage) |
| Arabic API | Arabic news API, bilingual news API | `/`, `/developers` |
| MENA | MENA market news, Middle East news API | `/markets/mena`, guides |

**Head terms (12–24 month):** أخبار الكويت, أخبار الخليج, Kuwait news — dominated by established publishers; win via long-tail API/briefing terms first.

---

## Audit scores

### Technical SEO — 8.5/10

| Check | Status |
| --- | --- |
| SSR metadata + canonical | PASS |
| `robots.ts` + AI bots allowed | PASS |
| Main sitemap + news-sitemap | PASS (after language fix) |
| hreflang ar / en / x-default | PASS |
| HTTPS, Next.js SSR | PASS |
| IndexNow / Bing Webmaster | Post-launch TODO |

### On-page SEO — 7/10

| Page | Notes |
| --- | --- |
| `/` | Rich schema; positions as API not news publisher |
| `/news` | Improved Gulf/MENA metadata + Speakable |
| `/markets/gcc` | Strong regional hub |
| `/markets/kuwait` | **Added** — country hub without homepage mention |
| `/news/{id}` | NewsArticle schema per story |

### GEO / AEO — 7.5/10

| Signal | Status |
| --- | --- |
| `llms.txt` with Gulf/Kuwait paths | Updated |
| FAQ / HowTo / Speakable | Home + `/news` |
| NewsMediaOrganization schema | **Added** on `/news` |
| AI crawler access | Open (GPTBot, ClaudeBot, PerplexityBot, etc.) |
| Original stats / citations in copy | Gap — P1 |

### Content (CORE-EEAT quick scan) — FIX

- Strong bilingual structure and coverage metadata
- Weak: named editorial team, corrections policy, first-party reporting (aggregator model)
- Compete on **API + briefing long-tail**, not Al Jazeera-style head news initially

---

## Changes shipped (2026-08-28)

| Change | File(s) | Why |
| --- | --- | --- |
| `/markets/kuwait` hub | `src/lib/market-hubs.ts` | Country landing for Kuwait API queries |
| Kuwait keywords in meta | `src/lib/seo.ts` | `Kuwait news API`, `أخبار الكويت` |
| `ar_KW` OG locale | `src/lib/seo.ts` | Subtle Kuwait Arabic signal |
| `NewsMediaOrganization` + Speakable on `/news` | `seo.ts`, `news/page.tsx` | News + AI citation |
| News sitemap language = `ar` for Gulf/MENA Arabic stories | `news-sitemap.xml/route.ts` | Was hardcoded `en` |
| Removed KW exclusion from default `/news` feed | `news/page.tsx` | Crawlers/users see Kuwait stories |
| Gulf-aware `/news` copy & metadata | `landing-translation.ts`, `news/page.tsx` | Regional without naming Kuwait on hero |
| Guide: Gulf/GCC market news API | `src/lib/guides.ts` | Topic cluster + GEO |
| Updated `llms.txt` | `public/llms.txt` | AI engine discovery |

**Homepage rule preserved:** no explicit Kuwait focus in product hero (per `design-system/pages/landing.md`).

---

## Priority roadmap

### P0 — After deploy

1. Submit sitemap in [Google Search Console](https://search.google.com/search-console)
2. Request indexing: `/markets/kuwait`, `/guides/gulf-gcc-market-news-api`, `/news`
3. Register [Bing Webmaster Tools](https://www.bing.com/webmasters) (ChatGPT/Copilot index)
4. Baseline rank tracking for: Gulf news API, أخبار الخليج, Arabic news API, Kuwait news API

### P1 — 30 days

1. Ensure cron collect keeps `/news` and news-sitemap fresh (07:00 / 14:00 / 22:00 Kuwait)
2. Internal links: `/coverage`, `/markets/gcc` → `/news` with descriptive anchors
3. Add dated stats to guides (freshness + GEO citation boost)
4. Authentic off-site mentions (Reddit, Gulf dev/fintech communities)
5. IndexNow on Bing after deploy batches

### P2 — 90 days

1. Linkable asset: weekly “Gulf market impact index”
2. Editorial backlinks from Gulf tech/media
3. YouTube Shorts for top Gulf market story (AI Overview multi-modal)
4. Wikidata / Wikipedia entity if eligible

---

## Realistic ranking targets

| Surface | 90 days | 12 months |
| --- | --- | --- |
| Organic long-tail | Page 1 for 5–10 API/Gulf terms | Top 3 for Gulf news API cluster |
| AEO / snippets | 2–3 how-to API snippet wins | Featured snippets on MENA guides |
| GEO / AI citations | Perplexity/ChatGPT for “Arabic news API” | Regular Gulf developer-query citations |

Measure with **28-day readback windows** after each change — do not react to week-1 noise.

---

## Monitoring alerts (recommended)

| Metric | Warning | Critical |
| --- | --- | --- |
| Organic traffic | −15% WoW | −30% WoW |
| Gulf keyword position | >3 drop | >5 drop |
| Pages indexed | −5% | −20% |
| AI citation on key queries | Any loss | >20% query loss |

---

## Key file references

| Asset | Path |
| --- | --- |
| SEO library | `src/lib/seo.ts` |
| Market hubs | `src/lib/market-hubs.ts` |
| News page | `src/app/(marketing)/news/page.tsx` |
| News sitemap | `src/app/news-sitemap.xml/route.ts` |
| Robots | `src/app/robots.ts` |
| llms.txt | `public/llms.txt` |
| Strategy (original) | `docs/seo-strategy.md` |

---

## Open loops

- [ ] GSC + Bing registration and baseline rankings
- [ ] Validate keyword volumes from Search Console (not estimated)
- [ ] IndexNow key for Bing/Yandex instant discovery
- [ ] Decide on footer internal link block → `/markets/gcc` + `/news`

---

## Handoff

**Status:** `DONE_WITH_CONCERNS` — code fixes shipped; authority and head-term competition remain.  
**Next skills:** rank-tracker (baseline) → performance-monitor (monthly) → content-writer (Gulf data report P2).
