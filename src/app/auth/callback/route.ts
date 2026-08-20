import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/account";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/console/overview";
  const origin = url.origin;

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user?.email) {
      await getOrCreateAccount({
        authUserId: data.user.id,
        email: data.user.email,
      });
    }
  }

  const redirectTo = next.startsWith("/") ? `${origin}${next}` : `${origin}/console/overview`;
  return NextResponse.redirect(redirectTo);
}
