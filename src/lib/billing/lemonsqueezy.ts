import { createHmac, timingSafeEqual } from "node:crypto";
import type { PlanTier } from "@prisma/client";
import {
  createCheckout,
  lemonSqueezySetup,
  listProducts,
  listStores,
  listVariants,
} from "@lemonsqueezy/lemonsqueezy.js";
import { PLAN_DEFINITIONS, planPriceCents } from "@/lib/plans";
import { publicSiteUrl } from "@/lib/site-url";

export const LEMONSQUEEZY_PROVIDER = "lemonsqueezy";

let setupDone = false;

function apiKey() {
  return (process.env.LEMONSQUEEZY_API_KEY || "").trim();
}

function storeIdEnv() {
  return (process.env.LEMONSQUEEZY_STORE_ID || "").trim();
}

function proVariantIdEnv() {
  return (process.env.LEMONSQUEEZY_VARIANT_ID || process.env.LEMONSQUEEZY_PRO_VARIANT_ID || "").trim();
}

function enterpriseVariantIdEnv() {
  return (process.env.LEMONSQUEEZY_ENTERPRISE_VARIANT_ID || "").trim();
}

function variantIdEnv(planTier: PlanTier = "PRO") {
  return planTier === "ENTERPRISE" ? enterpriseVariantIdEnv() : proVariantIdEnv();
}

export function webhookSecret() {
  return (process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "").trim();
}

export function lemonSqueezyConfigured() {
  return Boolean(apiKey() && storeIdEnv() && proVariantIdEnv());
}

export function ensureLemonSqueezy() {
  const key = apiKey();
  if (!key) {
    throw new Error("lemonsqueezy_api_key_missing");
  }
  if (!setupDone) {
    lemonSqueezySetup({ apiKey: key });
    setupDone = true;
  }
}

function variantMatchesPlan(
  variant: { attributes: { name?: string | null; price?: number | null } },
  planTier: PlanTier,
) {
  const name = (variant.attributes.name || "").toLowerCase();
  const price = variant.attributes.price ?? 0;
  const expectedCents = planPriceCents(planTier);
  if (expectedCents > 0 && price === expectedCents) return true;
  if (planTier === "ENTERPRISE") return name.includes("enterprise");
  return name.includes("pro") && !name.includes("enterprise");
}

async function discoverVariantId(storeId: string, planTier: PlanTier) {
  const products = await listProducts({ filter: { storeId } });
  if (products.error || !products.data?.data?.length) {
    throw new Error("lemonsqueezy_product_missing");
  }
  const ranked = [...products.data.data].sort((left, right) => {
    const leftName = (left.attributes.name || "").toLowerCase();
    const rightName = (right.attributes.name || "").toLowerCase();
    const hint = planTier === "ENTERPRISE" ? "enterprise" : "pro";
    return Number(rightName.includes(hint)) - Number(leftName.includes(hint));
  });
  for (const product of ranked) {
    const variants = await listVariants({ filter: { productId: product.id } });
    if (variants.error || !variants.data?.data?.length) continue;
    const preferred = variants.data.data.find((row) => variantMatchesPlan(row, planTier));
    if (preferred) return String(preferred.id);
  }
  throw new Error(planTier === "ENTERPRISE" ? "lemonsqueezy_enterprise_variant_missing" : "lemonsqueezy_variant_missing");
}

export async function resolveLemonSqueezyIds(planTier: PlanTier = "PRO") {
  ensureLemonSqueezy();
  let storeId = storeIdEnv();
  let variantId = variantIdEnv(planTier);

  if (!storeId) {
    const stores = await listStores();
    if (stores.error || !stores.data?.data?.length) {
      throw new Error("lemonsqueezy_store_missing");
    }
    storeId = String(stores.data.data[0].id);
  }

  if (!variantId) {
    variantId = await discoverVariantId(storeId, planTier);
  }

  return { storeId, variantId };
}

function checkoutCopy(planTier: PlanTier) {
  const plan = PLAN_DEFINITIONS[planTier];
  const price = plan.listPriceMonthlyUsd ?? 0;
  if (planTier === "ENTERPRISE") {
    return {
      name: "Briefly NewsStream Enterprise",
      description: `Enterprise plan — ${plan.dailyRequests.toLocaleString("en-US")} API requests/day, ${plan.maxKeys} keys, published SLA, billed at $${price}/month.`,
    };
  }
  return {
    name: "Briefly NewsStream Pro",
    description: `Pro plan — ${plan.dailyRequests.toLocaleString("en-US")} API requests/day, commercial use, billed at $${price}/month.`,
  };
}

