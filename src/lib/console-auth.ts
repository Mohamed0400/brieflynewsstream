import { getSessionUser } from "./account";

/** @deprecated Cookie name kept only for clearing legacy sessions on logout. */
export const CONSOLE_SESSION_COOKIE = "market_news_console";

export async function isConsoleAuthenticated() {
  return Boolean(await getSessionUser());
}

export function isTrustedConsoleOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return origin === new URL(request.url).origin;
}
