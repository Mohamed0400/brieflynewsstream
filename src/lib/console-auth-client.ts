import {
  AUTH_TIMEOUT_MS,
  AuthTimeoutError,
  withAuthTimeout,
} from "@/lib/supabase/auth-timeout";
import type { ConsoleAccountPayload } from "./account-client";

type AuthApiError = {
  error?: string;
  message?: string;
};

async function readAuthResponse(response: Response): Promise<AuthApiError & Partial<ConsoleAccountPayload> & { needsConfirmation?: boolean }> {
  return response.json().catch(() => ({})) as Promise<AuthApiError & Partial<ConsoleAccountPayload> & { needsConfirmation?: boolean }>;
}

export async function signInViaServer(input: {
  email: string;
  password: string;
}): Promise<ConsoleAccountPayload> {
  const response = await withAuthTimeout(
    fetch("/api/console/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "signin", ...input }),
    }),
    AUTH_TIMEOUT_MS.serverAuth + 5_000,
  );
  const payload = await readAuthResponse(response);
  if (!response.ok || !payload.account) {
    throw new AuthApiRequestError(payload.message || "Unable to authenticate.", payload.error, response.status);
  }
  return { account: payload.account };
}

export async function signUpViaServer(input: {
  email: string;
  password: string;
  country: string;
  address: string;
  mobilePhone: string;
}): Promise<{ account?: ConsoleAccountPayload["account"]; needsConfirmation?: boolean }> {
  const response = await withAuthTimeout(
    fetch("/api/console/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "signup", ...input }),
    }),
    AUTH_TIMEOUT_MS.serverAuth + 5_000,
  );
  const payload = await readAuthResponse(response);
  if (payload.needsConfirmation) {
    return { needsConfirmation: true };
  }
  if (!response.ok || !payload.account) {
    throw new AuthApiRequestError(payload.message || "Unable to register.", payload.error, response.status);
  }
  return { account: payload.account };
}

export async function recoverPasswordViaServer(email: string): Promise<void> {
  const response = await withAuthTimeout(
    fetch("/api/console/auth/recover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }),
    AUTH_TIMEOUT_MS.resetEmail + 5_000,
  );
  const payload = await readAuthResponse(response);
  if (!response.ok) {
    throw new AuthApiRequestError(payload.message || "Unable to send reset email.", payload.error, response.status);
  }
}

export class AuthApiRequestError extends Error {
  code: string | undefined;
  status: number;

  constructor(message: string, code?: string, status = 400) {
    super(message);
    this.name = "AuthApiRequestError";
    this.code = code;
    this.status = status;
  }
}

export function isAuthApiDuplicate(error: unknown) {
  return error instanceof AuthApiRequestError && error.code === "duplicate";
}

export function isAuthApiBlocked(error: unknown) {
  return error instanceof AuthApiRequestError && error.code === "blocked";
}

export { AuthTimeoutError };
