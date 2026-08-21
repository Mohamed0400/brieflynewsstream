# Customer console (after sign in)

Reading this as: B2B SaaS customer console for developers and MENA desks, with a light professional website language, leaning toward navy `#0b1422` + cyan `#5ec8dc` + Geist / IBM Plex Arabic.

Redesign mode: visual overhaul of chrome only. Keep `/console/overview`, `/explorer`, `/keys`, `/billing`, `/docs`, `/docs/api`.

Dials: VARIANCE 4, MOTION 3, DENSITY 6.

## Theme lock

Light only. Paper `#f7f9fc`, surface `#ffffff`, ink `#0b1422`, muted `#3a4b5c`, one cyan accent. No purple. No dark header. No marketing search bar.

OS dark mode must not remap console tokens. `color-scheme: light` on `.console-app`. Cyan `#5ec8dc` is for CTAs, focus rings, and active indicators only. Never use cyan as heading or body text on white (fails WCAG). Never use ink `#0b1422` as text on navy. Code panes use navy `#0b1422` with paper `#f7f9fc` text.

Contrast: body and labels ≥4.5:1 on paper. Placeholders `#526274` at full opacity. Secondary buttons use navy text and a visible 22% ink border so they do not look disabled.

## Chrome (the break to fix)

The signed-in bar is a CSS grid with a **fixed height** of 64px plus safe-area. It never wraps.

1. Header row: wordmark (reserved 28px height, max 168px) + language + log out.
2. Mobile second row: horizontal nav, 56px, `nowrap`, overflow-x only.
3. Desktop: 15.5rem sticky sidebar. Header spans both columns.

Do not put nav links, environment badges, or a second wordmark in the header. Do not use `min-height` on the bar without a matching `height` and `overflow: hidden`.

## Page bodies

Overview is a branded platform brief: logo, coverage (countries, AR+EN, categories, regions), and a downloadable one-page PDF. Do not show empty request charts, archive story counts, or “open access / no cap”. Primary CTA is Download platform brief.

Welcome is a two-cell split: copy + reserved mark. Primary CTA is cyan with ink text. Controls 8px. Panels 12px.

Arabic: IBM Plex 400/600/700 only. No negative tracking on Arabic titles.
