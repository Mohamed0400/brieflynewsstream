import { NextResponse } from "next/server";
import { getOrCreateAccount } from "@/lib/account";
import { userFromNeonAuthData } from "@/lib/account-link";
import { isNeonAuthEnabled } from "@/lib/auth-provider";
import { consoleAuthCallbackUrl } from "@/lib/auth-redirect";
import { isTrustedConsoleOrigin } from "@/lib/console-auth";
import { isBlockedAccountStatus } from "@/lib/console-signup-auth";
import { neonAuth, assertNeonAuthEnv } from "@/lib/neon-auth/server";
import { profileFromAuthMetadata } from "@/lib/signup-profile";

export const maxDuration = 30;

type VerifyEmailBody = {
  mode?: "verify" | "resend";
  email?: string;
  otp?: string;
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

export async function POST(request: Request) {
  if (!isTrustedConsoleOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }

  if (!isNeonAuthEnabled()) {
    return NextResponse.json(
      { error: "unsupported", message: "Email OTP confirmation is only available with Neon Auth." },
      { status: 501 },
    );
  }

  assertNeonAuthEnv();
  const body = (await request.json().catch(() => ({}))) as VerifyEmailBody;
  const mode = body.mode === "resend" ? "resend" : "verify";
  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json(
      { error: "invalid_body", message: "email is required." },
      { status: 400 },
    );
  }

  const origin = request.headers.get("origin") || new URL(request.url).origin;

  if (mode === "resend") {
    const authApi = neonAuth as {
      emailOtp?: {
        sendVerificationOtp?: (input: {
          email: string;
          type: "email-verification" | "sign-in" | "forget-password";
        }) => Promise<{ error?: { message?: string } | null }>;
      };
      sendVerificationEmail?: (input: {
        email: string;
        callbackURL?: string;
      }) => Promise<{ error?: { message?: string } | null }>;
    };

    const resent =
      authApi.emailOtp?.sendVerificationOtp?.({
        email,
        type: "email-verification",
      }) ??
      authApi.sendVerificationEmail?.({
        email,
        callbackURL: consoleAuthCallbackUrl(origin),
      });

    if (!resent) {
      return NextResponse.json(
        { error: "auth_failed", message: "Unable to resend verification email." },
        { status: 501 },
      );
    }

    const { error } = await resent;
    if (error) {
      return NextResponse.json(
        { error: "auth_failed", message: error.message || "Unable to resend verification email." },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: true });
  }

  const otp = body.otp?.trim();
  if (!otp) {
    return NextResponse.json(
      { error: "invalid_body", message: "otp is required." },
      { status: 400 },
    );
  }

  const authApi = neonAuth as {
    emailOtp?: {
      verifyEmail?: (input: {
        email: string;
        otp: string;
      }) => Promise<{
        data?: { user?: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null; session?: unknown } | null;
        error?: { message?: string } | null;
      }>;
    };
  };

  if (!authApi.emailOtp?.verifyEmail) {
    return NextResponse.json(
      { error: "auth_failed", message: "Email OTP verification is not available." },
      { status: 501 },
    );
  }

  const { data, error } = await authApi.emailOtp.verifyEmail({ email, otp });
  if (error) {
    return NextResponse.json(
      { error: "auth_failed", message: error.message || "Invalid or expired confirmation code." },
      { status: 400 },
    );
  }

  const { data: sessionData } = await neonAuth.getSession();
  const user = sessionData?.user || userFromNeonAuthData(data);
  if (!user?.email) {
    return NextResponse.json({ ok: true, needsSignIn: true });
  }

  const account = await getOrCreateAccount({
    authUserId: user.id,
    email: user.email,
    profile: profileFromAuthMetadata(
      (user as { user_metadata?: Record<string, unknown> }).user_metadata,
    ),
  });
  if (isBlockedAccountStatus(account.status)) {
    await neonAuth.signOut();
    return NextResponse.json(
      { error: "blocked", message: "Account is suspended or closed." },
      { status: 403 },
    );
  }

  return NextResponse.json({ ok: true, account: accountPayload(account) });
}
