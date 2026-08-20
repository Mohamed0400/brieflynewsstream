# Briefly NewsStream — Competitor Landing Brief

**Document purpose:** Marketing and design brief for a million-dollar B2B SaaS landing page for Briefly NewsStream (Arabic-first bilingual market news API).  
**Research date:** 2026-08-20  
**Method:** Direct fetch of competitor marketing homepages and pricing pages; synthesis against NewsStream product pillars.  
**Geo focus:** Marketing may name **Kuwait**, **Middle East / MENA / GCC**, and **Arabic-speaking countries** (plus national markets). Avoid stuffing every UI line with city names; prefer country and region clarity for SEO/AEO.

---

## 1. Executive synthesis (read this first)

Generic “news JSON APIs” compete on **source count, language count, free tier, and code snippets**. None of them own:

| Gap in the category | NewsStream wedge |
| --- | --- |
| English-default, Arabic as “one of N languages” | **Arabic-first bilingual (AR + EN) as the product identity** |
| Raw articles / sentiment at best | **Market-impact scoring** as the ranking signal |
| Headlines dumps | **Community briefings** (audience-shaped editions) |
| Ephemeral free-tier history | **Permanent archive** as a reliability promise |
| Key-in-dashboard only | **Developer console** (keys, explorer, schedule, docs) as a product surface |

**Positioning one-liner (EN):**  
*The Arabic-first market news API — bilingual AR+EN articles, impact-ranked, briefed for communities, archived permanently.*

**Positioning one-liner (AR direction):**  
Lead with Arabic as the default product language on the marketing site and in API defaults; English as first-class twin, not a translation afterthought.

**Category pattern to steal:** Hero → social proof → live demo/code → capability stats → feature grid → use cases → pricing teaser → FAQ → final CTA.  
**Category pattern to reject:** Broadsheet/newspaper chrome, purple-AI gradients, fake Fortune logo walls, “best news API” empty superlatives without a wedge.

---

## 2. Competitor dossiers

### 2.1 World News API — [worldnewsapi.com](https://worldnewsapi.com)

#### Hero promise + primary CTA
- **Hero:** “The only News API you'll ever need.”
- **Supporting:** Thousands of sources, **86+ languages**, **210+ countries**, real-time + semantic tagging.
- **Primary CTAs:** “Get a Free API Key” · “Platform Overview (PDF)”
- **Secondary proof line:** “Join 12,000+ successful developers” + named institutional trust (Palantir / universities).

#### Section order (landing)
1. Hero + dual CTAs + developer count  
2. Trust / “used by” logos  
3. Capability pillars: World Wide Coverage · Semantic Tagging · Sentiment Analysis  
4. **Newsroom** (no-code browser workspace for every endpoint)  
5. Newspaper front pages product story (6,000+ publications / 125 countries)  
6. Top news by country (clustering)  
7. Search international sources  
8. Search by geo location  
9. Semantic search + text filtering  
10. Filter by source country & language  
11. Time-frame search  
12. Sentiment filter  
13. MCP / AI-agent integration  
14. Example use cases with live-looking GET URLs  
15. Search demos (map circle, query filters)  
16. Docs / SDK CTAs  
17. FAQ  
18. Contact / Discord / AI chat  

#### Visual language
- **Mode:** Light, clean product marketing; utilitarian developer SaaS.  
- **Density:** High — long scroll, many feature chapters, demo embeds.  
- **Typography feel:** Neutral sans; “platform overview” PDF energy more than consumer brand.  
- **Signature motif:** Newspaper front pages and a news globe — *they sell “press room” as spectacle*.  
- **Accent:** Functional blues/greens typical of API marketing; not theatrical.

#### What they brag about
| Claim | Detail |
| --- | --- |
| Countries | 210+ |
| Languages | 86+ |
| Volume | 170k+ articles/day |
| Enrichment | NER (person/org/location), author, image/video, sentiment (EN/DE) |
| Differentiator | Front pages API, semantic entities, Newsroom UI, MCP |
| Latency | Implied real-time indexing; rate limits via “points” and RPS |

