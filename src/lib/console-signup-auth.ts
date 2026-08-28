import type { User } from "@supabase/supabase-js";

export function isBlockedAccountStatus(status: string) {
  return status === "SUSPENDED" || status === "CLOSED";
}

/** Supabase may return an empty identities array when the email is already registered. */
export function isDuplicateSignupUser(user: User | null | undefined) {
  return Boolean(user && Array.isArray(user.identities) && user.identities.length === 0);
}

export function isDuplicateSignupError(message: string) {
  const lower = message.toLowerCase();
  return lower.includes("already registered") || lower.includes("already exists");
}
