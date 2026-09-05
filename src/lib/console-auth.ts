import { getSessionUser } from "./account";
import { isNeonAuthEnabled } from "./auth-provider";
import { AUTH_TIMEOUT_MS, withAuthTimeout } from "./supabase/auth-timeout";
import { createServerSupabaseClient } from "./supabase/server";

/** @deprecated Cookie name kept only for clearing legacy sessions on logout. */
export const CONSOLE_SESSION_COOKIE = "market_news_console";

/** Validates JWT with Auth server; bounded so gate pages do not hang SSR. */
export async function hasConsoleSession() {
  if (isNeonAuthEnabled()) {
    try {
      return Boolean(await getSessionUser());
    } catch {
      return false;
    }
  }
  const supabase = await createServerSupabaseClient();
  try {
    const { data } = await withAuthTimeout(supabase.auth.getUser(), AUTH_TIMEOUT_MS.gateSessionCheck);
    return Boolean(data.user);
  } catch {
    return false;
  }
}

export async function isConsoleAuthenticated() {
  return Boolean(await getSessionUser());
}

export function isTrustedConsoleOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return origin === new URL(request.url).origin;
}
