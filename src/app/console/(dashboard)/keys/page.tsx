import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ApiKeysPanel } from "@/components/console/ApiKeysPanel";
import { getOrCreateAccount, getSessionUser } from "@/lib/account";
import { getConsoleLang } from "@/lib/console-lang";
import { consoleDashboardCopy } from "@/lib/console-translation";
import { resolvePlanLimits, utcDayWindow } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  const copy = consoleDashboardCopy(await getConsoleLang());
  return { title: copy.keys.title };
}

export const dynamic = "force-dynamic";

export default async function ConsoleKeysPage() {
  const user = await getSessionUser();
  if (!user?.email) redirect("/console/login");
  const account = await getOrCreateAccount({
    authUserId: user.id,
    email: user.email,
  });

  const copy = consoleDashboardCopy(await getConsoleLang());
  const limits = resolvePlanLimits({
    plan: account.plan,
    dailyPointsOverride: account.dailyPointsOverride,
    maxKeysOverride: account.maxKeysOverride,
  });
  const { start, end } = utcDayWindow();
  const keys = await prisma.apiKey.findMany({
    where: { accountId: account.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      prefix: true,
      lastFour: true,
      createdAt: true,
      lastUsedAt: true,
      revokedAt: true,
    },
  });
  const [usedToday, usageRows] = await Promise.all([
    prisma.apiRequest.count({
      where: {
        apiKey: { accountId: account.id },
        requestedAt: { gte: start, lt: end },
      },
    }),
    prisma.apiRequest.groupBy({
      by: ["apiKeyId"],
      where: {
        apiKeyId: { in: keys.map((key) => key.id) },
        requestedAt: { gte: start, lt: end },
      },
      _count: { _all: true },
    }),
  ]);
  const usageByKeyId = Object.fromEntries(
    usageRows
      .filter((row) => row.apiKeyId)
      .map((row) => [row.apiKeyId!, row._count._all]),
  );

  return (
    <div className="console-page">
      <header className="console-page-header">
        <p className="console-kicker">{copy.keys.kicker}</p>
        <h1>{copy.keys.heading}</h1>
        <p className="console-page-description">
          {copy.keys.description}
        </p>
      </header>
      <ApiKeysPanel
        plan={account.plan}
        usedToday={usedToday}
        dailyLimit={limits.dailyRequests}
        maxKeys={limits.maxKeys}
        usageByKeyId={usageByKeyId}
        initialKeys={keys.map((key) => ({
          ...key,
          createdAt: key.createdAt.toISOString(),
          lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
          revokedAt: key.revokedAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
