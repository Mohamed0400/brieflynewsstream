import assert from "node:assert/strict";
import test from "node:test";
import { buildReceiptPdf, EXAMPLE_RECEIPT } from "./receipt-pdf";
import {
  applyInvoiceAction,
  billingProviderReady,
  canDownloadReceipt,
  canPayInvoice,
  canVoidInvoice,
  formatUsd,
} from "./types";

test("invoice states: open can be paid or voided", () => {
  assert.equal(canPayInvoice("OPEN"), true);
  assert.equal(canVoidInvoice("OPEN"), true);
  assert.equal(applyInvoiceAction("OPEN", "pay"), "PAID");
  assert.equal(applyInvoiceAction("OPEN", "void"), "VOID");
});

test("invoice states: paid and void are terminal", () => {
  assert.equal(canPayInvoice("PAID"), false);
  assert.equal(canVoidInvoice("PAID"), false);
  assert.equal(canPayInvoice("VOID"), false);
  assert.equal(canVoidInvoice("VOID"), false);
  assert.throws(() => applyInvoiceAction("PAID", "pay"));
  assert.throws(() => applyInvoiceAction("VOID", "void"));
});

test("receipts are available only after payment", () => {
  assert.equal(canDownloadReceipt("PAID"), true);
  assert.equal(canDownloadReceipt("OPEN"), false);
  assert.equal(canDownloadReceipt("VOID"), false);
});

test("customer self-pay is off while billing stays manual", () => {
  const previous = process.env.BILLING_PROVIDER;
  const prevKey = process.env.STRIPE_SECRET_KEY;
  process.env.BILLING_PROVIDER = "manual";
  assert.equal(billingProviderReady(), false);
  process.env.BILLING_PROVIDER = "stripe";
  delete process.env.STRIPE_SECRET_KEY;
  assert.equal(billingProviderReady(), false);
  process.env.STRIPE_SECRET_KEY = "sk_test_placeholder";
  assert.equal(billingProviderReady(), true);
  process.env.BILLING_PROVIDER = "lemonsqueezy";
  delete process.env.LEMONSQUEEZY_API_KEY;
  delete process.env.LEMONSQUEEZY_STORE_ID;
  delete process.env.LEMONSQUEEZY_VARIANT_ID;
  assert.equal(billingProviderReady(), false);
  if (previous === undefined) delete process.env.BILLING_PROVIDER;
  else process.env.BILLING_PROVIDER = previous;
  if (prevKey === undefined) delete process.env.STRIPE_SECRET_KEY;
  else process.env.STRIPE_SECRET_KEY = prevKey;
});

test("receipt PDF is a valid paid receipt", () => {
  assert.equal(formatUsd(7000), "$70.00");
  assert.equal(formatUsd(15000), "$150.00");
  const pdf = buildReceiptPdf(EXAMPLE_RECEIPT);
  const text = pdf.toString("latin1");
  assert.ok(text.startsWith("%PDF-1.4"));
  assert.ok(text.includes("INV-2026-00001"));
  assert.ok(text.includes("PAID"));
  assert.ok(text.includes("PAYMENT RECEIPT"));
  assert.equal(text.includes("SAMPLE"), false);
  assert.ok(text.includes("/Im1"));
  assert.ok(text.includes("/DCTDecode"));
  assert.ok(text.includes("/URI"));
  assert.ok(text.includes("https://www.brieflynewsstream.com"));
  assert.ok(text.includes("https://www.brieflynewsstream.com/console"));
  assert.ok(text.includes("Open the platform"));
  assert.ok(text.includes("Bilingual market-news API"));
  assert.equal(text.includes("Bill to"), false);
  assert.equal(text.includes("hello@brieflynewsstream.com"), false);
  assert.equal(text.includes("billing@brieflynewsstream.com"), false);
  assert.doesNotMatch(text, /hello@/);
});
