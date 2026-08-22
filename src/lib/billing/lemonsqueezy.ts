import { createHmac, timingSafeEqual } from "node:crypto";
import {
  createCheckout,
  lemonSqueezySetup,
  listProducts,
  listStores,
  listVariants,
} from "@lemonsqueezy/lemonsqueezy.js";
import { publicSiteUrl } from "@/lib/site-url";

export const LEMONSQUEEZY_PROVIDER = "lemonsqueezy";

let setupDone = false;

function apiKey() {
  return (process.env.LEMONSQUEEZY_API_KEY || "").trim();
}

function storeIdEnv() {
  return (process.env.LEMONSQUEEZY_STORE_ID || "").trim();
}

function variantIdEnv() {
  return (process.env.LEMONSQUEEZY_VARIANT_ID || "").trim();
}

export function webhookSecret() {
  return (process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "").trim();
}

export function lemonSqueezyConfigured() {
  return Boolean(apiKey() && storeIdEnv() && variantIdEnv());
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

export async function resolveLemonSqueezyIds() {
  ensureLemonSqueezy();
  let storeId = storeIdEnv();
  let variantId = variantIdEnv();

  if (!storeId) {
    const stores = await listStores();
    if (stores.error || !stores.data?.data?.length) {
      throw new Error("lemonsqueezy_store_missing");
    }
    storeId = String(stores.data.data[0].id);
  }

  if (!variantId) {
    const products = await listProducts({ filter: { storeId } });
    if (products.error || !products.data?.data?.length) {
      throw new Error("lemonsqueezy_product_missing");
    }
    const product =
      products.data.data.find((row) =>
        (row.attributes.name || "").toLowerCase().includes("pro"),
      ) ?? products.data.data[0];

    const variants = await listVariants({
      filter: { productId: product.id },
    });
    if (variants.error || !variants.data?.data?.length) {
      throw new Error("lemonsqueezy_variant_missing");
    }
    const preferred =
      variants.data.data.find((row) => {
        const name = (row.attributes.name || "").toLowerCase();
        return name.includes("pro") || row.attributes.price === 7000;
      }) ?? variants.data.data[0];
    variantId = String(preferred.id);
  }

  return { storeId, variantId };
}

export async function createProCheckout(input: {
  invoiceId: string;
  accountId: string;
  email?: string | null;
  invoiceNumber: string;
}) {
  ensureLemonSqueezy();
  const { storeId, variantId } = await resolveLemonSqueezyIds();
  const site = publicSiteUrl();
  const redirectUrl = `${site}/console/billing/success?invoice=${encodeURIComponent(input.invoiceId)}`;

  const result = await createCheckout(storeId, variantId, {
    productOptions: {
      name: "Briefly NewsStream Pro",
      description: "Pro plan — 500 API requests/day, commercial use, billed monthly.",
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
