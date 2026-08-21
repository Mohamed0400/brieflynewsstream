# Briefly NewsStream — Marketing design system

Reading this as: B2B SaaS landing for developers and MENA market desks, with a professional news-API language, leaning toward navy/cyan brand tokens + Geist + IBM Plex Arabic.

Redesign mode: visual overhaul. Preserve routes, wordmark, and honest product claims. Do not clone NewsData.io colors, illustrations, or stats.

## Dials

- DESIGN_VARIANCE: 7 (layered product collage, dark impact band, photographic coverage)
- MOTION_INTENSITY: 5 (small rotation on collage, 180ms lifts, respect reduced motion)
- VISUAL_DENSITY: 5 (SaaS product page, not gallery)

## Tokens

| Role | Value | Notes |
|------|--------|--------|
| Ink | `#0b1422` | Primary text, dark bands |
| Accent | `#5ec8dc` | Single accent. CTAs, emphasis, focus |
| On accent | `#0b1422` | Text on cyan buttons (contrast) |
| Paper | `#f7f9fc` | Page background |
| Surface | `#ffffff` | Cards |
| Muted | `#4b5c6e` | Body secondary, ≥4.5:1 on paper |
| Line | `rgb(11 20 34 / 12%)` | Hairlines |
| Radius cards | `12px` | |
| Radius controls | `8px` | Buttons, inputs |
| Type EN | Geist Sans | already loaded via `next/font` |
| Type AR | IBM Plex Sans Arabic | 400 body, 600 UI, 700 titles. Never 550/650/750 (those fake-bold). No negative letter-spacing. Title line-height ≥ 1.45. No italic. |
| Mono | Geist Mono | API samples |

Do not use Inter, Calistoga, orange, gold, or purple. Do not claim NewsData stats (102,144 sources, 89 languages, 10-year archive, 99% SLA).

## Alignment

Marketing homepage uses RTL split composition: headlines sit at the inline start, product visuals sit at the inline end. Other marketing pages may stay centered.

Keep start alignment inside:
- Homepage hero and split product sections
- Forms and labels
- JSON / code panes
- Query parameter lists
- Plan feature lists
- Article feeds

Illustration exceptions: homepage hero, impact, and coverage stay split because they show the product. `/developers` is API documentation: sticky docs sub-nav, code panes, parameter tables. Do not reuse homepage photography there. Other marketing pages may remain centered.

Buttons and inputs: 8px. Cards and demo panes: 12px. Pills for badges only.

## Reference patterns we keep (structure, not look)

1. Sticky product nav: Home, Briefing, Developers, Pricing. Then language, login, and primary “Start free”. Desktop links from 1024px so the bar stays one line.
2. RTL split hero: native headline plus live product collage (scored card + GET), not a generic illustration.
3. Signal section with generated infrastructure photography
4. Dark scale band (70 / 3 / 7 / 2, honest taxonomy)
5. Impact scoreboard as the differentiator
6. Audience board: featured desk plus query rows
7. API request + JSON
8. Bilingual field strip
9. Coverage map + trust counts + pricing + FAQ + closing CTA

## Layout families on the homepage (do not repeat)

1. RTL split hero: copy + product collage
2. Full-width dark scale band, four honest stats
3. Split photography + signal list
4. Impact scoreboard split
5. Audience board (featured desk + query rows)
6. API request + JSON panes
7. Bilingual field strip
8. Coverage map, trust counts, pricing, FAQ, closing CTA

Dedicated `/developers` rules live in `design-system/pages/developers.md`. API-first public docs with a numbered timeline. Do not reuse homepage photography there.

Dedicated `/pricing` rules live in `design-system/pages/pricing.md`. Three plan cards, Pro featured; do not make the three tiles visually identical.

Dedicated `/console/login` and `/console/signup` rules live in `design-system/pages/auth.md`. No Google OAuth. No phone collection.

Route loading uses the brand mark plus “جارٍ التحميل” / “Loading”, with `cursor: wait` on the page until the next view is ready.
