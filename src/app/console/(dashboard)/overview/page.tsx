import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ConsoleOverviewDashboard } from "@/components/console/ConsoleOverviewDashboard";
import { ConsoleWelcomeBanner } from "@/components/console/ConsoleWelcomeBanner";
import { getOrCreateAccount, getSessionUser } from "@/lib/account";
import { getConsoleLang } from "@/lib/console-lang";
import { consoleDashboardCopy } from "@/lib/console-translation";
import { COUNTRY_CATALOG } from "@/lib/countries";
import { CATEGORY_META } from "@/lib/market";
import { resolvePlanLimits, utcDayWindow } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getConsoleLang();
  const copy = consoleDashboardCopy(lang);
  return { title: copy.overview.title };
}

export const dynamic = "force-dynamic";

export default async function ConsoleOverviewPage() {
  const user = await getSessionUser();
  if (!user?.email) redirect("/console/login");

  const account = await getOrCreateAccount({
    authUserId: user.id,
    email: user.email,
  });

  const lang = await getConsoleLang();
  const copy = consoleDashboardCopy(lang);
  const planLabel =
    account.plan === "PRO" ? "Pro"
    : account.plan === "ENTERPRISE" ? "Enterprise"
    : copy.workspacePlan;
  const isPaid = account.plan === "PRO" || account.plan === "ENTERPRISE";
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
    <div className="console-page console-overview-page">
      <ConsoleWelcomeBanner planLabel={planLabel} isPaid={isPaid} />
      <ConsoleOverviewDashboard
        countries={COUNTRY_CATALOG.length}
        categories={CATEGORY_META.length}
        activeKeys={activeKeys}
        maxKeys={limits.maxKeys}
        dailyLimit={limits.dailyRequests}
        requestsUsed={usedToday}
        languagesLabel={copy.overview.languagesValue}
      />
    </div>
  );
}
