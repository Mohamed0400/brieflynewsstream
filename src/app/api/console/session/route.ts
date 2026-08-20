import { NextResponse } from "next/server";
import {
  CONSOLE_SESSION_COOKIE,
  isTrustedConsoleOrigin,
} from "@/lib/console-auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/** Sign out of Supabase Auth and clear any legacy console cookie. */
export async function DELETE(request: Request) {
  if (!isTrustedConsoleOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }

  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();

  const response = NextResponse.json({ ok: true });
  response.cookies.set(CONSOLE_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}

/** Auth is handled client-side via Supabase. Keep POST as a clear 410. */
export async function POST() {
  return NextResponse.json(
    {
      error: "gone",
      message: "Use email/password sign-in through the console login form.",
    },
    { status: 410 },
  );
}
