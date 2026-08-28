import { NextResponse } from "next/server";
import { getOrCreateAccount } from "@/lib/account";
import { consoleAuthCallbackUrl } from "@/lib/auth-redirect";
import { isTrustedConsoleOrigin } from "@/lib/console-auth";
import {
  isBlockedAccountStatus,
  isDuplicateSignupError,
  isDuplicateSignupUser,
} from "@/lib/console-signup-auth";
import { normalizeSignupProfile, profileFromAuthMetadata } from "@/lib/signup-profile";
import { AUTH_TIMEOUT_MS, withAuthRetry } from "@/lib/supabase/auth-timeout";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const maxDuration = 30;

type PasswordAuthBody = {
  mode?: "signin" | "signup";
  email?: string;
  password?: string;
  country?: string;
  address?: string;
  mobilePhone?: string;
};

function accountPayload(account: Awaited<ReturnType<typeof getOrCreateAccount>>) {
  return {
    id: account.id,
    email: account.email,
    plan: account.plan,
    role: account.role,
    status: account.status,
  };
}

function requestOrigin(request: Request) {
  return request.headers.get("origin") || new URL(request.url).origin;
}

export async function POST(request: Request) {
  if (!isTrustedConsoleOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({})) as PasswordAuthBody;
  const mode = body.mode;
  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!email || !password || (mode !== "signin" && mode !== "signup")) {
    return NextResponse.json(
      { error: "invalid_body", message: "mode, email, and password are required." },
      { status: 400 },
    );
  }

  const supabase = await createServerSupabaseClient();

  if (mode === "signin") {
    const { data, error } = await withAuthRetry(
      () => supabase.auth.signInWithPassword({ email, password }),
      AUTH_TIMEOUT_MS.serverAuth,
    );
    if (error || !data.user?.email) {
      return NextResponse.json(
        { error: "auth_failed", message: error?.message || "Unable to authenticate." },
        { status: 401 },
      );
    }

    const account = await getOrCreateAccount({
      authUserId: data.user.id,
      email: data.user.email,
      profile: profileFromAuthMetadata(data.user.user_metadata),
    });
    if (isBlockedAccountStatus(account.status)) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: "blocked", message: "Account is suspended or closed." },
        { status: 403 },
      );
    }

    return NextResponse.json({ ok: true, account: accountPayload(account) });
  }

  const parsed = normalizeSignupProfile({
    country: body.country,
    address: body.address,
    mobilePhone: body.mobilePhone,
  });
  if (parsed.error || !parsed.profile) {
    return NextResponse.json(
      { error: "invalid_profile", message: parsed.error || "Invalid signup profile." },
      { status: 400 },
    );
  }

  const origin = requestOrigin(request);
  const { data, error } = await withAuthRetry(
    () => supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: consoleAuthCallbackUrl(origin),
        data: parsed.profile,
      },
    }),
    AUTH_TIMEOUT_MS.serverAuth,
  );

  if (error) {
    const duplicate = isDuplicateSignupError(error.message);
    return NextResponse.json(
      {
        error: duplicate ? "duplicate" : "auth_failed",
        message: error.message || "Unable to register.",
      },
      { status: duplicate ? 409 : 400 },
    );
  }

  if (isDuplicateSignupUser(data.user)) {
    return NextResponse.json(
      { error: "duplicate", message: "That email is already registered." },
      { status: 409 },
    );
  }

  if (!data.session || !data.user?.email) {
    return NextResponse.json({ ok: true, needsConfirmation: true });
  }

  const account = await getOrCreateAccount({
    authUserId: data.user.id,
    email: data.user.email,
    profile: parsed.profile,
  });
  if (isBlockedAccountStatus(account.status)) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "blocked", message: "Account is suspended or closed." },
      { status: 403 },
    );
  }

  return NextResponse.json({ ok: true, account: accountPayload(account) });
}
