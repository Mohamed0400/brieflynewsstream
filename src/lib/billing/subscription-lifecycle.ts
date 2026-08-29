import type { PlanTier } from "@prisma/client";
import {
  extractAccountIdFromWebhook,
  extractInvoiceIdFromWebhook,
  extractLemonPeriodEnd,
  extractLemonSubscriptionId,
  extractLemonSubscriptionStatus,
  extractUserEmailFromWebhook,
  type LemonWebhookPayload,
  LEMONSQUEEZY_PROVIDER,
} from "@/lib/billing/lemonsqueezy";
import { prisma } from "@/lib/prisma";

const BILLING_MANAGED_SOURCES = new Set(["DEFAULT", "INVOICE", "SUBSCRIPTION"]);

export function lemonStatusToInternal(status: string | null | undefined) {
  const value = (status || "").toLowerCase();
  if (value === "active" || value === "on_trial" || value === "trialing") return "active";
  if (value === "past_due" || value === "unpaid") return "past_due";
  if (value === "cancelled" || value === "canceled") return "cancelled";
  if (value === "expired") return "expired";
  if (value === "paused") return "paused";
  return value || "inactive";
}

export async function resolveAccountIdFromLemonWebhook(payload: LemonWebhookPayload) {
  const accountId = extractAccountIdFromWebhook(payload);
  if (accountId) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { id: true, plan: true, planSource: true },
    });
    if (account) return account;
  }

  const invoiceId = extractInvoiceIdFromWebhook(payload);
  if (invoiceId) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        account: { select: { id: true, plan: true, planSource: true } },
      },
    });
    if (invoice?.account) return invoice.account;
  }

  const lemonSubscriptionId = extractLemonSubscriptionId(payload);
  if (lemonSubscriptionId) {
    const sub = await prisma.subscription.findFirst({
      where: {
        provider: LEMONSQUEEZY_PROVIDER,
        stripeSubscriptionId: lemonSubscriptionId,
      },
      select: {
        account: { select: { id: true, plan: true, planSource: true } },
      },
    });
    if (sub?.account) return sub.account;
  }

  const email = extractUserEmailFromWebhook(payload);
  if (email) {
    const account = await prisma.account.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, plan: true, planSource: true },
    });
    if (account) return account;
  }

  return null;
}

export async function upsertLemonSubscription(input: {
  accountId: string;
  lemonSubscriptionId?: string | null;
  status: string;
  planTier?: PlanTier;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
  unitAmountCents?: number;
}) {
  const planTier = input.planTier ?? "PRO";
  const existing = await prisma.subscription.findUnique({
    where: { accountId: input.accountId },
  });

  const data = {
    provider: LEMONSQUEEZY_PROVIDER,
    status: input.status,
    planTier,
    cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? false,
    currentPeriodEnd: input.currentPeriodEnd ?? undefined,
    unitAmountCents: input.unitAmountCents,
    ...(input.lemonSubscriptionId
      ? { stripeSubscriptionId: input.lemonSubscriptionId }
      : {}),
  };

  if (existing) {
    return prisma.subscription.update({
      where: { accountId: input.accountId },
      data: {
        ...data,
        unitAmountCents: input.unitAmountCents ?? existing.unitAmountCents,
        currentPeriodEnd:
          input.currentPeriodEnd === undefined
            ? existing.currentPeriodEnd
            : input.currentPeriodEnd,
      },
    });
  }

  return prisma.subscription.create({
    data: {
      accountId: input.accountId,
      ...data,
      unitAmountCents: input.unitAmountCents ?? 0,
      currentPeriodEnd: input.currentPeriodEnd ?? null,
    },
  });
}

export async function syncPaidLemonSubscription(input: {
  accountId: string;
  planTier: PlanTier;
  payload: LemonWebhookPayload;
}) {
  const lemonSubscriptionId = extractLemonSubscriptionId(input.payload);
  const periodEnd = extractLemonPeriodEnd(input.payload);
  const rawStatus = extractLemonSubscriptionStatus(input.payload);
  const status = lemonStatusToInternal(rawStatus || "active");

  await upsertLemonSubscription({
    accountId: input.accountId,
    lemonSubscriptionId,
    status: status === "inactive" ? "active" : status,
    planTier: input.planTier,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: false,
    unitAmountCents: input.payload.data?.attributes?.total ?? undefined,
  });

  await prisma.account.update({
    where: { id: input.accountId },
    data: {
      plan: input.planTier,
      planSource: "SUBSCRIPTION",
    },
  });
}

