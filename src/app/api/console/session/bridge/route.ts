import { NextResponse } from "next/server";
import { getOrCreateAccount } from "@/lib/account";
import { isTrustedConsoleOrigin } from "@/lib/console-auth";
import { profileFromAuthMetadata } from "@/lib/signup-profile";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const maxDuration = 30;

/**
 * Node smoke / tooling helper: accept tokens from Supabase Auth and set SSR cookies.
 * Not used by the browser login form (that uses the client SDK directly).
 */
export async function POST(request: Request) {
  if (!isTrustedConsoleOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({})) as {
    access_token?: string;
    refresh_token?: string;
  };
  if (!body.access_token || !body.refresh_token) {
    return NextResponse.json(
      { error: "invalid_body", message: "access_token and refresh_token are required." },
      { status: 400 },
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.setSession({
    access_token: body.access_token,
    refresh_token: body.refresh_token,
  });
  if (error || !data.user?.email) {
    return NextResponse.json(
      { error: "unauthorized", message: error?.message || "Unable to set session." },
      { status: 401 },
    );
  }

  const account = await getOrCreateAccount({
    authUserId: data.user.id,
    email: data.user.email,
    profile: profileFromAuthMetadata(data.user.user_metadata),
  });

  return NextResponse.json({
    ok: true,
    account: {
      id: account.id,
      email: account.email,
      role: account.role,
      plan: account.plan,
      status: account.status,
    },
  });
}