#### Pricing teaser structure
- Homepage FAQ: free = **50 points/day**, paid from **$9/month** (marketing line); full pricing page is more granular.  
- Pricing page tiers (names are editorial): **Free → Reporter ($39) → Journalist ($379) → Editor ($1,779)**  
- Metered **points/day** + overage per point; history, SLA, front pages, and backlink requirements escalate by tier.  
- Free requires **backlink**; paid removes it.

#### Takeaway for NewsStream
Steal: interactive evaluation surface (their Newsroom ≈ our console/explorer).  
Do not steal: newspaper-front-page visual identity or “only API you’ll ever need” hyperbole.  
Beat: they are globally broad and shallow on **market relevance** and **Arabic-first bilingual product design**.

---

### 2.2 News API — [newsapi.org](https://newsapi.org)

#### Hero promise + primary CTA
- **Hero:** “Search worldwide news with code”
- **Sub:** Locate articles and breaking headlines from sources and blogs across the web with a JSON API.
- **Primary CTA:** “Get API Key”
- **Hero mechanic:** Carousel of concrete GET examples (Apple / Tesla / US business / TechCrunch / WSJ).

#### Section order (landing)
1. Hero + Get API Key + example request carousel  
2. Logo wall — “Trusted by over 500,000 developers”  
3. Product definition (REST + JSON; 150,000+ sources)  
4. Three pillars: Worldwide Scale · Easy Integration · Free for Development  
5. Filter deep-dive: keywords · dates · publishers · languages  
6. Testimonials (AI media, political product, ESG NLP)  
7. (Pricing lives on `/pricing`, not deeply embedded on home)

#### Visual language
- **Mode:** Light Material-ish developer site; sparse, confident whitespace.  
- **Density:** Low–medium; short homepage relative to GNews/World News.  
- **Typography:** Clean geometric sans; “documentation landing” more than brand theater.  
- **Signature motif:** Code examples as hero art; Fortune-style logo strip.  
- **Accent:** Teal/green CTAs historically associated with the brand; very little decoration.

#### What they brag about
| Claim | Detail |
| --- | --- |
| Developers | 500,000+ |
| Sources | 150,000+ worldwide |
| Scale | Hundreds of millions of articles; **14 languages**, **55 countries** |
| DX | Simple HTTP GET + SDKs |
| Free | Dev/testing, no card |
| Honesty gap | Pricing FAQ: **full article content is not provided** |

#### Pricing teaser structure
- Home: “Free for Development” only.  
- `/pricing`:  
  - **Developer $0** — 100 req/day, 24h delay, ~1 month history, localhost CORS  
  - **Business ~$449/mo** — 250k req/mo, real-time, up to 5 years history  
  - **Advanced ~$1,749/mo** — 2M req/mo, SLA  
  - **Enterprise** — clustering, enrichment, on-prem, unlimited  
- Yearly billing discount (~20%) called out.

#### Takeaway for NewsStream
Steal: hero-as-working-request; restraint; developer trust through clarity.  
Do not steal: empty mega logo walls if we cannot substantiate; English-centric “14 languages” framing.  
Beat: NewsAPI is the category default and **expensive** at commercial tiers; weak on Arabic-first, impact ranking, and full bilingual payloads.

---

### 2.3 mediastack — [mediastack.com](https://mediastack.com)

#### Hero promise + primary CTA
- **Eyebrow:** “Global News Data”
- **Hero:** “Free, Simple REST API for Live News & Blog Articles”
- **Sub:** Scalable JSON API for worldwide news, headlines, and blogs in real time.
- **Proof chips:** 7,500+ sources · 100 free requests/month · 50+ countries · multiple languages  
- **Primary CTA pattern:** Free plan / Get Free API Key (repeated).

#### Section order (landing)
1. Hero + free-plan chips  
2. Four benefit cards (global feeds, 7,500 sources / 50 countries, scalable JSON, free plan)  
3. **APILayer suite cross-sell** (aviationstack, marketstack, etc.)  
4. Feature checklist (real-time, historical, headlines, sources, countries, languages)  
5. Large JSON response showcase  
6. Docs CTA + Get Free API Key  
7. Support tier comparison modal content (Standard vs Platinum)

#### Visual language
- **Mode:** APILayer family look — dark/navy product chrome with high-contrast CTAs (common across apilayer properties).  
- **Density:** Medium; template-driven SaaS blocks.  
- **Typography:** Corporate product sans; little editorial personality.  
- **Signature motif:** JSON blob as proof; “one key across many APIs” platform story.  
- **Feel:** Reliable commodity API, not category-defining brand.

