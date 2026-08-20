import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BillingPanel } from "@/components/console/BillingPanel";
import { getOrCreateAccount, getSessionUser } from "@/lib/account";
import { getConsoleLang } from "@/lib/console-lang";
import { consoleDashboardCopy } from "@/lib/console-translation";
import { resolvePlanLimits, utcDayWindow } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  const copy = consoleDashboardCopy(await getConsoleLang());
  return { title: copy.billing.title };
}

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const user = await getSessionUser();
  if (!user?.email) redirect("/console/login");
  const account = await getOrCreateAccount({ authUserId: user.id, email: user.email });
  const limits = resolvePlanLimits({
    plan: account.plan,
    dailyPointsOverride: account.dailyPointsOverride,
    maxKeysOverride: account.maxKeysOverride,
  });
  const { start, end } = utcDayWindow();
  const [usedToday, activeKeys] = await Promise.all([
    prisma.apiRequest.count({
      where: {
        apiKey: { accountId: account.id },
        requestedAt: { gte: start, lt: end },
      },
    }),
    prisma.apiKey.count({
      where: { accountId: account.id, revokedAt: null },
    }),
  ]);

  return (
    <BillingPanel
      plan={account.plan}
      status={account.status}
      isAdmin={account.role === "SUPER_ADMIN"}
      usedToday={usedToday}
      dailyLimit={limits.dailyRequests}
      activeKeys={activeKeys}
      maxKeys={limits.maxKeys}
      listPriceMonthlyUsd={limits.listPriceMonthlyUsd}
    />
  );
}
