import { NextResponse } from "next/server";
import type { AccountStatus, PlanTier } from "@prisma/client";
import { logAdminAction } from "@/lib/admin-audit";
import { inferBillingKind } from "@/lib/admin-subscriptions";
import { requireSuperAdmin } from "@/lib/account";
import { isTrustedConsoleOrigin } from "@/lib/console-auth";
import { prisma } from "@/lib/prisma";
import { resolvePlanLimits, utcDayWindow } from "@/lib/plans";

const plans = new Set<PlanTier>(["FREE", "PRO", "ENTERPRISE"]);
const statuses = new Set<AccountStatus>(["ACTIVE", "SUSPENDED", "CLOSED"]);

export async function GET(request: Request) {
  if (!isTrustedConsoleOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }
  const auth = await requireSuperAdmin();
  if ("response" in auth) return auth.response;

  const { start, end } = utcDayWindow();
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const accounts = await prisma.account.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      keys: {
        select: {
          id: true,
          name: true,
          prefix: true,
          lastFour: true,
          lastUsedAt: true,
          revokedAt: true,
        },
      },
      subscription: {
        select: {
          status: true,
          planTier: true,
          provider: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true,
          createdAt: true,
        },
      },
    },
  });

  const accountIds = accounts.map((account) => account.id);
  const invoices = await prisma.invoice.findMany({
    where: { accountId: { in: accountIds } },
    orderBy: { issuedAt: "desc" },
    select: {
      id: true,
      accountId: true,
      number: true,
      status: true,
      planTier: true,
      totalCents: true,
      issuedAt: true,
      paidAt: true,
    },
  }).catch(() => []);
  const invoicesByAccount = new Map<string, typeof invoices>();
  for (const invoice of invoices) {
    const list = invoicesByAccount.get(invoice.accountId) || [];
    if (list.length < 8) list.push(invoice);
    invoicesByAccount.set(invoice.accountId, list);
  }

  const keyIds = accounts.flatMap((account) => account.keys.map((key) => key.id));
  const usage = keyIds.length
    ? await prisma.apiRequest.groupBy({
        by: ["apiKeyId"],
        where: {
          apiKeyId: { in: keyIds },
          requestedAt: { gte: since7d },
        },
        _sum: { pointsUsed: true },
        _count: true,
      })
    : [];
  const usageToday = keyIds.length
    ? await prisma.apiRequest.groupBy({
        by: ["apiKeyId"],
        where: {
          apiKeyId: { in: keyIds },
          requestedAt: { gte: start, lt: end },
        },
        _sum: { pointsUsed: true },
        _count: true,
      })
    : [];
  const usageByKey7d = new Map(
    usage.flatMap((row) =>
      row.apiKeyId
        ? [[row.apiKeyId, { requests: row._count, points: row._sum.pointsUsed || 0 }] as const]
        : [],
    ),
  );
  const usageByKeyToday = new Map(
    usageToday.flatMap((row) =>
      row.apiKeyId
        ? [[row.apiKeyId, { requests: row._count, points: row._sum.pointsUsed || 0 }] as const]
        : [],
    ),
  );

  const paidCounts = await prisma.invoice.groupBy({
    by: ["accountId"],
    where: { accountId: { in: accountIds }, status: "PAID", example: false },
    _count: true,
  });
  const paidCountByAccount = new Map(paidCounts.map((row) => [row.accountId, row._count]));

  return NextResponse.json({
    items: accounts.map((account) => {
      const limits = resolvePlanLimits(account);
      const today = account.keys.reduce(
        (sum, key) => {
          const row = usageByKeyToday.get(key.id);
          return {
            requests: sum.requests + (row?.requests || 0),
            points: sum.points + (row?.points || 0),
          };
        },
        { requests: 0, points: 0 },
      );
      const week = account.keys.reduce(
        (sum, key) => {
          const row = usageByKey7d.get(key.id);
          return {
            requests: sum.requests + (row?.requests || 0),
            points: sum.points + (row?.points || 0),
          };
        },
        { requests: 0, points: 0 },
      );
      const paidInvoiceCount = paidCountByAccount.get(account.id) || 0;
      const billingKind = inferBillingKind({
        plan: account.plan,
        subscriptionStatus: account.subscription?.status || null,
        cancelAtPeriodEnd: account.subscription?.cancelAtPeriodEnd || false,
        paidInvoiceCount,
      });
      return {
        id: account.id,
        email: account.email,
        role: account.role,
        status: account.status,
        plan: account.plan,
        planSource: account.planSource,
        dailyPointsOverride: account.dailyPointsOverride,
        maxKeysOverride: account.maxKeysOverride,
        country: account.country,
        address: account.address,
        mobilePhone: account.mobilePhone,
        createdAt: account.createdAt.toISOString(),
        utmSource: account.utmSource,
        utmMedium: account.utmMedium,
        utmCampaign: account.utmCampaign,
        utmContent: account.utmContent,
        utmTerm: account.utmTerm,
        trafficChannel: account.trafficChannel,
        signupReferrer: account.signupReferrer,
        signupLandingPath: account.signupLandingPath,
        dailyLimit: limits.dailyRequests,
        maxKeys: limits.maxKeys,
        usageToday: today,
        usage7d: week,
        paidInvoiceCount,
        billingKind,
        keys: account.keys,
        subscription: account.subscription
          ? {
              ...account.subscription,
              currentPeriodEnd: account.subscription.currentPeriodEnd?.toISOString() || null,
              createdAt: account.subscription.createdAt.toISOString(),
            }
          : null,
        invoices: (invoicesByAccount.get(account.id) || []).map((invoice) => ({
          id: invoice.id,
          number: invoice.number,
          status: invoice.status,
          planTier: invoice.planTier,
          totalCents: invoice.totalCents,
          issuedAt: invoice.issuedAt,
          paidAt: invoice.paidAt,
        })),
      };
    }),
  });
}

