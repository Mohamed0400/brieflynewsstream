/**
 * Decide how to link a Neon/Supabase auth user id to an existing Account row.
 * After auth-provider migration, Accounts may still hold the old authUserId while
 * email matches — prefer the oldest row so API keys / billing stay attached.
 */
export type AccountLinkCandidate = {
  id: string;
  authUserId: string;
  createdAt: Date;
};

export type AccountLinkPlan =
  | { action: "create" }
  | { action: "use"; accountId: string }
  | {
      action: "relink";
      accountId: string;
      /** Existing row that currently owns `authUserId` and must release it first */
      releaseAuthUserIdFrom?: string;
      /** Empty duplicate to delete after relink (optional) */
      deleteAccountId?: string;
    };

export function planAccountLink(input: {
  authUserId: string;
  byAuthUserId: AccountLinkCandidate | null;
  byEmailOldest: AccountLinkCandidate | null;
}): AccountLinkPlan {
  const { authUserId, byAuthUserId, byEmailOldest } = input;

  if (byAuthUserId && byEmailOldest && byAuthUserId.id !== byEmailOldest.id) {
    const canonical =
      byEmailOldest.createdAt.getTime() <= byAuthUserId.createdAt.getTime()
        ? byEmailOldest
        : byAuthUserId;
    const duplicate = canonical.id === byAuthUserId.id ? byEmailOldest : byAuthUserId;
    return {
      action: "relink",
      accountId: canonical.id,
      releaseAuthUserIdFrom:
        duplicate.authUserId === authUserId ? duplicate.id : undefined,
      deleteAccountId: duplicate.id,
    };
  }

  if (byAuthUserId) {
    return { action: "use", accountId: byAuthUserId.id };
  }

  if (byEmailOldest) {
    return { action: "relink", accountId: byEmailOldest.id };
  }

  return { action: "create" };
}

/** Session/user payload from Neon `signIn.email` / `signUp.email` (Better Auth shape). */
export type NeonAuthUserPayload = {
  id: string;
  email?: string | null;
  emailVerified?: boolean | null;
  user_metadata?: Record<string, unknown>;
  name?: string | null;
};

export function userFromNeonAuthData(data: unknown): NeonAuthUserPayload | null {
  if (!data || typeof data !== "object") return null;
  const record = data as { user?: NeonAuthUserPayload | null };
  const user = record.user;
  if (!user?.id) return null;
  return user;
}
