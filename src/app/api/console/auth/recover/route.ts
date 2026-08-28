import { NextResponse } from "next/server";
import { consoleAuthCallbackUrl } from "@/lib/auth-redirect";
import { isTrustedConsoleOrigin } from "@/lib/console-auth";
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
