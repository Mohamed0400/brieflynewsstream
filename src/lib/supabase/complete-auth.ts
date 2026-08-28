import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getOrCreateAccount } from "@/lib/account";
import { safeAppPath } from "@/lib/auth-redirect";
import { isBlockedAccountStatus } from "@/lib/console-signup-auth";
import { profileFromAuthMetadata } from "@/lib/signup-profile";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";
import { AUTH_TIMEOUT_MS, withAuthTimeout } from "@/lib/supabase/auth-timeout";

function otpType(raw: string | null): EmailOtpType {
  if (
    raw === "signup"
    || raw === "invite"
    || raw === "magiclink"
    || raw === "recovery"
    || raw === "email_change"
    || raw === "email"
  ) {
    return raw;
  }
  return "email";
}

function authErrorRedirect(origin: string, message: string) {
  const url = new URL("/auth/error", origin);
  url.searchParams.set("message", message);
  return NextResponse.redirect(url);
}

export async function completeEmailAuth(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = otpType(url.searchParams.get("type"));
  const next = safeAppPath(
    url.searchParams.get("next"),
    type === "recovery" ? "/console/reset-password" : "/console/overview",
  );
  const errorDescription = url.searchParams.get("error_description") || url.searchParams.get("error");

  if (errorDescription) {
    return authErrorRedirect(origin, errorDescription.replace(/\+/g, " "));
  }

  if (!code && !tokenHash) {
    return authErrorRedirect(origin, "This confirmation link is missing its sign-in token.");
  }

  const cookieStore = await cookies();
  const redirectTo = NextResponse.redirect(`${origin}${next}`);
  const supabase = createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // Route Handler still attaches cookies on the redirect response.
          }
          redirectTo.cookies.set(name, value, options);
        });
      },
    },
  });

  const result = code
    ? await withAuthTimeout(supabase.auth.exchangeCodeForSession(code), AUTH_TIMEOUT_MS.confirmExchange)
    : await withAuthTimeout(
        supabase.auth.verifyOtp({ type, token_hash: tokenHash! }),
        AUTH_TIMEOUT_MS.confirmExchange,
      );

  if (result.error || !result.data.user?.email) {
    return authErrorRedirect(
      origin,
      result.error?.message || "This confirmation link is invalid or has expired.",
    );
  }

  const account = await getOrCreateAccount({
    authUserId: result.data.user.id,
    email: result.data.user.email,
    profile: profileFromAuthMetadata(result.data.user.user_metadata),
  });
  if (isBlockedAccountStatus(account.status)) {
    const login = new URL("/console/login", origin);
    login.searchParams.set("error", "account_status");
    return NextResponse.redirect(login);
  }

  return redirectTo;
}
