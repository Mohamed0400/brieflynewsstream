export class AuthTimeoutError extends Error {
  constructor() {
    super("auth_timeout");
    this.name = "AuthTimeoutError";
  }
}

export async function withAuthTimeout<T>(promise: Promise<T>, ms = 8_000): Promise<T> {
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
