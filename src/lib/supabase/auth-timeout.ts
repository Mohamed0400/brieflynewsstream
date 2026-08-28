export class AuthTimeoutError extends Error {
  constructor() {
    super("auth_timeout");
    this.name = "AuthTimeoutError";
  }
}

/** Default auth budgets (ms). */
export const AUTH_TIMEOUT_MS = {
  sessionRead: 15_000,
  signIn: 30_000,
  signUp: 30_000,
  resetEmail: 45_000,
  passwordUpdate: 20_000,
  bridge: 30_000,
  confirmExchange: 20_000,
  gateSessionCheck: 8_000,
  serverAuth: 35_000,
} as const;

/** Retries once on timeout — helps when Supabase Auth is briefly slow. */
export const AUTH_RETRY_ATTEMPTS = 1;

export async function withAuthTimeout<T>(promise: Promise<T>, ms: number = AUTH_TIMEOUT_MS.sessionRead): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new AuthTimeoutError()), ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export function isAuthTimeoutError(error: unknown) {
  return error instanceof AuthTimeoutError
    || (error instanceof Error && error.message === "auth_timeout");
}

export async function withAuthRetry<T>(
  run: () => Promise<T>,
  ms: number,
  retries: number = AUTH_RETRY_ATTEMPTS,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await withAuthTimeout(run(), ms);
    } catch (error) {
      lastError = error;
      if (!isAuthTimeoutError(error) || attempt === retries) throw error;
    }
  }
  throw lastError;
}
