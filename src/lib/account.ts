import type { Account, AccountRole, PlanTier } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { createServerSupabaseClient } from "./supabase/server";
import { superAdminEmails } from "./supabase/env";
import { profileFromAuthMetadata, type SignupProfile } from "./signup-profile";

export type AccountWithMeta = Account;

function desiredRole(email: string): AccountRole {
  return superAdminEmails().includes(email.toLowerCase())
    ? "SUPER_ADMIN"
    : "MEMBER";
}

function profileFields(profile?: Partial<SignupProfile>) {
  return {
    ...(profile?.country ? { country: profile.country } : {}),
    ...(profile?.address ? { address: profile.address } : {}),
    ...(profile?.mobilePhone ? { mobilePhone: profile.mobilePhone } : {}),
  };
}

export async function getOrCreateAccount(input: {
  authUserId: string;
  email: string;
  profile?: Partial<SignupProfile>;
}): Promise<Account> {
  const email = input.email.trim().toLowerCase();
  const role = desiredRole(email);
  const profile = profileFields(input.profile);

  const existing = await prisma.account.findUnique({
    where: { authUserId: input.authUserId },
  });
  if (existing) {
    const nextProfile = {
      ...(!existing.country ? profile.country ? { country: profile.country } : {} : {}),
      ...(!existing.address ? profile.address ? { address: profile.address } : {} : {}),
      ...(!existing.mobilePhone ? profile.mobilePhone ? { mobilePhone: profile.mobilePhone } : {} : {}),
    };
    const shouldPromote = role === "SUPER_ADMIN" && existing.role !== "SUPER_ADMIN";
    if (existing.email !== email || shouldPromote || Object.keys(nextProfile).length > 0) {
      return prisma.account.update({
        where: { id: existing.id },
        data: {
          email,
          ...(shouldPromote ? { role: "SUPER_ADMIN" as const } : {}),
          ...nextProfile,
        },
      });
    }
    return existing;
  }

  const created = await prisma.account.create({
    data: {
      authUserId: input.authUserId,
      email,
      role,
      status: "ACTIVE",
      plan: "FREE" satisfies PlanTier,
      ...profile,
    },
  });
  return created;
}

export async function getSessionUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function requireAccount(): Promise<
  { account: Account; userId: string; email: string } | { response: NextResponse }
> {
  const user = await getSessionUser();
  if (!user?.email) {
    return {
      response: NextResponse.json(
        { error: "unauthorized", message: "Sign in to continue." },
        { status: 401 },
      ),
    };
  }

  const account = await getOrCreateAccount({
    authUserId: user.id,
    email: user.email,
    profile: profileFromAuthMetadata(user.user_metadata),
  });

  if (account.status === "CLOSED") {
    return {
      response: NextResponse.json(
        { error: "account_closed", message: "This account has been closed." },
        { status: 403 },
      ),
    };
  }

  if (account.status === "SUSPENDED") {
    return {
      response: NextResponse.json(
        { error: "account_suspended", message: "This account is suspended." },
        { status: 403 },
      ),
    };
  }

  return { account, userId: user.id, email: user.email };
}

export async function requireSuperAdmin(): Promise<
  { account: Account; userId: string; email: string } | { response: NextResponse }
> {
  const result = await requireAccount();
  if ("response" in result) return result;
  if (result.account.role !== "SUPER_ADMIN") {
    return {
      response: NextResponse.json(
        { error: "forbidden", message: "Super-admin access required." },
        { status: 403 },
      ),
    };
  }
  return result;
}

export function isSuperAdmin(account: Account) {
  return account.role === "SUPER_ADMIN";
}
