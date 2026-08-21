import type { InvoiceStatus, PlanTier } from "@prisma/client";

export const BILLING_PROVIDER = () =>
  (process.env.BILLING_PROVIDER || "manual").trim().toLowerCase();

export const BILLING_CURRENCY = "usd";
export const BILLING_CONTACT = "hello@brieflynewsstream.com";

export type InvoiceAction = "pay" | "void";

export type InvoiceLineItem = {
  description: string;
  planTier: PlanTier;
  quantity: number;
  unitCents: number;
};

export type BillingEvent =
  | { type: "invoice.paid"; invoiceId: string; accountId: string }
  | { type: "invoice.voided"; invoiceId: string; accountId: string }
  | { type: "invoice.opened"; invoiceId: string; accountId: string };

export function canDownloadReceipt(status: InvoiceStatus) {
  return status === "PAID";
}

export function canPayInvoice(status: InvoiceStatus) {
  return status === "OPEN";
}

export function canVoidInvoice(status: InvoiceStatus) {
  return status === "OPEN";
}

export function applyInvoiceAction(
  status: InvoiceStatus,
  action: InvoiceAction,
): InvoiceStatus {
  if (action === "pay") {
    if (!canPayInvoice(status)) {
      throw new Error("invoice_not_open");
    }
    return "PAID";
  }
  if (!canVoidInvoice(status)) {
    throw new Error("invoice_not_open");
  }
  return "VOID";
}

export function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function billingProviderReady() {
  return BILLING_PROVIDER() !== "manual";
}
