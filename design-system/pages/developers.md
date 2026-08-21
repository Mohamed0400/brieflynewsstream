# Developers page

Reading this as: public API documentation for integrating Briefly, not a second product landing. Job of the page: **How do I use Briefly?** This route is the full public docs. Homepage sells why. Pricing sells cost. Console is for keys and trying requests.

Dials: VARIANCE 4, MOTION 2, DENSITY 6.

## Layout

1. Marketing nav stays above. On this route only, a sticky numbered timeline: 01 Quick start, 02 Auth, 03 Market News, 04 Filters, 05 Responses, 06 Errors, 07 Limits. Horizontal on small screens. Vertical rail on the inline-start from 1080px.
2. Dark docs hero with a unique generated surface (`/developers/api-docs-surface.jpg`). Not globe, gold, or any homepage marketing photo. Headline, lede, Get an API key + See how it works, Base URL, then `GET /market-news` + `X-API-Key`.
3. Quick start is step 01: key, request, JSON item.
4. Auth is step 02, before the endpoint catalog.
5. Market News is the public catalog: all customer GET routes, the live parameter table, an example, and the item shape.
6. Filters, responses, errors, usage limits follow in order. JS-first SDK tabs sit after the timeline.
7. Technical FAQ only. No pricing block. No closing marketing CTA.

## Copy lock

- Hero title is **واجهة API لأخبار الأسواق** / Market news API. Not “add news to your product”.
- Primary CTA is **ابدأ بمفتاح API** / Get an API key. Secondary is **شاهد كيف تعمل** / See how it works, and jumps to the first step.
- Examples must match the live envelope: `{ meta, count, limit, offset, items }` and `{ error, message }`.
- No RSS, ingest, UTC, or homepage photography.
- Do not mention OpenAPI.
- No em-dashes. Western numerals. Arabic titles 700, no italic, no negative tracking.

## Shape and color

Cards and panes 12px. Buttons 8px. One accent `#5ec8dc`. Docs measure is ~48rem, not a 72rem marketing collage. Timeline nodes use cyan fill for the current step.
