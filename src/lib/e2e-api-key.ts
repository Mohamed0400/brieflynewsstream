import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { resolvePlanLimits } from "@/lib/plans";

export const E2E_QUOTA_KEY_NAME = "E2E quota smoke";

export function e2eQuotaApiKeyPlaintext() {
  const configured = process.env.QUOTA_TEST_API_KEY?.trim();
  if (configured) return configured;
  return "mna_test_e2e_quota_smoke_do_not_use_in_production";
}

function hashApiKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function parseKeyParts(plaintext: string) {
  const match = plaintext.match(/^(mna_(?:test|live)_)/);
  if (!match) {
    throw new Error("QUOTA_TEST_API_KEY must start with mna_test_ or mna_live_.");
  }
  return {
    prefix: match[1],
    lastFour: plaintext.slice(-4),
    keyHash: hashApiKey(plaintext),
  };
}

export async function ensureE2eQuotaApiKey(accountId: string) {
  const plaintext = e2eQuotaApiKeyPlaintext();
  const parts = parseKeyParts(plaintext);

  const existingByHash = await prisma.apiKey.findFirst({
    where: { accountId, keyHash: parts.keyHash, revokedAt: null },
    select: { id: true, name: true },
  });
  if (existingByHash) {
    return { plaintext, keyId: existingByHash.id, created: false };
  }

  const named = await prisma.apiKey.findFirst({
    where: { accountId, name: E2E_QUOTA_KEY_NAME, revokedAt: null },
    select: { id: true },
  });
  if (named) {
    await prisma.apiKey.update({
      where: { id: named.id },
      data: {
        prefix: parts.prefix,
        keyHash: parts.keyHash,
        lastFour: parts.lastFour,
        lastUsedAt: null,
      },
    });
    return { plaintext, keyId: named.id, created: false, rotated: true };
  }

  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: {
      plan: true,
      dailyPointsOverride: true,
      maxKeysOverride: true,
    },
  });
  if (!account) throw new Error(`Account ${accountId} not found.`);

  const limits = resolvePlanLimits({
    plan: account.plan,
    dailyPointsOverride: account.dailyPointsOverride,
    maxKeysOverride: account.maxKeysOverride,
  });
  const activeKeys = await prisma.apiKey.count({
    where: { accountId, revokedAt: null },
  });
  if (activeKeys >= limits.maxKeys) {
    const oldest = await prisma.apiKey.findFirst({
      where: { accountId, revokedAt: null },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (!oldest) throw new Error("Key limit reached but no active key found.");
    await prisma.apiKey.update({
      where: { id: oldest.id },
      data: { revokedAt: new Date() },
    });
  }

  const created = await prisma.apiKey.create({
    data: {
      accountId,
      name: E2E_QUOTA_KEY_NAME,
      prefix: parts.prefix,
      keyHash: parts.keyHash,
      lastFour: parts.lastFour,
    },
    select: { id: true },
  });

  return { plaintext, keyId: created.id, created: true };
}
