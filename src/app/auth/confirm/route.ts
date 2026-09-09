import { NextResponse } from "next/server";
import { isNeonAuthEnabled } from "@/lib/auth-provider";
import { safeAppPath } from "@/lib/auth-redirect";
import { completeEmailAuth } from "@/lib/supabase/complete-auth";

export const dynamic = "force-dynamic";

function authErrorRedirect(origin: string, message: string) {
  const url = new URL("/auth/error", origin);
  url.searchParams.set("message", message);
  return NextResponse.redirect(url);
}

/**
 * Supabase email links use `code` / `token_hash`.
 * Neon Auth / Better Auth password-reset callbacks append `token` after validating
 * the Auth-host link. Older recover emails pointed callbackURL here — salvage those.
 */
export async function GET(request: Request) {
  if (!isNeonAuthEnabled()) {
    return completeEmailAuth(request);
  }

  const url = new URL(request.url);
  const origin = url.origin;
  const token = url.searchParams.get("token")?.trim();
  const error =
    url.searchParams.get("error_description")
    || url.searchParams.get("error");

  if (error) {
    return authErrorRedirect(origin, error.replace(/\+/g, " "));
  }

  if (token) {
    const dest = new URL("/console/reset-password", origin);
    dest.searchParams.set("token", token);
    const next = safeAppPath(url.searchParams.get("next"), "/console/reset-password");
    if (next !== "/console/reset-password") {
      dest.searchParams.set("next", next);
    }
    return NextResponse.redirect(dest);
  }

  return authErrorRedirect(
    origin,
    "This confirmation link is missing its reset token. Request a new password reset from the console login page.",
  );
}
