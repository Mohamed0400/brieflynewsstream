import assert from "node:assert/strict";
import test from "node:test";
import { buildReceiptPdf, EXAMPLE_RECEIPT } from "./receipt-pdf";
import {
  applyInvoiceAction,
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

test("receipt PDF is a valid paid receipt", () => {
  assert.equal(formatUsd(7000), "$70.00");
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
