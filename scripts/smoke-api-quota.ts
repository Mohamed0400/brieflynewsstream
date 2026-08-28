import { ensureE2eQuotaApiKey, e2eQuotaApiKeyPlaintext } from "../src/lib/e2e-api-key";
import { PLAN_DEFINITIONS, resolvePlanLimits, utcDayWindow } from "../src/lib/plans";
import { prisma } from "../src/lib/prisma";

const baseUrl = (process.env.BASE_URL || process.env.PRODUCTION_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
const quotaTestEmail = (process.env.QUOTA_TEST_EMAIL || process.env.CONSOLE_E2E_EMAIL || "console-e2e@briefly.local").trim().toLowerCase();

async function main() {
  const account = await prisma.account.findFirst({
    where: { email: { equals: quotaTestEmail, mode: "insensitive" } },
    select: {
      id: true,
      plan: true,
      dailyPointsOverride: true,
      maxKeysOverride: true,
    },
  });
  if (!account) {
    console.error(`No account found for ${quotaTestEmail}. Run: npm run auth:ensure-user`);
    process.exitCode = 1;
    return;
  }

  const { plaintext: apiKeyPlaintext } = await ensureE2eQuotaApiKey(account.id);
  const limits = resolvePlanLimits({
    plan: account.plan,
    dailyPointsOverride: account.dailyPointsOverride,
    maxKeysOverride: account.maxKeysOverride,
  });
  const { start, end } = utcDayWindow();
  const usedBefore = await prisma.apiRequest.count({
    where: {
      apiKey: { accountId: account.id },
      requestedAt: { gte: start, lt: end },
    },
  });
  const remainingBefore = Math.max(0, limits.dailyRequests - usedBefore);

  const problems: string[] = [];
  const headers = { "X-API-Key": apiKeyPlaintext };

  if (remainingBefore === 0) {
    const blocked = await fetch(`${baseUrl}/api/v1/meta/categories`, { headers });
    if (blocked.status !== 429) {
      problems.push(`expected 429 when quota exhausted, got ${blocked.status}`);
    } else {
      const body = await blocked.json() as { error?: string };
      if (body.error !== "quota_exceeded") {
        problems.push(`expected quota_exceeded, got ${body.error ?? "unknown"}`);
      }
      if (blocked.headers.get("X-API-Quota-Remaining") !== "0") {
        problems.push("expected X-API-Quota-Remaining: 0 when blocked");
      }
    }
  } else {
    const response = await fetch(`${baseUrl}/api/v1/meta/categories`, { headers });
    if (!response.ok) {
      problems.push(`expected successful request, got HTTP ${response.status}`);
    } else {
      const limitHeader = response.headers.get("X-API-Quota-Limit");
      const remainingHeader = response.headers.get("X-API-Quota-Remaining");
      const planHeader = response.headers.get("X-API-Plan");
      if (limitHeader !== String(limits.dailyRequests)) {
        problems.push(`X-API-Quota-Limit expected ${limits.dailyRequests}, got ${limitHeader}`);
      }
      if (remainingHeader !== String(remainingBefore - 1)) {
        problems.push(`X-API-Quota-Remaining expected ${remainingBefore - 1}, got ${remainingHeader}`);
      }
      if (planHeader !== account.plan) {
        problems.push(`X-API-Plan expected ${account.plan}, got ${planHeader}`);
      }
    }
  }

  if (account.plan === "FREE") {
    if (limits.dailyRequests !== PLAN_DEFINITIONS.FREE.dailyRequests) {
      problems.push(`FREE daily limit drift: ${limits.dailyRequests}`);
    }
    if (limits.maxKeys !== PLAN_DEFINITIONS.FREE.maxKeys) {
      problems.push(`FREE key limit drift: ${limits.maxKeys}`);
    }
  }

  if (problems.length) {
    console.error(`API quota smoke failed against ${baseUrl}`);
    for (const problem of problems) console.error(`- ${problem}`);
    process.exitCode = 1;
    return;
  }

  console.log(JSON.stringify({
    ok: true,
    baseUrl,
    email: quotaTestEmail,
    plan: account.plan,
    dailyLimit: limits.dailyRequests,
    usedBefore,
    remainingBefore,
    checkedBlocked: remainingBefore === 0,
    keyConfigured: Boolean(e2eQuotaApiKeyPlaintext()),
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
