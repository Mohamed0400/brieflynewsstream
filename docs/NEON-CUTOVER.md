# Neon cutover checklist

**Status today:** Neon project `falling-fog-29508824` (branch `production`) has **Auth enabled** and (after migrate) Prisma schema. Production Vercel still points at **Supabase** until you flip env vars. Neon CLI `deploy` ≠ app migration.

## Do not half-cutover

Never set `AUTH_PROVIDER=neon` on Vercel while `DATABASE_URL` still points at a locked/empty Supabase (or empty Neon without migrations). Signup creates `Account` rows in Postgres — Auth and DB must move together.

## Free egress still applies

Neon Free ≈ **5 GB** egress. Keep [EGRESS-GUARD.md](./EGRESS-GUARD.md): pause **main** collect first; keep **Arabic**.

## Shipped in code

- `AUTH_PROVIDER=supabase` (default) | `neon`
- Neon Auth handler: `/api/auth/[...path]`
- Console password / recover / session dual-path when `AUTH_PROVIDER=neon`
- Middleware dual-path for console when Neon is selected
- Kill switches: `MAIN_COLLECT_ENABLED`, `ARABIC_COLLECT_ENABLED`

## Vercel env (production cutover)

```bash
# Point Prisma at Neon (pooled + unpooled)
DATABASE_URL="postgresql://…-pooler…/neondb?sslmode=require"
DIRECT_URL="postgresql://…/neondb?sslmode=require"   # unpooled / DATABASE_URL_UNPOOLED

AUTH_PROVIDER=neon
NEON_AUTH_BASE_URL="https://….neonauth….aws.neon.tech/neondb/auth"
NEON_AUTH_COOKIE_SECRET="<openssl rand -base64 32>"
# Optional:
# NEON_AUTH_JWKS_URL="…"

# Keep Supabase keys only if you still need a rollback window; otherwise remove after cutover.
```

Also add trusted domains in Neon Auth for `https://www.brieflynewsstream.com` and localhost:

```bash
neon neon-auth domain add https://www.brieflynewsstream.com
neon neon-auth domain allow-localhost
```

## Schema + data

1. `npx dotenv -e .env.neon -- prisma migrate deploy` (schema on Neon — done in this session if migrate succeeded)
2. **Data dump/restore** from Supabase → Neon when Supabase is reachable again (or from a prior backup). Until then, Neon has schema + Auth but **no news corpus**.
3. Sync Arabic sources after cutover: `ARABIC_COLLECT_ENABLED=true npm run sync:arabic-sources` against Neon URL
4. Update GitHub Actions secrets `DATABASE_URL` / `DIRECT_URL` to Neon

## Auth notes

- Existing Supabase password users **cannot** be migrated (different hash). Users must **sign up again** on Neon.
- Password reset via SDK is still beta on Managed Better Auth — prefer Neon console / UI if recover fails.
- Smoke locally: set `AUTH_PROVIDER=neon` + Neon vars in `.env.local` (do not commit secrets), then signup/signin on `/console/signup`.

## Rollback

1. Set Vercel `AUTH_PROVIDER=supabase` and restore Supabase `DATABASE_URL` / Auth keys
2. Or set `MAIN_COLLECT_ENABLED=false` if only egress is the problem and Auth still works
