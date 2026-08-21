const INTERNAL_ERROR_RE =
  /prisma|can't reach database|cannot reach database|database server|econnrefused|enotfound|etimedout|epipe|supabase|pooler\.|turbopack|__TURBOPACK__|\.next[/\\]|node_modules|\/Users\/|\/home\/|\\\\Users\\\\|P1000|P1001|P1017|P2021|P2024|DATABASE_URL|postgres(ql)?:\/\//i;

export const PUBLIC_SERVER_ERROR =
  "The service is temporarily unavailable. Try again shortly.";

export const PUBLIC_PAGE_ERROR = "An unexpected error occurred. Try again shortly.";

function errorText(error: unknown) {
  if (error instanceof Error) return `${error.name} ${error.message}`;
  return String(error);
}

export function isInternalError(error: unknown) {
  const raw = errorText(error);
  return INTERNAL_ERROR_RE.test(raw) || raw.includes("Invalid `prisma");
}

export function publicErrorMessage(error: unknown, fallback = PUBLIC_SERVER_ERROR) {
  if (isInternalError(error)) return fallback;
  const message =
    error instanceof Error ? error.message.trim()
    : typeof error === "string" ? error.trim()
    : "";
  if (!message || message.length > 180 || message.includes("\n") || message.includes("`")) {
    return fallback;
  }
  return message;
}
