import { getSessionUser } from "./account";
import { createServerSupabaseClient } from "./supabase/server";

/** @deprecated Cookie name kept only for clearing legacy sessions on logout. */
export const CONSOLE_SESSION_COOKIE = "market_news_console";

/** Cookie-only check for public gate pages — avoids blocking SSR on Auth server. */
export async function hasConsoleSession() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return Boolean(session);
}

export async function isConsoleAuthenticated() {
  return Boolean(await getSessionUser());
}

export function isTrustedConsoleOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return origin === new URL(request.url).origin;
}
