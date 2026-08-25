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
    id?: string;
    type?: string;
    attributes?: {
      status?: string;
      total?: number;
      identifier?: string;
    };
  };
};

export function extractInvoiceIdFromWebhook(payload: LemonWebhookPayload) {
  const custom = payload.meta?.custom_data || {};
  const raw = custom.invoice_id ?? custom.invoiceId;
  return raw == null ? null : String(raw);
}

export function isPaidLemonEvent(eventName: string | undefined) {
  if (!eventName) return false;
  return (
    eventName === "order_created" ||
    eventName === "subscription_payment_success" ||
    eventName === "subscription_created"
  );
}
