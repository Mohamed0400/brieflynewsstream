/**
 * Browser helper: ensure Prisma Account exists after Supabase Auth succeeds.
 * Calls a small API so we never expose the service role key.
 */
export async function getOrCreateAccountClient() {
  const response = await fetch("/api/console/account", { method: "POST" });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || "Unable to create account profile");
  }
  return response.json() as Promise<{
    account: {
      id: string;
      email: string;
      plan: string;
      role: string;
      status: string;
    };
  }>;
}
