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
  const provider = BILLING_PROVIDER();
  if (provider === "manual" || !provider) return false;
  if (provider === "lemonsqueezy") {
    return Boolean(
      process.env.LEMONSQUEEZY_API_KEY?.trim() &&
        process.env.LEMONSQUEEZY_STORE_ID?.trim() &&
        process.env.LEMONSQUEEZY_VARIANT_ID?.trim(),
    );
  }
  // Stripe (or other) keys can be wired later; non-manual alone is not enough.
  if (provider === "stripe") {
    return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
  }
  return false;
}
