# Auth pages (login + signup)

Reading this as: B2B SaaS console auth for developers and MENA desks. NewsData.io was a 6/10 IA reference only. Visual language stays navy `#0b1422` + cyan `#5ec8dc` + Geist / IBM Plex Arabic.

Redesign mode: visual overhaul. Keep `/console/login`, email/password/OTP field names, and the reset-password slug. Add `/console/signup`.

Dials: VARIANCE 4, MOTION 4, DENSITY 5.

## Layout families (do not clone each other)

Public auth sits in the marketing shell (site nav + footer). Loading keeps that chrome: the mark breathes on paper with a cyan wash, no white plate. The signed-in console dashboard does not use marketing chrome.

1. **Sign in:** centered paper form. Navy proof band stacked below, not a side column. Quiet proof (3 facts).
2. **Sign up:** same stack, different job. Navy band sells Free with grouped benefits. Paper column is email + password only.
3. **Reset:** paper only, no proof band. Same marketing chrome.

## Conversion rules

- No Google OAuth. No phone field. No name field.
- Labels above inputs. Errors below. Password show/hide. 16px inputs. 44px targets.
- CTA lock: Sign in vs Register. Marketing "Log in" hits `/console/login`. "Get API key" hits `/console/signup`.
- Signup headline is registration, not dashboard: “Register for a free account” / “سجّل حساباً مجانياً”.
- Honest Free facts only: 3 req/day (shared pool), 1 key, AR+EN, ~70 countries, explorer/scores/archive. Do not claim NewsData credits, Excel/CSV, or a limited archive.

## Shape and color

Paper `#f7f9fc` form column. Navy proof column. Cyan CTAs with ink text. Controls 8px. Proof panels 12px. One theme family per column, not a photo overlay with a floating card.
