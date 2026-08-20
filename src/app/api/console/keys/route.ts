import { NextResponse } from "next/server";
import { requireAccount } from "@/lib/account";
import { createApiKey } from "@/lib/auth";
import { isTrustedConsoleOrigin } from "@/lib/console-auth";
import { resolvePlanLimits } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  if (!isTrustedConsoleOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }
  const auth = await requireAccount();
  if ("response" in auth) return auth.response;
  if (auth.account.status === "SUSPENDED") {
    return NextResponse.json(
      { error: "account_suspended", message: "This account is suspended." },
      { status: 403 },
    );
  }

  const limits = resolvePlanLimits({
    plan: auth.account.plan,
    dailyPointsOverride: auth.account.dailyPointsOverride,
    maxKeysOverride: auth.account.maxKeysOverride,
  });
  const activeKeys = await prisma.apiKey.count({
    where: { accountId: auth.account.id, revokedAt: null },
  });
  if (activeKeys >= limits.maxKeys) {
    return NextResponse.json(
      {
        error: "key_limit",
        message: `Your ${limits.label} plan allows ${limits.maxKeys} active API keys.`,
        limit: limits.maxKeys,
      },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => ({})) as { name?: string };
  const name = body.name?.trim() || "Default key";
  if (name.length > 80) {
    return NextResponse.json(
      { error: "invalid_name", message: "Key name must be 80 characters or fewer." },
      { status: 400 },
    );
  }
  const { plaintext, record } = await createApiKey(name, auth.account.id);
  return NextResponse.json({
    key: plaintext,
    item: {
      id: record.id,
      name: record.name,
      prefix: record.prefix,
      lastFour: record.lastFour,
      createdAt: record.createdAt.toISOString(),
      lastUsedAt: null,
      revokedAt: null,
    },
  }, { status: 201 });
}
