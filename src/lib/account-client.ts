import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  AUTH_TIMEOUT_MS,
  AuthTimeoutError,
  withAuthTimeout,
} from "@/lib/supabase/auth-timeout";

export type ConsoleAccountPayload = {
  account: {
    id: string;
    email: string;
    plan: string;
    role: string;
    status: string;
  };
};

export type SessionTokens = {
  access_token: string;
  refresh_token: string;
};

async function readAccountError(response: Response) {
  const body = await response.json().catch(() => ({})) as { message?: string };
  return body.message || "Unable to create account profile";
}

async function bridgeSession(tokens: SessionTokens): Promise<ConsoleAccountPayload> {
  const bridge = await withAuthTimeout(
    fetch("/api/console/session/bridge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tokens),
    }),
    AUTH_TIMEOUT_MS.bridge,
  );
  if (bridge.ok) {
    return bridge.json() as Promise<ConsoleAccountPayload>;
  }

  const account = await withAuthTimeout(fetch("/api/console/account", { method: "POST" }), AUTH_TIMEOUT_MS.bridge);
  if (!account.ok) {
    throw new Error(await readAccountError(account));
  }
  return account.json() as Promise<ConsoleAccountPayload>;
}

/**
 * Sync Supabase tokens into SSR cookies, then ensure the Prisma Account row exists.
 * Pass tokens from signIn/signUp when available — avoids a slow extra getSession() round trip.
 */
export async function establishConsoleSessionClient(tokens?: SessionTokens): Promise<ConsoleAccountPayload> {
  if (tokens?.access_token && tokens.refresh_token) {
    return bridgeSession(tokens);
  }

  const supabase = createBrowserSupabaseClient();
  const { data: { session } } = await withAuthTimeout(
    supabase.auth.getSession(),
    AUTH_TIMEOUT_MS.sessionRead,
  );
  if (!session?.access_token || !session.refresh_token) {
    throw new Error("No active session after sign-in.");
  }

  return bridgeSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
}

/** @deprecated Prefer establishConsoleSessionClient after password sign-in. */
export async function getOrCreateAccountClient() {
  return establishConsoleSessionClient();
}

export { AuthTimeoutError };
