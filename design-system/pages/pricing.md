# Pricing page overrides

Reading this as: B2B SaaS pricing for developers and market desks. Structure from a 6/10 two-card usage+features pattern. Visual language stays navy/cyan, not the reference blue.

Dials: VARIANCE 4, MOTION 4, DENSITY 5.

## Layout

1. Centered header: native Arabic headline + restrained lede (start free, Pro commercial, Enterprise custom). English is localized, not translated.
2. Three plan cards in one row from 900px: Free (paper) + Pro (featured, slightly wider) + Enterprise (paper). Name, lede, price, and CTA share one row across cards. Feature lists stay start-aligned inside cards. Not three identical tiles: Pro keeps the name pill, cyan wash, and the only primary button.
3. "On every plan" 2x3 grid with mixed fills (API is the same; daily limits differ). Centered cell copy.
4. Three-step start (account, key, GET /api/v1/market-news).
5. Plan FAQ (centered column). Do not mention UTC, 00:00, Kuwait time, or how the day is calculated. The daily-limit answer is: it renews automatically every day.
6. Closing conversion slab: centered large headline, short lede, proof lines (5 / 500 / $70), oversized "Start free" button.

## Honest packaging

Value metric: authenticated API requests per day, plus max keys.

| Plan | Price | Requests / day | Keys | License | SLA |
| --- | --- | --- | --- | --- | --- |
| Free | $0 | 5 | 2 | Evaluation | None published |
| Pro | $70/month list | 500 | 10 | Commercial | None published |
| Enterprise | Custom | 20,000 default, overridable | 100 | Commercial | Scoped with the team |

Do not invent credits, articles-per-credit, add-on prices, annual discounts, 12-hour delay, crypto APIs, or archive month caps. Archive access is on every plan. Default live window is 72 hours. Plan cards read daily requests and key caps from `PLAN_DEFINITIONS`.

## Conversion

- No production badge on Pro.
- No annual toggle (no annual product).
- CTA lock: Free, Pro compact, and closing use "Start free" / "ابدأ مجاناً". Full-page Pro uses "Start with Pro". Enterprise uses "Contact us" / "تواصل معنا".
- Risk reversal: no card checkout. Start Free, open a Pro order in Billing, we confirm the upgrade.
- Full-page Pro CTA goes to console signup, then Billing. Enterprise stays Contact us.
- First value moment: create an API key, send a request to /api/v1/market-news.

## Shape and color

Cards 12px. Buttons 8px. One accent `#5ec8dc`. Featured Pro is cyan-tinted paper, not a second inverted theme. Free and Enterprise are matching paper cards. Closing slab is cyan-tinted paper. Pro card uses a "Pro" name pill, not the brand mark. Brand mark stays on the closer.
