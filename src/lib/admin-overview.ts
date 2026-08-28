import { fetchAdminSubscriptionMetrics } from "@/lib/admin-subscriptions";
import { prisma } from "@/lib/prisma";
import { PLAN_DEFINITIONS, planPriceCents, utcDayWindow } from "@/lib/plans";

function topByCount<T extends { _count: number }>(rows: T[], limit: number) {
  return [...rows].sort((a, b) => b._count - a._count).slice(0, limit);
}

export async function fetchAdminOverview() {
  const { start, end } = utcDayWindow();
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    accountsTotal,
    accountsActive,
    accountsByPlan,
    paidInvoices,
    openInvoices,
    apiRequestsToday,
    apiRequests7d,
    pageViewsToday,
    pageViews7d,
    signups7d,
    signups30d,
    channels7d,
    utmSources7d,
    topPaths7d,
  ] = await Promise.all([
    prisma.account.count(),
    prisma.account.count({ where: { status: "ACTIVE" } }),
    prisma.account.groupBy({ by: ["plan"], _count: true }),
    prisma.invoice.aggregate({
      where: { status: "PAID", paidAt: { gte: since30d } },
      _sum: { amountPaidCents: true, totalCents: true },
      _count: true,
    }),
    prisma.invoice.count({ where: { status: "OPEN" } }),
    prisma.apiRequest.count({ where: { requestedAt: { gte: start, lt: end } } }),
    prisma.apiRequest.count({ where: { requestedAt: { gte: since7d } } }),
    prisma.pageView.count({ where: { viewedAt: { gte: start, lt: end } } }).catch(() => 0),
    prisma.pageView.count({ where: { viewedAt: { gte: since7d } } }).catch(() => 0),
    prisma.account.count({ where: { createdAt: { gte: since7d } } }),
    prisma.account.count({ where: { createdAt: { gte: since30d } } }),
    prisma.pageView.groupBy({
      by: ["channel"],
      where: { viewedAt: { gte: since7d } },
      _count: true,
    }).catch(() => []),
    prisma.pageView.groupBy({
      by: ["utmSource"],
      where: { viewedAt: { gte: since7d }, utmSource: { not: "" } },
      _count: true,
    }).catch(() => []),
    prisma.pageView.groupBy({
      by: ["path"],
      where: { viewedAt: { gte: since7d } },
      _count: true,
    }).catch(() => []),
  ]);

  const planCounts = Object.fromEntries(
    accountsByPlan.map((row) => [row.plan, row._count]),
  ) as Record<string, number>;

  const mrrCents =
    (planCounts.PRO || 0) * planPriceCents("PRO")
    + (planCounts.ENTERPRISE || 0) * planPriceCents("ENTERPRISE");

  const revenue30dCents =
    paidInvoices._sum.amountPaidCents || paidInvoices._sum.totalCents || 0;

  const subscriptions = await fetchAdminSubscriptionMetrics();

  return {
    accounts: {
      total: accountsTotal,
      active: accountsActive,
      byPlan: {
        FREE: planCounts.FREE || 0,
        PRO: planCounts.PRO || 0,
        ENTERPRISE: planCounts.ENTERPRISE || 0,
      },
      signups7d,
      signups30d,
    },
    revenue: {
      mrrCents,
      mrrUsd: mrrCents / 100,
      paidInvoices30d: paidInvoices._count,
      revenue30dCents,
      revenue30dUsd: revenue30dCents / 100,
      openInvoices,
      proPriceUsd: PLAN_DEFINITIONS.PRO.listPriceMonthlyUsd,
      enterprisePriceUsd: PLAN_DEFINITIONS.ENTERPRISE.listPriceMonthlyUsd,
    },
    api: {
      requestsToday: apiRequestsToday,
      requests7d: apiRequests7d,
    },
    traffic: {
      pageViewsToday,
      pageViews7d,
      channels7d: topByCount(channels7d, 12).map((row) => ({
        channel: row.channel || "direct",
        views: row._count,
      })),
      utmSources7d: topByCount(utmSources7d, 10).map((row) => ({
        source: row.utmSource,
        views: row._count,
      })),
      topPaths7d: topByCount(topPaths7d, 10).map((row) => ({
        path: row.path,
        views: row._count,
      })),
    },
    subscriptions,
  };
}
