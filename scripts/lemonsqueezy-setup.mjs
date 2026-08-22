/**
 * Discovers Lemon Squeezy store + variant IDs and writes them into .env.
 * Reads LEMONSQUEEZY_API_KEY from .env — never pass the key on the CLI.
 *
 * Usage: node scripts/lemonsqueezy-setup.mjs
 */
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  lemonSqueezySetup,
  listProducts,
  listStores,
  listVariants,
} from "@lemonsqueezy/lemonsqueezy.js";

const envPath = resolve(process.cwd(), ".env");

function readEnv() {
  return readFileSync(envPath, "utf8");
}

function getEnv(text, name) {
  const match = text.match(new RegExp(`^${name}=(?:"([^"]*)"|'([^']*)'|([^\\n#]*))`, "m"));
  if (!match) return "";
  return (match[1] ?? match[2] ?? match[3] ?? "").trim();
}

function setEnv(text, name, value) {
  const line = `${name}="${value}"`;
  const re = new RegExp(`^${name}=.*$`, "m");
  if (re.test(text)) return text.replace(re, line);
  return `${text.trimEnd()}\n${line}\n`;
}

let envText = readEnv();
const apiKey = getEnv(envText, "LEMONSQUEEZY_API_KEY");
if (!apiKey) {
  console.error("Missing LEMONSQUEEZY_API_KEY in .env");
  process.exit(1);
}

lemonSqueezySetup({ apiKey });

const stores = await listStores();
if (stores.error || !stores.data?.data?.length) {
  console.error("No Lemon Squeezy stores found. Create a store in the dashboard first.");
  console.error(stores.error?.message || "");
  process.exit(1);
}

const store = stores.data.data[0];
const storeId = String(store.id);
console.log("store_id", storeId);
console.log("store_name", store.attributes.name);

const products = await listProducts({ filter: { storeId } });
if (products.error) {
  console.error(products.error.message);
  process.exit(1);
}

const productList = products.data?.data || [];
console.log("products", productList.length);
for (const product of productList) {
  console.log("-", product.id, product.attributes.name, product.attributes.status);
}

if (!productList.length) {
  console.error("");
  console.error("No products found.");
  console.error("Create a Pro product in Lemon Squeezy:");
  console.error("  Name: Briefly NewsStream Pro");
  console.error("  Price: $70 / month (subscription)");
  console.error("Then re-run: node scripts/lemonsqueezy-setup.mjs");
  envText = setEnv(envText, "LEMONSQUEEZY_STORE_ID", storeId);
  envText = setEnv(envText, "BILLING_PROVIDER", "lemonsqueezy");
  writeFileSync(envPath, envText);
  process.exit(2);
}

const product =
  productList.find((row) => (row.attributes.name || "").toLowerCase().includes("pro")) ||
  productList[0];

const variants = await listVariants({ filter: { productId: product.id } });
if (variants.error) {
  console.error(variants.error.message);
  process.exit(1);
}

const variantList = variants.data?.data || [];
if (!variantList.length) {
  console.error("No variants on product", product.id);
  process.exit(2);
}

const preferred =
  variantList.find((row) => {
    const name = (row.attributes.name || "").toLowerCase();
    return name.includes("pro") || row.attributes.price === 7000;
  }) || variantList[0];

const variantId = String(preferred.id);
console.log("variant_id", variantId);
console.log("variant_name", preferred.attributes.name);
console.log("variant_price_cents", preferred.attributes.price);

envText = setEnv(envText, "LEMONSQUEEZY_STORE_ID", storeId);
envText = setEnv(envText, "LEMONSQUEEZY_VARIANT_ID", variantId);
envText = setEnv(envText, "BILLING_PROVIDER", "lemonsqueezy");

if (!getEnv(envText, "LEMONSQUEEZY_WEBHOOK_SECRET")) {
  const secret = `lswhsec_${randomBytes(24).toString("base64url")}`;
  envText = setEnv(envText, "LEMONSQUEEZY_WEBHOOK_SECRET", secret);
  console.log("webhook_secret_generated true");
} else {
  console.log("webhook_secret_generated false");
}

writeFileSync(envPath, envText);

console.log("ok wrote store/variant IDs to .env");
console.log("");
console.log("Add this webhook in Lemon Squeezy → Settings → Webhooks:");
console.log("  URL: https://www.brieflynewsstream.com/api/webhooks/billing/lemonsqueezy");
console.log("  Local: http://localhost:3000/api/webhooks/billing/lemonsqueezy");
console.log("  Events: order_created, subscription_created, subscription_payment_success");
console.log("  Signing secret: LEMONSQUEEZY_WEBHOOK_SECRET from .env");
