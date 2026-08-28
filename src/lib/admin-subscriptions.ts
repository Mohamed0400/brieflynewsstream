import { prisma } from "@/lib/prisma";

const ACTIVE_SUB_STATUSES = new Set(["active", "trialing", "past_due"]);

export type BillingKind = "free" | "monthly" | "one_time" | "cancelled";

export function inferBillingKind(input: {
  plan: string;
  subscriptionStatus: string | null;
  cancelAtPeriodEnd: boolean;
  paidInvoiceCount: number;
}): BillingKind {
  if (input.plan === "FREE") return "free";
  if (input.subscriptionStatus && ACTIVE_SUB_STATUSES.has(input.subscriptionStatus)) {
    return input.cancelAtPeriodEnd ? "cancelled" : "monthly";
  }
  if (input.paidInvoiceCount >= 1) return "one_time";
  return "free";
}

export async function fetchAdminSubscriptionMetrics() {
  const now = new Date();
  const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const since60d = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [
    subscriptions,
    paidInvoicesByAccount,
    paidInvoices30d,
    signupsByMonth,
    planCounts,
  ] = await Promise.all([
    prisma.subscription.findMany({
      select: {
        status: true,
        planTier: true,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: true,
        createdAt: true,
        accountId: true,
      },
    }),
    prisma.invoice.groupBy({
      by: ["accountId"],
      where: { status: "PAID", example: false },
      _count: true,
    }),
    prisma.invoice.findMany({
      where: { status: "PAID", example: false, paidAt: { gte: since30d } },
      select: { accountId: true, planTier: true, paidAt: true, totalCents: true },
    }),
    prisma.$queryRaw<Array<{ month: Date; count: bigint }>>`
      SELECT date_trunc('month', "createdAt") AS month, count(*)::bigint AS count
      FROM "Account"
      WHERE "createdAt" >= ${new Date(now.getFullYear(), now.getMonth() - 5, 1)}
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    prisma.account.groupBy({ by: ["plan"], _count: true }),
  ]);

  const paidCountByAccount = new Map(
    paidInvoicesByAccount.map((row) => [row.accountId, row._count]),
  );

  let activeMonthly = 0;
  let cancellingMonthly = 0;
  let inactiveSubs = 0;

  for (const sub of subscriptions) {
    if (ACTIVE_SUB_STATUSES.has(sub.status)) {
      if (sub.cancelAtPeriodEnd) cancellingMonthly += 1;
      else activeMonthly += 1;
    } else {
      inactiveSubs += 1;
    }
  }

  const paidAccountIds = new Set(paidInvoicesByAccount.map((row) => row.accountId));
  let oneTimePaid = 0;
  let renewedPaid = 0;

  for (const row of paidInvoicesByAccount) {
    const sub = subscriptions.find((item) => item.accountId === row.accountId);
    const isActiveMonthly = sub && ACTIVE_SUB_STATUSES.has(sub.status) && !sub.cancelAtPeriodEnd;
    if (row._count >= 2 || isActiveMonthly) renewedPaid += 1;
    else oneTimePaid += 1;
  }

  const cohortAccounts = await prisma.account.findMany({
    where: {
      createdAt: { lte: since60d },
      id: { in: [...paidAccountIds] },
    },
    select: { id: true, status: true, plan: true, createdAt: true },
  });

  const retained = cohortAccounts.filter(
    (account) =>
      account.status === "ACTIVE"
      && (account.plan === "PRO" || account.plan === "ENTERPRISE"),
  ).length;

  const retentionRate = cohortAccounts.length
    ? Math.round((retained / cohortAccounts.length) * 1000) / 10
    : 0;

  const mostSelectedPlan = [...planCounts].sort((a, b) => b._count - a._count)[0]?.plan || "FREE";

  const revenueByPlan = { PRO: 0, ENTERPRISE: 0, FREE: 0 };
  for (const invoice of paidInvoices30d) {
    if (invoice.planTier in revenueByPlan) {
      revenueByPlan[invoice.planTier as keyof typeof revenueByPlan] += invoice.totalCents;
    }
  }

  return {
    activeMonthly,
    cancellingMonthly,
    inactiveSubscriptions: inactiveSubs,
    oneTimePaid,
    renewedPaid,
    totalPaidAccounts: paidAccountIds.size,
    retentionRate,
    retentionCohort: cohortAccounts.length,
    retentionRetained: retained,
    mostSelectedPlan,
    planMix: {
      FREE: planCounts.find((row) => row.plan === "FREE")?._count || 0,
      PRO: planCounts.find((row) => row.plan === "PRO")?._count || 0,
      ENTERPRISE: planCounts.find((row) => row.plan === "ENTERPRISE")?._count || 0,
    },
    signupsByMonth: signupsByMonth.map((row) => ({
      month: row.month instanceof Date ? row.month.toISOString().slice(0, 7) : String(row.month).slice(0, 7),
      count: Number(row.count),
    })),
    paidInvoices30d: paidInvoices30d.length,
    revenue30dByPlanCents: revenueByPlan,
  };
}
