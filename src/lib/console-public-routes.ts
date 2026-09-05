import { ADMIN_APP_PATH } from "@/lib/admin-app";

export const PUBLIC_CONSOLE_PATHS = [
  "/console/login",
  "/console/signup",
  "/console/reset-password",
] as const;

export const PUBLIC_CONSOLE_API_PATHS = [
  "/api/console/session",
  "/api/console/session/bridge",
  "/api/console/account",
  "/api/console/auth/password",
  "/api/console/auth/recover",
  "/api/console/auth/verify-email",
] as const;

export const PUBLIC_AUTH_PATHS = [
  "/auth/callback",
  "/auth/confirm",
  "/auth/error",
] as const;

export function isPublicConsolePage(pathname: string) {
  return PUBLIC_CONSOLE_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function isPublicConsoleApi(pathname: string) {
  return PUBLIC_CONSOLE_API_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function isPublicAuthPath(pathname: string) {
  return PUBLIC_AUTH_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/** Admin sign-in gate only — not operations sub-routes. */
export function isPublicAdminGate(pathname: string) {
  return pathname === ADMIN_APP_PATH;
}

/** Routes that must not call Supabase Auth in middleware. */
export function skipsMiddlewareAuthRefresh(pathname: string) {
  return (
    isPublicAuthPath(pathname)
    || isPublicConsolePage(pathname)
    || isPublicConsoleApi(pathname)
    || isPublicAdminGate(pathname)
  );
}
