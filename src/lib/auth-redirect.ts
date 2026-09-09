export function safeAppPath(next: string | null | undefined, fallback = "/console/overview") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return fallback;
  }
  return next;
}

export function consoleAuthCallbackUrl(origin: string, next = "/console/overview") {
  const url = new URL("/auth/confirm", origin);
  url.searchParams.set("next", safeAppPath(next));
  return url.toString();
}

/**
 * Neon Auth / Better Auth password-reset emails hit the Auth host first, then
 * redirect to this URL with `?token=…`. Do not route through `/auth/confirm`
 * (that path is Supabase `code` / `token_hash` only).
 */
export function consolePasswordResetUrl(origin: string) {
  return new URL("/console/reset-password", origin).toString();
}