#### What they brag about
| Claim | Detail |
| --- | --- |
| Sources | 7,500+ |
| Countries | 50+ |
| Languages | 13 |
| Infra | apilayer cloud, near-100% uptime messaging |
| Freshness | Updated as often as every minute |
| Customers | “2,000+ happy customers” on pricing page |

#### Pricing teaser structure
- Home: Free plan + 100 calls/month prominently.  
- Product pricing:  
  - **Free $0** — 100 calls/mo, delayed data, 13 languages, no support  
  - **Standard ~$24.99/mo** — 10k calls, live + historical  
  - **Professional ~$99.99/mo** — 50k calls  
  - **Business ~$249.99/mo** — 250k calls  
  - **Enterprise** custom  
- Annual discount (~8–15%); optional Platinum support add-on priced annually.

#### Takeaway for NewsStream
Steal: ruthless clarity of “free → get key → JSON”.  
Do not steal: generic APILayer template energy or cross-sell clutter.  
Beat: commodity positioning; no bilingual market intelligence story.

---

### 2.4 GNews — [gnews.io](https://gnews.io)

#### Hero promise + primary CTA
- **Hero:** “The Best Real-Time News API for Developers”
- **Sub:** Search real-time articles from **80,000+ sources**, **41 languages**, **71 countries**; historical back to **2020**; clean JSON; build monitoring/aggregation/analytics in minutes.
- **CTA framing:** Start on free tier instantly, no credit card.  
- **Primary end CTA:** “Get API key” · “Go to documentation”

#### Section order (landing)
1. Hero + free-tier promise  
2. **Interactive “Try GNews API”** live search + JSON preview  
3. Logo / “150,000+ developers” trust  
4. Three pillars: Easy-to-use · Start for free · Fast, accurate responses  
5. Big stats grid (100M+ articles, 80k sources, 41 langs, 71 countries, 6+ years history, 24/7)  
6. Endpoints explainer (Search vs Top Headlines) + multi-language code tabs  
7. Capability grid (worldwide scale, rich article data, historical, live crawl, latency, easy integration)  
8. SDKs & MCP server  
9. Missing sources / student access side offers  
10. Advanced operators + full content on paid  
11. Use-case grid (monitoring, brand, finance, AI/RAG, aggregation, academic)  
12. Three-step onboarding  
13. **Full pricing table on homepage**  
14. FAQ  
15. Closing CTA  

#### Visual language
- **Mode:** Modern long-form SaaS; polished, conversion-optimized.  
- **Density:** Very high — homepage *is* the sales deck.  
- **Typography:** Contemporary product sans; marketing-confident headlines.  
- **Signature motif:** Live try-it widget + enormous stat strip + on-page pricing.  
- **Feel:** Closest to a “million-dollar” competitor landing in structure (not necessarily in taste).

#### What they brag about
| Claim | Detail |
| --- | --- |
| Developers | 150,000+ |
| Articles | 100M+ |
| Sources | 80,000+ |
| Languages | 41 |
| Countries | 71 |
| History | From 2020 (6+ years) |
| Performance | Millisecond responses; indexed DB not scrape-on-demand |
| AI | Official SDKs + MCP server |
| Content | Full article text on paid plans |

#### Pricing teaser structure (on homepage)
| Plan | Price | Highlights |
| --- | --- | --- |
| Free | €0 | 100 req/day, 10 articles/req, **12h delay**, 30 days history |
| Essential | €49.99/mo | 1k/day, real-time, history from 2020, full content — “Most popular” |
| Business | €99.99/mo | 5k/day |
| Enterprise | €249.99/mo | 25k/day |
| Custom | “Create Your Own Plan” | |

Yearly = ~20% off. 10-day paid-feature trial.

#### Takeaway for NewsStream
Steal: section completeness (try → stats → endpoints → use cases → pricing → FAQ); on-page pricing honesty; MCP/SDK callouts if true.  
Do not steal: “The Best …” claim; Euro-generic global sameness.  
Beat: No Arabic-first bilingual identity; no market-impact layer; no community briefings product.

