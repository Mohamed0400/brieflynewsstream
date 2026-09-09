# DO Postgres + Neon Auth cutover

**Current production architecture**

| Concern | Provider |
|---------|----------|
| App data (Prisma: news, accounts, billing, jobs) | **DigitalOcean Managed Postgres** `gs-news` (`fra1`) |
| Login / signup / sessions | **Neon Auth** on project `cool-bread-17251650` (`gs-news-auth`) |

Neon is **Auth-only**. Do **not** point `DATABASE_URL` at Neon for article collect — that burned Free egress on the previous Neon project (`falling-fog-29508824`).

## Env (Vercel Production + local)

```bash
# Data → DigitalOcean (public URI, ssl required)
DATABASE_URL="postgresql://doadmin:…@gs-news-do-user-….ondigitalocean.com:25060/defaultdb?sslmode=require"
DIRECT_URL="postgresql://doadmin:…@gs-news-do-user-….ondigitalocean.com:25060/defaultdb?sslmode=require"

# Auth → Neon Auth (new project)
AUTH_PROVIDER=neon
NEON_AUTH_BASE_URL="https://….neonauth….aws.neon.tech/neondb/auth"
NEON_AUTH_JWKS_URL="https://….neonauth….aws.neon.tech/neondb/auth/.well-known/jwks.json"
NEON_AUTH_COOKIE_SECRET="<openssl rand -base64 32>"

MAIN_COLLECT_ENABLED=false
```

Local files (gitignored):

- `.env.do` — DO connection
- `.env.neon-auth` — Neon Auth URLs + cookie secret
- `.env` — merged for local app (DO `DATABASE_URL` + Neon Auth keys)

GitHub Actions secrets `DATABASE_URL` / `DIRECT_URL` must be the **DO** URI (same as Vercel).

## Trusted domains (Neon Auth)

- `https://www.brieflynewsstream.com`
- `https://brieflynewsstream.com`
- `http://localhost:3000`

## Billing continuity

`Account`, `Subscription`, `Invoice`, `Payment`, and `ApiKey` were restored onto DO. Password hashes do **not** migrate across Neon Auth projects — users sign up/in again on the new Auth project; [`getOrCreateAccount`](../src/lib/account.ts) remaps by **email** so the restored Account (and Subscription) attach to the new Neon user id.

## Ops

- Keep Arabic collect + watchdog; keep `MAIN_COLLECT_ENABLED=false`.
- Retention/prune envs still apply on DO (storage headroom, not Neon Free egress).
- DO cluster docs/skill: `gs-news` (no product name in the DO cluster title).

## Rollback

1. Point `DATABASE_URL` / `DIRECT_URL` back to a reachable Postgres dump source if needed.
2. Point `NEON_AUTH_*` at the previous Auth project only if that project still has quota and users.

## Note on project IDs

Requested Neon project `small-shadow-30014112` was **not** visible on the logged-in Neon org (`org-snowy-meadow-53369181`). Auth was provisioned on **`cool-bread-17251650`** (`gs-news-auth`) instead. If you own `small-shadow-30014112` under another Neon login, re-link and swap `NEON_AUTH_*` to that project.