export async function PATCH(request: Request) {
  if (!isTrustedConsoleOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }
  const auth = await requireSuperAdmin();
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => ({})) as {
    accountId?: string;
    email?: string;
    plan?: PlanTier;
    status?: AccountStatus;
    dailyPointsOverride?: number | null;
    maxKeysOverride?: number | null;
  };

  if (!body.accountId && !body.email) {
    return NextResponse.json(
      { error: "invalid_request", message: "Provide accountId or email." },
      { status: 400 },
    );
  }

  const target = body.accountId
    ? await prisma.account.findUnique({ where: { id: body.accountId } })
    : await prisma.account.findFirst({
        where: { email: body.email!.trim().toLowerCase() },
      });

  if (!target) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (body.plan && !plans.has(body.plan)) {
    return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
  }
  if (body.status && !statuses.has(body.status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const updated = await prisma.account.update({
    where: { id: target.id },
    data: {
      ...(body.plan ? { plan: body.plan, planSource: "ADMIN" as const } : {}),
      ...(body.status ? { status: body.status } : {}),
      ...(body.dailyPointsOverride !== undefined
        ? { dailyPointsOverride: body.dailyPointsOverride }
        : {}),
      ...(body.maxKeysOverride !== undefined
        ? { maxKeysOverride: body.maxKeysOverride }
        : {}),
    },
  });

  await logAdminAction({
    actorId: auth.account.id,
    action: "account.plan_update",
    targetType: "account",
    targetId: updated.id,
    metadata: {
      plan: updated.plan,
      status: updated.status,
      dailyPointsOverride: updated.dailyPointsOverride,
      maxKeysOverride: updated.maxKeysOverride,
    },
  });

  return NextResponse.json({
    item: {
      id: updated.id,
      email: updated.email,
      plan: updated.plan,
      status: updated.status,
      dailyPointsOverride: updated.dailyPointsOverride,
      maxKeysOverride: updated.maxKeysOverride,
    },
  });
}
