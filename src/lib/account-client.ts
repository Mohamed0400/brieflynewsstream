import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { AuthTimeoutError, withAuthTimeout } from "@/lib/supabase/auth-timeout";

export type ConsoleAccountPayload = {
  account: {
    id: string;
    email: string;
    plan: string;
    role: string;
    status: string;
  };
};

async function readAccountError(response: Response) {
  const body = await response.json().catch(() => ({})) as { message?: string };
  return body.message || "Unable to create account profile";
}

/**
 * Sync Supabase tokens into SSR cookies, then ensure the Prisma Account row exists.
 * The bridge route sets cookies server-side so middleware and RSC see the session.
 */
export async function establishConsoleSessionClient(): Promise<ConsoleAccountPayload> {
  const supabase = createBrowserSupabaseClient();
  const { data: { session } } = await withAuthTimeout(supabase.auth.getSession(), 8_000);
  if (!session?.access_token || !session.refresh_token) {
    throw new Error("No active session after sign-in.");
  }

  const bridge = await withAuthTimeout(
    fetch("/api/console/session/bridge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      }),
    }),
    12_000,
  );
  if (bridge.ok) {
    return bridge.json() as Promise<ConsoleAccountPayload>;
  }

  // Bridge failed — fall back to account POST (also on public middleware path).
  const account = await withAuthTimeout(fetch("/api/console/account", { method: "POST" }), 12_000);
  if (!account.ok) {
    throw new Error(await readAccountError(account));
  }
  return account.json() as Promise<ConsoleAccountPayload>;
}

/** @deprecated Prefer establishConsoleSessionClient after password sign-in. */
export async function getOrCreateAccountClient() {
  return establishConsoleSessionClient();
}

export { AuthTimeoutError };