export async function markLemonSubscriptionCancelled(input: {
  accountId: string;
  payload: LemonWebhookPayload;
  planTier?: PlanTier;
}) {
  const lemonSubscriptionId = extractLemonSubscriptionId(input.payload);
  const periodEnd = extractLemonPeriodEnd(input.payload);

  await upsertLemonSubscription({
    accountId: input.accountId,
    lemonSubscriptionId,
    status: "cancelled",
    planTier: input.planTier,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: true,
  });

  // Grace period: keep paid plan until subscription_expired.
  return { planUnchanged: true as const };
}

export async function markLemonSubscriptionPastDue(input: {
  accountId: string;
  payload: LemonWebhookPayload;
  planTier?: PlanTier;
}) {
  const lemonSubscriptionId = extractLemonSubscriptionId(input.payload);
  const periodEnd = extractLemonPeriodEnd(input.payload);

  await upsertLemonSubscription({
    accountId: input.accountId,
    lemonSubscriptionId,
    status: "past_due",
    planTier: input.planTier,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: false,
  });

  // Dunning: keep paid plan until Lemon sends subscription_expired.
  return { planUnchanged: true as const };
}

export async function markLemonSubscriptionResumed(input: {
  accountId: string;
  payload: LemonWebhookPayload;
  planTier?: PlanTier;
}) {
  const lemonSubscriptionId = extractLemonSubscriptionId(input.payload);
  const periodEnd = extractLemonPeriodEnd(input.payload);
  const planTier = input.planTier ?? "PRO";

  await upsertLemonSubscription({
    accountId: input.accountId,
    lemonSubscriptionId,
    status: "active",
    planTier,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: false,
  });

  await prisma.account.update({
    where: { id: input.accountId },
    data: {
      plan: planTier,
      planSource: "SUBSCRIPTION",
    },
  });

  return { plan: planTier };
}

export async function downgradeAccountToFreeFromLemon(input: {
  accountId: string;
  planSource: string;
  payload: LemonWebhookPayload;
  planTier?: PlanTier;
}) {
  const lemonSubscriptionId = extractLemonSubscriptionId(input.payload);
  const periodEnd = extractLemonPeriodEnd(input.payload);

  await upsertLemonSubscription({
    accountId: input.accountId,
    lemonSubscriptionId,
    status: "expired",
    planTier: input.planTier ?? "PRO",
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: false,
  });

  if (!BILLING_MANAGED_SOURCES.has(input.planSource)) {
    return { skipped: "admin_plan" as const, plan: null };
  }

  await prisma.account.update({
    where: { id: input.accountId },
    data: {
      plan: "FREE",
      planSource: "SUBSCRIPTION",
    },
  });

  return { skipped: null, plan: "FREE" as const };
}

export async function syncLemonSubscriptionUpdated(input: {
  accountId: string;
  planSource: string;
  payload: LemonWebhookPayload;
  planTier?: PlanTier;
}) {
  const status = lemonStatusToInternal(extractLemonSubscriptionStatus(input.payload));
  if (status === "expired") {
    return downgradeAccountToFreeFromLemon(input);
  }
  if (status === "cancelled" || status === "canceled") {
    await markLemonSubscriptionCancelled(input);
    return { skipped: null, plan: null, cancelAtPeriodEnd: true as const };
  }
  if (status === "past_due" || status === "unpaid") {
    await markLemonSubscriptionPastDue(input);
    return { skipped: null, plan: null, pastDue: true as const };
  }
  if (status === "active" || status === "on_trial" || status === "trialing") {
    const lemonSubscriptionId = extractLemonSubscriptionId(input.payload);
    const periodEnd = extractLemonPeriodEnd(input.payload);
    await upsertLemonSubscription({
      accountId: input.accountId,
      lemonSubscriptionId,
      status: "active",
      planTier: input.planTier,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    });
    return { skipped: null, plan: null, active: true as const };
  }

  const lemonSubscriptionId = extractLemonSubscriptionId(input.payload);
  await upsertLemonSubscription({
    accountId: input.accountId,
    lemonSubscriptionId,
    status: status || "inactive",
    planTier: input.planTier,
    currentPeriodEnd: extractLemonPeriodEnd(input.payload),
  });
  return { skipped: null, plan: null };
}
