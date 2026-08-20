# SEO + AEO strategy — Briefly NewsStream

Last updated: 2026-08-20  
Primary domain: `https://brieflynewsstream.com`  
Primary geo: **Kuwait** + **Middle East / MENA / GCC** + **Arabic-speaking countries**, with global (~70 country) coverage.

This doc covers classic SEO **and** Answer Engine Optimization (AEO) so the product can appear in Google Search, Bing, and AI Overviews / answer engines—not SEO alone.

---

## Goals

1. Rank for **brand**: `Briefly NewsStream`, `Briefly News Stream`, `NewsStream API`
2. Rank for **category**: news API, JSON news API, realtime news API, headlines API
3. Rank for **geo wedge**: Kuwait news API, Middle East / Gulf / MENA / GCC news API, Arabic-speaking countries news API
4. Win **AEO citations**: clear entity answers, FAQ/HowTo schema, `llms.txt`, allow AI crawlers
5. Earn **sitelinks**: Home, Live feed, Pricing, Developers, Coverage

---

## Target regions (geo)

| Priority | Region | Languages | Intent |
| --- | --- | --- | --- |
| 1 | **Kuwait** | AR + EN | Home market; Arabic-first product default |
| 1 | **GCC** (SA, AE, QA, BH, OM) | AR + EN | Gulf market news API |
| 1 | **Wider Middle East / MENA** | AR + EN | Regional bilingual coverage |
| 1 | **Arabic-speaking countries** (EG, JO, LB, IQ, SY, YE, PS, SD, MA, TN, DZ, LY, MR, …) | AR + EN | Language + market filters |
| 2 | Global / English-speaking | EN + AR | Worldwide news API alternative |

Technical signals:

- `geo.region=KW`, `geo.placename=Kuwait, Middle East`, ICBM (Kuwait City)
- Open Graph locale `ar_KW` + alternates (`ar_SA`, `ar_AE`, `ar_EG`, `en_US`)
- JSON-LD `areaServed` Country list for KW + Arabic-speaking markets
- `hreflang`: `ar` (default `/`), `en` (`/?lang=en`), `x-default` → Arabic home

Country list lives in `src/lib/seo.ts` (`GEO_TARGET_COUNTRIES`).

---

## AEO (Answer Engine Optimization)

AEO makes the product **easy to quote** in Google AI Overviews, Bing Copilot, Perplexity, ChatGPT Browse, Claude, etc.

### Implemented

| Signal | Where |
| --- | --- |
| Direct entity answer | `AEO_ENTITY_ANSWER_EN/AR` in `seo.ts`; FAQ “What is Briefly NewsStream?” |
| FAQPage JSON-LD | Home FAQs (what / where / Arabic / impact / archive / key / Pro) |
| HowTo JSON-LD | “How to get an API key” on home |
| WebPage + SpeakableSpecification | Home hero + FAQ selectors |
| Service + SoftwareApplication | Audience + areaServed geo |
| `llms.txt` | `/llms.txt` (public) — citeable summary for AI crawlers |
| Robots allow AI bots | GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended, etc. |
| Answer-first copy | Hero lede + FAQ first sentences state the answer |

### AEO content rules (keep)

1. First sentence of each FAQ answer must stand alone as a citation.
2. Prefer “X is …” / “Yes. …” over soft marketing.
3. Keep `/llms.txt` short, factual, and synced with product truth.
4. Do not block AI crawlers on public marketing pages.

---

## Keyword pillars

### Brand
- Briefly NewsStream / Briefly News Stream / NewsStream API

### Category (parity)
- news API / newsapi / JSON / REST / realtime / live / headlines / free / pricing / API key

### Geo differentiation (win)
- Kuwait news API / Kuwait market news / أخبار الكويت
- Middle East / Gulf / MENA / GCC news API
- Arabic news API / bilingual AR+EN / Arabic-speaking countries news API
- Saudi / UAE / Egypt / Jordan / … national API terms (see `SEO_KEYWORDS_*`)

Full lists: `src/lib/seo.ts`.

---

## Public URL map

| Path | Role | Priority |
| --- | --- | --- |
| `/` | Home + AEO entity | 1.0 |
| `/news` | Live feed | 0.95 |
| `/pricing` | Plans | 0.9 |
| `/developers` | API overview | 0.9 |
| `/coverage` | Geo / country story | 0.85 |
| `/llms.txt` | AI crawler brief | — |
| `/sitemap.xml` | Discovery | — |

Console (`/console/*`) stays **noindex**.

---

## Structured data checklist

- [x] Organization (+ areaServed KW/MENA/Arabic countries)
- [x] WebSite + SearchAction
- [x] WebPage + Speakable
- [x] SoftwareApplication + Offers + Audience
- [x] Service
- [x] FAQPage
- [x] HowTo (API key)
- [x] BreadcrumbList
- [x] CollectionPage (news / coverage)

Validate: [Google Rich Results Test](https://search.google.com/test/rich-results)

---

## Post-launch (required for search appearance)

1. **Google Search Console** → property `brieflynewsstream.com` → submit `sitemap.xml`
2. Request indexing: `/`, `/news`, `/pricing`, `/developers`, `/coverage`
3. **Bing Webmaster Tools** (strong for MENA + Copilot)
4. Confirm Search Console “International targeting” / language settings for AR+EN (optional; hreflang is primary)
5. Monitor queries: brand, “Kuwait news API”, “Arabic news API”, “Middle East news API”

Ranking for head terms takes time. Schema + geo + AEO make the site **eligible and citeable**; they do not buy #1 overnight.

---

## What not to do

- Do not keyword-stuff city names into every sentence of UI copy.
- Do not noindex public marketing pages.
- Do not block GPTBot / Google-Extended on `/`, `/news`, `/llms.txt`.
- Do not invent awards, user counts, or payment features that are not live.
