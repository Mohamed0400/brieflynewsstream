import { NextResponse } from "next/server";
import { isNeonAuthEnabled } from "@/lib/auth-provider";
import { isTrustedConsoleOrigin } from "@/lib/console-auth";
import { neonAuth, assertNeonAuthEnv } from "@/lib/neon-auth/server";

export const maxDuration = 30;

type ResetBody = {
  token?: string;
  password?: string;
};

export async function POST(request: Request) {
  if (!isTrustedConsoleOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }

  if (!isNeonAuthEnabled()) {
    return NextResponse.json(
      { error: "unsupported", message: "This reset endpoint is only used with Neon Auth." },
      { status: 501 },
    );
  }

  assertNeonAuthEnv();
  const body = (await request.json().catch(() => ({}))) as ResetBody;
  const token = body.token?.trim();
  const password = body.password;

  if (!token || !password) {
    return NextResponse.json(
      { error: "invalid_body", message: "token and password are required." },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "invalid_body", message: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  const { error } = await neonAuth.resetPassword({
    newPassword: password,
    token,
  });

  if (error) {
    return NextResponse.json(
      { error: "auth_failed", message: error.message || "Unable to reset password." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
