import { NextResponse } from "next/server";
import { isNeonAuthEnabled } from "@/lib/auth-provider";
import { consoleAuthCallbackUrl } from "@/lib/auth-redirect";
import { isTrustedConsoleOrigin } from "@/lib/console-auth";
import { neonAuth, assertNeonAuthEnv } from "@/lib/neon-auth/server";
import { AUTH_TIMEOUT_MS, withAuthRetry } from "@/lib/supabase/auth-timeout";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!isTrustedConsoleOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({})) as { email?: string };
  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json(
      { error: "invalid_body", message: "email is required." },
      { status: 400 },
    );
  }

  const origin = request.headers.get("origin") || new URL(request.url).origin;

  if (isNeonAuthEnabled()) {
    assertNeonAuthEnv();
    // Better Auth: requestPasswordReset / forgetPassword (Managed Neon Auth beta).
    const authApi = neonAuth as {
      requestPasswordReset?: (input: { email: string; redirectTo?: string }) => Promise<{ error?: { message?: string } | null }>;
      forgetPassword?: (input: { email: string; redirectTo?: string }) => Promise<{ error?: { message?: string } | null }>;
    };
    const reset =
      authApi.requestPasswordReset?.({
        email,
        redirectTo: consoleAuthCallbackUrl(origin, "/console/reset-password"),
      }) ??
      authApi.forgetPassword?.({
        email,
        redirectTo: consoleAuthCallbackUrl(origin, "/console/reset-password"),
      });
    if (!reset) {
      return NextResponse.json(
        {
          error: "auth_failed",
          message: "Password reset is not available on this Neon Auth build yet. Use the Neon Auth UI or contact support.",
        },
        { status: 501 },
      );
    }
    const { error } = await reset;
    if (error) {
      return NextResponse.json(
        { error: "auth_failed", message: error.message || "Unable to send reset email." },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: true });
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await withAuthRetry(
    () => supabase.auth.resetPasswordForEmail(email, {
      redirectTo: consoleAuthCallbackUrl(origin, "/console/reset-password"),
    }),
    AUTH_TIMEOUT_MS.resetEmail,
  );

  if (error) {
    return NextResponse.json(
      { error: "auth_failed", message: error.message || "Unable to send reset email." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