---

### 2.5 The News API — [thenewsapi.com](https://thenewsapi.com)

#### Hero promise + primary CTA
- **Hero:** “Free worldwide news API”
- **Sub:** Search worldwide news and top stories from **40,000+ sources** in **50+ countries**.
- **Primary CTA:** “GET FREE API KEY” (all caps, repeated).

#### Section order (landing)
1. Hero + free key CTA  
2. Three stat cards: 50+ countries · 1M+ new articles weekly · 30+ languages  
3. “News data for any requirement” / easiest-way pitch + CTA  
4. Filtering capabilities (full-text, filters, fast caching)  
5. Live JSON dump of top stories  
6. Short FAQ (what / why / do I pay?)  

#### Visual language
- **Mode:** Light, minimal, budget indie-SaaS.  
- **Density:** Low; short page.  
- **Typography:** Simple system-like sans; little brand craft.  
- **Signature motif:** Raw live JSON wall.  
- **Feel:** Functional freemium lead-gen, not premium B2B.

#### What they brag about
| Claim | Detail |
| --- | --- |
| Sources | 40,000+ |
| Countries | 50+ |
| Languages | 30+ |
| Volume | 1M+ articles/week |
| Speed | “State of the art caching” |
| Cost | Aggressive free + low paid tiers |

#### Pricing teaser structure
Homepage says free plan is truly free. Pricing page:
- **Free $0** — 100 req/day, 3 articles/req  
- **Basic $19** — 2.5k/day  
- **Standard $49** (Popular) — 10k/day  
- **Pro $79** — 25k/day  
- Custom SLA / volume  
- Yearly ~20% off  

#### Takeaway for NewsStream
Steal: nothing strategic except reminder that **cheap free tiers set buyer expectations**.  
Do not steal: all-caps CTAs, under-designed brand, “free” as the whole story.  
Beat: Easily — on product depth, bilingual quality, and B2B polish.

---

### 2.6 Currents API — [currentsapi.services](https://currentsapi.services/en) (relevant adjacent)

Homepage is thin/SEO-fragmented; marketing depth lives on intro + pricing + feature-compare pages.

#### Hero promise + primary CTA (intro / data pages)
- **Promise:** Real-time global news JSON with developer-friendly endpoints; **global news data with geolocation**.  
- **Stats (intro):** 26M+ articles · **70+ countries** · **20+ languages** · multi-year archive.  
- **Included angles:** Stock exchange news · local/regional · geolocation · diverse perspectives.  
- **CTAs:** Get API Access · Read Documentation · Create Free Account.

#### Section order (typical across marketing pages)
1. Category promise + stats  
2. What’s included feature cards  
3. Endpoint product pages (Latest News vs Search)  
4. Pricing with quota / history / usage-rights framing  
5. Competitor comparison tables  
6. FAQ / docs links  

#### Visual language
- **Mode:** Content-site / docs-marketing hybrid more than single cinematic landing.  
- **Density:** Medium–high across many URLs (SEO cluster).  
- **Typography:** Plain documentation marketing.  
- **Signature motif:** Geolocation + usage-rights honesty tables.  
- **Feel:** Practical, compliance-aware, less “brand.”

#### What they brag about
| Claim | Detail |
| --- | --- |
| Archive | 26M+ articles, ~4 years |
| Countries | 70+ (notable: same ballpark as NewsStream’s ~70) |
| Languages | 20+ |
| Differentiator | Geolocation / regional; stock exchange announcements |
| Freshness | Newly indexed stories without artificial plan delay (claimed) |
| Rights | Explicit redistribution / OEM / archive restrictions |

#### Pricing teaser structure
- **Developer $0** — 250 req/day, max 20 results, ~30 days history  
- **Builder $69** — 75k req/mo, 6 months history  
- **Professional $150** — 300k req/mo, 1 year history  
- **Scale $300** — 600k req/mo, 1 year history  
- Strong **usage rights** matrix (self-service vs enterprise terms)

#### Takeaway for NewsStream
Steal: transparent usage-rights language (builds enterprise trust).  
Caution: their “local/regional/cities” angle is the opposite of our hard rule — we cover countries, not city marketing.  
Beat: Arabic-first bilingual + market-impact + community briefings + permanent archive + console product.