export async function createPlanCheckout(input: {
  invoiceId: string;
  accountId: string;
  email?: string | null;
  invoiceNumber: string;
  planTier: PlanTier;
}) {
  if (input.planTier !== "PRO" && input.planTier !== "ENTERPRISE") {
    throw new Error("lemonsqueezy_unsupported_plan");
  }
  ensureLemonSqueezy();
  const { storeId, variantId } = await resolveLemonSqueezyIds(input.planTier);
  const site = publicSiteUrl();
  const redirectUrl = `${site}/console/billing/success?invoice=${encodeURIComponent(input.invoiceId)}`;
  const copy = checkoutCopy(input.planTier);

  const result = await createCheckout(storeId, variantId, {
    productOptions: {
      name: copy.name,
      description: copy.description,
      redirectUrl,
      receiptButtonText: "Open console",
      receiptLinkUrl: `${site}/console/overview`,
      enabledVariants: [Number(variantId)],
    },
    checkoutData: {
      email: input.email || undefined,
      custom: {
        invoice_id: input.invoiceId,
        account_id: input.accountId,
        invoice_number: input.invoiceNumber,
        plan_tier: input.planTier,
      },
    },
    checkoutOptions: {
      embed: false,
      media: false,
      logo: true,
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error(result.error?.message || "lemonsqueezy_checkout_failed");
  }

  const checkoutId = String(result.data.data.id);
  const url = result.data.data.attributes.url;
  if (!url) {
    throw new Error("lemonsqueezy_checkout_url_missing");
  }

  return { checkoutId, url, storeId, variantId };
}

export async function createProCheckout(input: {
  invoiceId: string;
  accountId: string;
  email?: string | null;
  invoiceNumber: string;
}) {
  return createPlanCheckout({ ...input, planTier: "PRO" });
}

export function verifyLemonSqueezySignature(rawBody: string, signature: string | null) {
  const secret = webhookSecret();
  if (!secret || !signature) return false;
  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    const a = Buffer.from(digest, "utf8");
    const b = Buffer.from(signature, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export type LemonWebhookPayload = {
  meta?: {
    event_name?: string;
    custom_data?: Record<string, string | number | boolean | null | undefined>;
  };
  data?: {
    id?: string | number;
    type?: string;
    attributes?: {
      status?: string;
      total?: number;
      identifier?: string;
      user_email?: string;
      customer_id?: number | string;
      subscription_id?: number | string;
      renews_at?: string | null;
      ends_at?: string | null;
      created_at?: string | null;
      updated_at?: string | null;
    };
  };
};

export function extractInvoiceIdFromWebhook(payload: LemonWebhookPayload) {
  const custom = payload.meta?.custom_data || {};
  const raw = custom.invoice_id ?? custom.invoiceId;
  return raw == null ? null : String(raw);
}

export function extractAccountIdFromWebhook(payload: LemonWebhookPayload) {
  const custom = payload.meta?.custom_data || {};
  const raw = custom.account_id ?? custom.accountId;
  return raw == null ? null : String(raw);
}

export function extractPlanTierFromWebhook(payload: LemonWebhookPayload): PlanTier | null {
  const custom = payload.meta?.custom_data || {};
  const raw = custom.plan_tier ?? custom.planTier;
  if (raw == null) return null;
  const value = String(raw).toUpperCase();
  if (value === "PRO" || value === "ENTERPRISE" || value === "FREE") {
    return value;
  }
  return null;
}

export function extractUserEmailFromWebhook(payload: LemonWebhookPayload) {
  const email = payload.data?.attributes?.user_email;
  if (!email) return null;
  return String(email).trim().toLowerCase() || null;
}

export function extractLemonSubscriptionId(payload: LemonWebhookPayload) {
  const type = payload.data?.type;
  const attrs = payload.data?.attributes;
  if (type === "subscription-invoices" || type === "subscription_invoices") {
    if (attrs?.subscription_id != null) return String(attrs.subscription_id);
  }
  if (type === "subscriptions" && payload.data?.id != null) {
    return String(payload.data.id);
  }
  if (attrs?.subscription_id != null) return String(attrs.subscription_id);
  if (type !== "orders" && payload.data?.id != null) {
    return String(payload.data.id);
  }
  return null;
}

export function extractLemonSubscriptionStatus(payload: LemonWebhookPayload) {
  return payload.data?.attributes?.status ?? null;
}

export function extractLemonPeriodEnd(payload: LemonWebhookPayload) {
  const attrs = payload.data?.attributes;
  const raw = attrs?.ends_at || attrs?.renews_at;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isPaidLemonEvent(eventName: string | undefined) {
  if (!eventName) return false;
  return (
    eventName === "order_created" ||
    eventName === "subscription_payment_success" ||
    eventName === "subscription_created" ||
    eventName === "subscription_payment_recovered"
  );
}

/** Soft cancel: keep Pro until period ends (subscription_expired). */
export function isCancelLemonEvent(eventName: string | undefined) {
  return eventName === "subscription_cancelled";
}

/** Hard end: downgrade to Free. */
export function isExpireLemonEvent(eventName: string | undefined) {
  return eventName === "subscription_expired";
}

/** Failed renew during dunning: keep Pro until expired. */
export function isPastDueLemonEvent(eventName: string | undefined) {
  return eventName === "subscription_payment_failed";
}

export function isResumeLemonEvent(eventName: string | undefined) {
  return eventName === "subscription_resumed";
}

/** Catch-all status sync from Lemon. */
export function isUpdateLemonEvent(eventName: string | undefined) {
  return eventName === "subscription_updated";
}

export function isHandledLemonLifecycleEvent(eventName: string | undefined) {
  return (
    isPaidLemonEvent(eventName) ||
    isCancelLemonEvent(eventName) ||
    isExpireLemonEvent(eventName) ||
    isPastDueLemonEvent(eventName) ||
    isResumeLemonEvent(eventName) ||
    isUpdateLemonEvent(eventName)
  );
}
