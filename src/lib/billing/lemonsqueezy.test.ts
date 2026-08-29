import assert from "node:assert/strict";
import test from "node:test";
import {
  extractAccountIdFromWebhook,
  extractInvoiceIdFromWebhook,
  extractLemonPeriodEnd,
  extractLemonSubscriptionId,
  extractPlanTierFromWebhook,
  extractUserEmailFromWebhook,
  isCancelLemonEvent,
  isExpireLemonEvent,
  isHandledLemonLifecycleEvent,
  isPaidLemonEvent,
  isPastDueLemonEvent,
  isResumeLemonEvent,
  isUpdateLemonEvent,
  type LemonWebhookPayload,
} from "./lemonsqueezy";
import { lemonStatusToInternal } from "./subscription-lifecycle";

test("paid lemon events include renewals and recovery", () => {
  assert.equal(isPaidLemonEvent("order_created"), true);
  assert.equal(isPaidLemonEvent("subscription_created"), true);
  assert.equal(isPaidLemonEvent("subscription_payment_success"), true);
  assert.equal(isPaidLemonEvent("subscription_payment_recovered"), true);
  assert.equal(isPaidLemonEvent("subscription_expired"), false);
});

test("lifecycle events are classified for cancel / expire / fail / resume", () => {
  assert.equal(isCancelLemonEvent("subscription_cancelled"), true);
  assert.equal(isExpireLemonEvent("subscription_expired"), true);
  assert.equal(isPastDueLemonEvent("subscription_payment_failed"), true);
  assert.equal(isResumeLemonEvent("subscription_resumed"), true);
  assert.equal(isUpdateLemonEvent("subscription_updated"), true);
  assert.equal(isHandledLemonLifecycleEvent("subscription_expired"), true);
  assert.equal(isHandledLemonLifecycleEvent("order_refunded"), false);
});

test("extractors read custom_data and subscription invoice payloads", () => {
  const paid: LemonWebhookPayload = {
    meta: {
      event_name: "subscription_payment_success",
      custom_data: {
        invoice_id: "inv_1",
        account_id: "acc_1",
        plan_tier: "PRO",
      },
    },
    data: {
      id: "99",
      type: "subscription-invoices",
      attributes: {
        status: "paid",
        subscription_id: 55,
        user_email: "User@Example.com",
        renews_at: "2026-09-29T00:00:00.000000Z",
      },
    },
  };

  assert.equal(extractInvoiceIdFromWebhook(paid), "inv_1");
  assert.equal(extractAccountIdFromWebhook(paid), "acc_1");
  assert.equal(extractPlanTierFromWebhook(paid), "PRO");
  assert.equal(extractUserEmailFromWebhook(paid), "user@example.com");
  assert.equal(extractLemonSubscriptionId(paid), "55");
  assert.ok(extractLemonPeriodEnd(paid)?.toISOString().startsWith("2026-09-29"));
});

test("subscription object uses data.id as lemon subscription id", () => {
  const cancelled: LemonWebhookPayload = {
    meta: { event_name: "subscription_cancelled" },
    data: {
      id: "77",
      type: "subscriptions",
      attributes: {
        status: "cancelled",
        ends_at: "2026-10-01T12:00:00.000000Z",
        user_email: "pro@briefly.local",
      },
    },
  };
  assert.equal(extractLemonSubscriptionId(cancelled), "77");
  assert.equal(lemonStatusToInternal("cancelled"), "cancelled");
  assert.equal(lemonStatusToInternal("past_due"), "past_due");
  assert.equal(lemonStatusToInternal("expired"), "expired");
});
