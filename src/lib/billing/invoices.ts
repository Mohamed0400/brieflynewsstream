import type { InvoiceStatus, PlanTier } from "@prisma/client";
import {
  applyInvoiceAction,
  type InvoiceAction,
  type InvoiceLineItem,
} from "@/lib/billing/types";
import { PLAN_DEFINITIONS } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

function padInvoiceCount(count: number) {
  return String(count + 1).padStart(5, "0");
}

export async function nextInvoiceNumber(prefix: "INV" | "EX") {
  const year = new Date().getUTCFullYear();
  const startsWith = `${prefix}-${year}-`;
  const count = await prisma.invoice.count({
    where: { number: { startsWith } },
  });
  return `${startsWith}${padInvoiceCount(count)}`;
}

function proLineItem(): InvoiceLineItem {
  const unitCents = (PLAN_DEFINITIONS.PRO.listPriceMonthlyUsd ?? 70) * 100;
  return {
    description: "Pro plan, monthly",
    planTier: "PRO",
    quantity: 1,
    unitCents,
  };
}

export async function listAccountInvoices(accountId: string) {
  return prisma.invoice.findMany({
    where: { accountId, example: false },
    include: { payments: { orderBy: { createdAt: "desc" } } },
    orderBy: { issuedAt: "desc" },
  });
}

export async function getAccountInvoice(accountId: string, invoiceId: string) {
  return prisma.invoice.findFirst({
    where: { id: invoiceId, accountId },
    include: { payments: { orderBy: { createdAt: "desc" } } },
  });
}

export async function createPlanInvoice(input: {
  accountId: string;
  planTier: PlanTier;
  description: string;
  example?: boolean;
  status?: InvoiceStatus;
  periodStart?: Date;
  periodEnd?: Date;
  issuedAt?: Date;
  dueAt?: Date;
  paidAt?: Date;
  voidedAt?: Date;
  voidReason?: string;
}) {
  if (input.planTier === "FREE") {
    throw new Error("free_plan_has_no_invoice");
  }
  const item =
    input.planTier === "PRO"
      ? proLineItem()
      : {
          description: "Enterprise plan",
          planTier: "ENTERPRISE" as const,
          quantity: 1,
          unitCents: 0,
        };
  const totalCents = item.unitCents * item.quantity;
  const status = input.status ?? "OPEN";
  const number = await nextInvoiceNumber(input.example ? "EX" : "INV");

  return prisma.invoice.create({
    data: {
      accountId: input.accountId,
      number,
      status,
      planTier: input.planTier,
      description: input.description,
      subtotalCents: totalCents,
      totalCents,
      amountPaidCents: status === "PAID" ? totalCents : 0,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      issuedAt: input.issuedAt ?? new Date(),
      dueAt: input.dueAt,
      paidAt: input.paidAt,
      voidedAt: input.voidedAt,
      voidReason: input.voidReason,
      provider: input.example ? "example" : "manual",
      example: Boolean(input.example),
      lineItems: [item],
      payments:
        status === "PAID"
          ? {
              create: {
                status: "SUCCEEDED",
                amountCents: totalCents,
                method: input.example ? "example" : "manual",
                provider: input.example ? "example" : "manual",
                paidAt: input.paidAt ?? new Date(),
              },
            }
          : undefined,
    },
    include: { payments: true },
  });
}

export async function requestProInvoice(accountId: string) {
  const existing = await prisma.invoice.findFirst({
    where: {
      accountId,
      example: false,
      status: "OPEN",
      planTier: "PRO",
    },
    include: { payments: { orderBy: { createdAt: "desc" } } },
  });
  if (existing) return existing;

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1);
  return createPlanInvoice({
    accountId,
    planTier: "PRO",
    description: "Pro plan, monthly",
    periodStart: now,
    periodEnd,
    dueAt: periodEnd,
  });
}

export async function applyInvoiceAdminAction(input: {
  invoiceId: string;
  action: InvoiceAction;
  actorId: string;
  method?: string;
  voidReason?: string;
}) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: input.invoiceId },
  });
  if (!invoice) return null;

  const nextStatus = applyInvoiceAction(invoice.status, input.action);
  const now = new Date();

  const updated =
    nextStatus === "PAID"
      ? await markInvoicePaid({
          id: invoice.id,
          accountId: invoice.accountId,
          planTier: invoice.planTier,
          totalCents: invoice.totalCents,
          method: input.method ?? "manual",
        })
      : await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            status: "VOID",
            voidedAt: now,
            voidReason: input.voidReason ?? "Voided by admin",
          },
          include: { payments: true },
        });

  await prisma.adminAuditLog.create({
    data: {
      actorId: input.actorId,
      action: nextStatus === "PAID" ? "invoice.paid" : "invoice.voided",
      targetType: "invoice",
      targetId: invoice.id,
      metadata: {
        accountId: invoice.accountId,
        number: invoice.number,
      },
    },
  });

  return updated;
}

export async function markInvoicePaid(input: {
  id: string;
  accountId: string;
  planTier: PlanTier;
  totalCents: number;
  method?: string;
}) {
  const now = new Date();
  const updated = await prisma.invoice.update({
    where: { id: input.id },
    data: {
      status: "PAID",
      paidAt: now,
      amountPaidCents: input.totalCents,
      payments: {
        create: {
          status: "SUCCEEDED",
          amountCents: input.totalCents,
          method: input.method ?? "manual",
          provider: "manual",
          paidAt: now,
        },
      },
    },
    include: { payments: { orderBy: { createdAt: "desc" } } },
  });

  await prisma.account.update({
    where: { id: input.accountId },
    data: {
      plan: input.planTier,
      planSource: "INVOICE",
    },
  });

  return updated;
}

export async function payCustomerInvoice(accountId: string, invoiceId: string) {
  const invoice = await getAccountInvoice(accountId, invoiceId);
  if (!invoice) return { error: "not_found" as const };
  if (invoice.example) return { error: "not_found" as const };
  if (invoice.status === "PAID") return { invoice };
  if (invoice.status !== "OPEN") return { error: "not_open" as const };

  const paid = await markInvoicePaid({
    id: invoice.id,
    accountId: invoice.accountId,
    planTier: invoice.planTier,
    totalCents: invoice.totalCents,
    method: "console",
  });
  return { invoice: paid };
}

export function serializeInvoice(invoice: {
  id: string;
  number: string;
  status: "OPEN" | "PAID" | "VOID";
  currency: string;
  planTier: string;
  description: string;
  totalCents: number;
  amountPaidCents: number;
  issuedAt: Date;
  dueAt: Date | null;
  paidAt: Date | null;
  voidedAt: Date | null;
  example: boolean;
}) {
  return {
    id: invoice.id,
    number: invoice.number,
    status: invoice.status,
    currency: invoice.currency,
    planTier: invoice.planTier,
    description: invoice.description,
    totalCents: invoice.totalCents,
    amountPaidCents: invoice.amountPaidCents,
    issuedAt: invoice.issuedAt.toISOString(),
    dueAt: invoice.dueAt?.toISOString() ?? null,
    paidAt: invoice.paidAt?.toISOString() ?? null,
    voidedAt: invoice.voidedAt?.toISOString() ?? null,
    example: invoice.example,
    receiptAvailable: invoice.status === "PAID",
  };
}
