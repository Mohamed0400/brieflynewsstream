export class AuthTimeoutError extends Error {
  constructor() {
    super("auth_timeout");
    this.name = "AuthTimeoutError";
  }
}

/** Default client-side auth budgets (ms). */
export const AUTH_TIMEOUT_MS = {
  sessionRead: 15_000,
  signIn: 25_000,
  signUp: 25_000,
  resetEmail: 20_000,
  passwordUpdate: 20_000,
  bridge: 30_000,
  confirmExchange: 20_000,
  gateSessionCheck: 8_000,
} as const;

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