---

## 3. Cross-competitor pattern matrix

| Pattern | World News | NewsAPI | mediastack | GNews | The News API | Currents |
| --- | --- | --- | --- | --- | --- | --- |
| Hero CTA = Get API Key | Yes | Yes | Yes | Yes | Yes | Yes |
| Live try / code in hero | Demos mid-page | Carousel | JSON mid-page | Live search | Live JSON | Docs-led |
| Logo / developer count wall | 12k | 500k | soft | 150k | — | — |
| Stats strip (sources/langs/countries) | Yes | Mild | Yes | Heavy | Yes | Yes |
| Pricing on homepage | Tease/FAQ | Separate | Tease | Full table | Tease | Separate |
| AI / MCP callout | Yes | Testimonials only | No | Yes | No | Mild |
| Enrichment beyond raw news | Semantic + sentiment | Enterprise only | No | Full text paid | No | Geo / stock |
| Arabic-first bilingual | No | No | No | No | No | No |
| Market-impact ranking | No | No | No | No | No | No |
| Community briefings | No | No | No | No | No | No |
| Product console beyond key | Newsroom | Dashboard | APILayer dash | Dashboard | Basic | Basic |

**Buyer psychology in this category:**  
1) Can I get a key in 60 seconds?  
2) Will the JSON look clean?  
3) How many countries/languages/sources?  
4) What’s free vs what breaks in production (delay, history, CORS, content fields)?  
5) Can I trust commercial pricing / SLA / rights?

NewsStream must answer (1)–(4) as well as peers, then win on (5) plus **product intelligence pillars peers lack**.

---

## 4. Recommended section map — Briefly NewsStream landing

Goal: million-dollar B2B SaaS landing — one composition in the first viewport, then a disciplined scroll. Arabic-first bilingual site (AR default, EN toggle), RTL-aware layout.

### 4.1 First viewport (hard composition budget)
**Only:**
1. **Brand** — Briefly NewsStream (hero-level, not nav-only)  
2. **One headline** — wedge, not “best API”  
3. **One supporting sentence** — bilingual market news + impact + archive  
4. **One CTA group** — Primary: `Get API key` / `ابدأ بمفتاح API` · Secondary: `Open console` or `View docs`  
5. **One dominant visual** — Product truth: console explorer, bilingual article payload, or impact-ranked feed — full-bleed or edge-to-edge plane, **not** inset newspaper collage  

**Explicitly not in first viewport:** pricing tables, mega stats grids, logo walls, FAQ, use-case card farms, fake awards.

### 4.2 Full section map (recommended order)

| # | Section | Job | Suggested EN headline direction | Notes |
| --- | --- | --- | --- | --- |
| 0 | Nav | Orient | Product · Docs · Pricing · Console · Lang toggle | Keep quiet; brand still wins in hero |
| 1 | Hero | Promise | e.g. “Market news API, Arabic-first.” | Sub: bilingual AR+EN, impact-ranked, permanent archive |
| 2 | Proof strip (thin) | Trust without fake logos | “Built for developers shipping market products” | Prefer metrics we can defend (~70 countries, bilingual coverage %) over logo theater |
| 3 | Live product moment | Reduce integration fear | “See a bilingual, impact-ranked response” | Interactive console preview or static-but-real JSON with AR/EN fields + `impactScore` |
| 4 | Pillar: Arabic-first bilingual | Category break | “Every story ships in Arabic and English.” | Emphasize storage + API defaults, not “we support Arabic too” |
| 5 | Pillar: Market-impact scoring | Why not raw RSS | “Rank by market impact, not noise.” | Explain signal for gold/markets/finance readers without city names |
| 6 | Pillar: Community briefings | Edition product | “Briefings shaped for communities.” | Nationality/audience editions as product — **no city locale marketing** |
| 7 | Coverage | Parity with category | “~70 countries. One consistent schema.” | Country coverage, not city lists; avoid newspaper front-page gallery |
| 8 | Developer console | Surface > key vault | “Operate the feed from a real console.” | Keys, explorer, schedule, docs — screenshot of *our* UI |
| 9 | Permanent archive | Enterprise reliability | “History that doesn’t expire with your plan theater.” | Contrast free-tier 30-day traps carefully/factually |
| 10 | Use cases (max 4) | B2B imagination | Monitoring · market research · bilingual apps · agent/RAG grounding | One job each; no 6-up icon junk |
| 11 | Pricing teaser | Convert | Free eval → Pro → Scale → Enterprise | Show limits that matter: requests, history, bilingual fields, console seats |
| 12 | FAQ | Objection handling | Latency, languages, commercial use, archive, SLA | Mirror competitor FAQ hygiene |
| 13 | Final CTA | Close | “Get your API key” | Repeat primary action only |

