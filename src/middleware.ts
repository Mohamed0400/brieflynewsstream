import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { apiCorsHeaders, preflightApi } from "@/lib/api-response";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_CONSOLE_PATHS = new Set([
  "/console/login",
  "/console/reset-password",
]);

function isPublicConsoleApi(pathname: string) {
  return (
    pathname === "/api/console/session" ||
    pathname === "/api/console/session/bridge"
  );
}

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
    pathname.startsWith("/console") ||
    pathname.startsWith("/api/console") ||
    pathname.startsWith("/auth");

  if (!needsAuthRefresh) return NextResponse.next();

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

  if (pathname.startsWith("/console")) {
    const isPublic = [...PUBLIC_CONSOLE_PATHS].some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    );
    if (!user && !isPublic) {
      const login = request.nextUrl.clone();
      login.pathname = "/console/login";
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
    if (user && (pathname === "/console/login" || pathname === "/console")) {
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
    "/auth/:path*",
  ],
};
