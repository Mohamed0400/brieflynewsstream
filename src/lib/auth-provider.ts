/**
 * Auth provider selection for console.
 * Default remains `supabase` so production is not half-cutover.
 * Set AUTH_PROVIDER=neon only after DATABASE_URL points at Neon with migrations applied.
 */
export type AuthProvider = "supabase" | "neon";

export function authProvider(): AuthProvider {
  const raw = process.env.AUTH_PROVIDER?.trim().toLowerCase();
  if (raw === "neon") return "neon";
  return "supabase";
}

export function isNeonAuthEnabled() {
  return authProvider() === "neon";
}