### 4.3 Optional later (not v1 homepage)
- Customer stories (only when real)  
- Status page link  
- MCP/SDK only if shipped  
- Compare-to-NewsAPI page (sales enablement, not hero)

---

## 5. Copy pillars we can win on

Use these as the **only** primary messages. Everything else is support.

### Pillar A — Arabic-first bilingual (AR + EN)
**Win condition:** Buyer believes Arabic is the default product language, English is complete twin data — not machine-garbled afterthought.  
**Proof to show:** Dual fields in payload (`titleAr` / `titleEn`, summaries), `lang` default behavior, console language toggle.  
**Avoid:** “Supports 40+ languages” race we will lose; token multilingual laundry lists.

### Pillar B — Market-impact scoring
**Win condition:** Feed is for **markets**, not entertainment news dumps.  
**Proof to show:** Ranked edition, `impact` (or equivalent) in API, “today’s top stories by impact.”  
**Avoid:** Generic “AI-powered relevance” purple prose; explain the job-to-be-done.

### Pillar C — Community briefings
**Win condition:** Differentiated endpoint/product: short, audience-shaped briefings — not another `/everything` clone.  
**Proof to show:** Briefing size, freshness, audience filters as **community/nationality audiences**, never city tourism copy.  
**Hard rule reminder:** No Kuwait, no city names in marketing.

### Pillar D — ~70 country coverage
**Win condition:** Credible global coverage without fake “210 countries” arms race unless true.  
**Proof to show:** Consistent country taxonomy, filters, schema sameness.  
**Avoid:** Inflated source counts we can’t audit; front-page newspaper mosaics.

### Pillar E — Developer console
**Win condition:** Feels like a product company, not a key generator landing.  
**Proof to show:** Real console screenshots — API keys, explorer, docs, schedule.  
**Avoid:** Figma fantasy dashboards.

### Pillar F — Permanent archive
**Win condition:** Historical access framed as infrastructure, not a gotcha upgrade.  
**Proof to show:** Clear retention policy on pricing; contrast category’s 24h delay / 30-day free traps *factually*.  
**Avoid:** Promising publisher republication rights we don’t have (learn from Currents’ rights matrix).

---

## 6. Messaging do / don’t

### Do
- Lead with **Arabic-first** and **market** in the same breath.  
- Show **real JSON** with bilingual fields and impact.  
- Price with **honest limits** (requests, history, commercial use).  
- Keep visual system: confident typography, atmospheric but non-generic background, product as the image.  
- Ship AR/EN landing parity (RTL included).

### Don’t (anti-patterns)
| Anti-pattern | Why it hurts |
| --- | --- |
| **Newspaper / broadsheet look** | Hairline rules, dense columns, masthead chrome — World News leans this via front pages; user rules forbid it; also confuses “we are a newspaper” vs “we are a data API.” |
| **Purple AI gradients / glow / orb UI** | Default AI-slop; category already saying “MCP” without taste. |
| **Fake logo walls** | NewsAPI/GNews style trust theater without contracts = credibility risk. |
| **“Best real-time news API”** | Unprovable; GNews already burned the phrase. |
| **City-specific or Kuwait mentions** | **Hard ban** in all marketing copy. |
| **Source-count arms race as hero** | We lose to 80k–150k claims; win on bilingual market intelligence instead. |
| **Card farms in hero** | Breaks first-viewport composition rules. |
| **All-caps Free CTA spam** | The News API energy — cheapens B2B. |
| **Inset collage of random outlet logos** | Looks like a clip-art news aggregator. |

---

## 7. Pricing teaser recommendation (homepage)

Mirror category hygiene without copying their numbers blindly:

