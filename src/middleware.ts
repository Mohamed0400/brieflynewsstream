import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ADMIN_APP_PATH, isAdminAppPath, isCustomerConsolePath } from "@/lib/admin-app";
import { apiCorsHeaders, preflightApi } from "@/lib/api-cors";
import {
  isPublicConsoleApi,
  skipsMiddlewareAuthRefresh,
} from "@/lib/console-public-routes";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/v1/")) {
    if (request.method === "OPTIONS") {
      return preflightApi(request.headers.get("origin"));
    }
    const response = NextResponse.next();
    for (const [name, value] of Object.entries(apiCorsHeaders(request.headers.get("origin")))) {
      response.headers.set(name, value);
    }
    response.headers.set("X-API-Version", "1.0.0");
    return response;
  }

  const needsAuthRefresh =
    isCustomerConsolePath(pathname) ||
    isAdminAppPath(pathname) ||
    pathname.startsWith("/api/console") ||
    pathname.startsWith("/auth");

  if (!needsAuthRefresh) return NextResponse.next();

  // Public gate pages/API must not call Supabase Auth in middleware — getUser() can
  // exceed Vercel's middleware budget and 504 login/signup. Pages redirect if already signed in.
  if (skipsMiddlewareAuthRefresh(pathname)) {
    return NextResponse.next();
  }

  const { user, supabaseResponse } = await updateSession(request);

  if (pathname.startsWith("/auth/")) {
    return supabaseResponse;
  }

  if (pathname.startsWith("/api/console")) {
    if (!isPublicConsoleApi(pathname) && !user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return supabaseResponse;
  }

  if (isAdminAppPath(pathname)) {
    const isPublic = pathname === ADMIN_APP_PATH;
    if (!user && !isPublic) {
      const login = request.nextUrl.clone();
      login.pathname = ADMIN_APP_PATH;
      login.search = "";
      return NextResponse.redirect(login);
    }
    return supabaseResponse;
  }

  if (isCustomerConsolePath(pathname)) {
    if (!user) {
      const login = request.nextUrl.clone();
      login.pathname = "/console/login";
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
    if (user && pathname === "/console") {
      const overview = request.nextUrl.clone();
      overview.pathname = "/console/overview";
      overview.search = "";
      return NextResponse.redirect(overview);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/api/v1/:path*",
    "/api/console/:path*",
    "/console",
    "/console/:path*",
    "/consoleofbrieflynewsstreamapi",
    "/consoleofbrieflynewsstreamapi/:path*",
    "/auth/:path*",
  ],
};
