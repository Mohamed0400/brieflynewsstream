import { createNeonAuth } from "@neondatabase/auth/next/server";

function cookieSecret() {
  const secret =
    process.env.NEON_AUTH_COOKIE_SECRET?.trim() ||
    process.env.CONSOLE_SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error(
      "NEON_AUTH_COOKIE_SECRET (or CONSOLE_SESSION_SECRET) must be set to ≥32 characters when AUTH_PROVIDER=neon",
    );
  }
  return secret;
}

function baseUrl() {
  const url = process.env.NEON_AUTH_BASE_URL?.trim();
  if (!url) {
    throw new Error("NEON_AUTH_BASE_URL is required when AUTH_PROVIDER=neon");
  }
  return url;
}

/** Server-side Managed Better Auth instance (Neon). Only construct when Neon auth is selected. */
export const neonAuth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL || "http://localhost/invalid-neon-auth",
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET || process.env.CONSOLE_SESSION_SECRET || "dev-only-replace-me-32chars-min!!",
  },
  logLevel: process.env.NODE_ENV === "production" ? "warn" : "debug",
});

export function assertNeonAuthEnv() {
  baseUrl();
  cookieSecret();
}