1. **Free / Builder** — Evaluate: daily request cap, bilingual responses, console access, limited history window (state truthfully).  
2. **Pro** — Production: higher quota, full filters, community briefings, commercial use.  
3. **Scale** — Higher throughput + archive depth.  
4. **Enterprise** — Custom SLA, volume, SSO/support — “Contact us.”

Homepage should show **3 columns + enterprise link**, not 6 confusing meters. Put the detailed matrix on `/pricing`.

Call out differentiators in the comparison rows competitors lack:
- Arabic + English fields on every article  
- Market-impact ranking  
- Community briefings endpoint  
- Permanent archive policy (as actually offered)  
- Developer console included  

---

## 8. Visual direction for NewsStream (relative to competitors)

| Competitor default | NewsStream direction |
| --- | --- |
| Light Material / apilayer navy / indie white | **Defined brand atmosphere** (gradient or subtle pattern OK) — not flat white, not purple void |
| Code-only heroes | **Product console + bilingual payload** as the dominant visual |
| Newspaper front pages | **Impact-ranked market feed UI** |
| Logo walls | Thin proof metrics or real customers only |
| Dense 15-section scrolls | Disciplined map in §4; cut ruthlessly |

Typography: expressive, purposeful (avoid Inter/Roboto/Arial defaults).  
Motion: 2–3 intentional moments (e.g. language toggle AR↔EN, impact score settle, console panel reveal) — not particle noise.

---

## 9. Sample copy blocks (draft, locale-safe)

> **Hard rule applied:** no Kuwait, no city names.

### Hero (EN)
**Briefly NewsStream**  
**Market news API, Arabic-first.**  
Bilingual AR+EN articles, ranked by market impact, with community briefings and a permanent archive — built for developers.  
[Get API key] [Explore console]

### Hero (AR direction)
**Briefly NewsStream**  
**واجهة أخبار الأسواق — العربية أولاً.**  
مقالات بالعربية والإنجليزية، مرتبة حسب أثر السوق، مع إحاطات مجتمعية وأرشيف دائم — للمطوّرين.  
[احصل على مفتاح API] [افتح لوحة التحكم]

### Pillar lines
- **Bilingual:** “Every article is stored and served in Arabic and English.”  
- **Impact:** “Sort the feed by market impact so teams read what moves markets.”  
- **Briefings:** “Ship short community briefings without building your own editorial stack.”  
- **Coverage:** “Consistent coverage across ~70 countries in one schema.”  
- **Console:** “Keys, explorer, scheduling, and docs in one developer console.”  
- **Archive:** “Query history without wondering what your plan quietly deleted.”

---

## 10. Competitive gap → homepage checklist

Before launch review, the landing must make these gaps obvious in ≤10 seconds of scroll:

- [ ] Arabic-first is visible without reading body copy (brand + headline + UI language)  
- [ ] Sample payload shows AR + EN fields  
- [ ] Impact ranking is named and shown  
- [ ] Community briefings named as a product capability  
- [ ] ~70 countries stated without city laundry lists  
- [ ] Console shown as a real product surface  
- [ ] Archive promise stated in pricing terms of art we can keep  
- [ ] Zero Kuwait / city-specific locale strings in marketing  
- [ ] No newspaper chrome, purple AI gradient, or fake logos  

---

## 11. Source URLs consulted

| Competitor | URLs |
| --- | --- |
| World News API | https://worldnewsapi.com · https://worldnewsapi.com/pricing |
| News API | https://newsapi.org · https://newsapi.org/pricing |
| mediastack | https://mediastack.com · https://mediastack.com/product |
| GNews | https://gnews.io |
| The News API | https://thenewsapi.com · https://www.thenewsapi.com/pricing |
| Currents | https://currentsapi.services/en · https://currentsapi.services/en/introduction · https://currentsapi.services/en/pricing |

*Claims above reflect publicly marketed copy as of research date; re-verify numbers before publishing comparison tables.*

---

## 12. Document control

| Field | Value |
| --- | --- |
| Product | Briefly NewsStream |
| Artifact | Landing competitor brief |
| Path | `docs/landing-competitor-brief.md` |
| Audience | Design, marketing, frontend |
| Next step | Implement §4 section map on marketing landing with §5 pillars and §6 anti-patterns enforced |
