export function safeAppPath(next: string | null | undefined, fallback = "/console/overview") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return fallback;
  }
  return next;
}

export function consoleAuthCallbackUrl(origin: string, next = "/console/overview") {
  const url = new URL("/auth/confirm", origin);
  url.searchParams.set("next", safeAppPath(next));
  return url.toString();
}
