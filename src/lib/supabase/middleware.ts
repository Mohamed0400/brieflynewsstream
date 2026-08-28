import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "./env";

const AUTH_MIDDLEWARE_TIMEOUT_MS = 8_000;

async function getUserWithTimeout(
  supabase: ReturnType<typeof createServerClient>,
): Promise<User | null> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<{ data: { user: null } }>((resolve) => {
    timeoutId = setTimeout(() => resolve({ data: { user: null } }), AUTH_MIDDLEWARE_TIMEOUT_MS);
  });

  try {
    const result = await Promise.race([supabase.auth.getUser(), timeout]);
    if (result.data.user) return result.data.user;

    // Auth server slow — use cookie session so valid sign-ins are not bounced to login.
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user ?? null;
  } catch {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user ?? null;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  // Validate JWT with Auth server — do not use getSession() here.
  const user = await getUserWithTimeout(supabase);

  return { supabase, user, supabaseResponse };
}
