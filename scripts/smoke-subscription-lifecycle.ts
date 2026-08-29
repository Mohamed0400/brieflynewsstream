/**
 * End-to-end subscription lifecycle (no real Lemon wait):
 * Pro → cancel (still Pro) → payment_failed (still Pro) → expired (Free).
 *
 * Local DB (no deploy needed):
 *   dotenv -e .env.live -- tsx scripts/smoke-subscription-lifecycle.ts
 *
 * Against a running app (after deploy or local next):
 *   SMOKE_BASE_URL=https://www.brieflynewsstream.com dotenv -e .env.live -- tsx scripts/smoke-subscription-lifecycle.ts
 */
import { createHmac } from "node:crypto";
import {
  LEMONSQUEEZY_PROVIDER,
  type LemonWebhookPayload,
  webhookSecret,
} from "../src/lib/billing/lemonsqueezy";
import {
  downgradeAccountToFreeFromLemon,
  markLemonSubscriptionCancelled,
  markLemonSubscriptionPastDue,
} from "../src/lib/billing/subscription-lifecycle";
import { prisma } from "../src/lib/prisma";

const email = (
  process.env.CONSOLE_E2E_EMAIL || "console-e2e@briefly.local"
).trim().toLowerCase();

const baseUrl = (process.env.SMOKE_BASE_URL || "").replace(/\/$/, "");

function sign(body: string) {
  const secret = webhookSecret();
  if (!secret) throw new Error("LEMONSQUEEZY_WEBHOOK_SECRET missing");
  return createHmac("sha256", secret).update(body).digest("hex");
}

async function dispatch(
  payload: LemonWebhookPayload,
  local: () => Promise<Record<string, unknown>>,
) {
  if (!baseUrl) return { status: 200, json: await local() };

  const body = JSON.stringify(payload);
  const res = await fetch(`${baseUrl}/api/webhooks/billing/lemonsqueezy`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-signature": sign(body),
    },
    body,
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: res.status, json };
}

async function main() {
  const account = await prisma.account.findFirst({ where: { email } });
  if (!account) {
    throw new Error(`No account for ${email}`);
  }

  const lemonSubId = `smoke_sub_${Date.now()}`;
  const periodEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const previous = {
    plan: account.plan,
    planSource: account.planSource,
  };

  console.log("smoke_target", {
    email,
    accountId: account.id,
    mode: baseUrl ? `http:${baseUrl}` : "local_db",
  });

  await prisma.account.update({
    where: { id: account.id },
    data: { plan: "PRO", planSource: "SUBSCRIPTION" },
  });
  await prisma.subscription.upsert({
    where: { accountId: account.id },
    create: {
      accountId: account.id,
      provider: LEMONSQUEEZY_PROVIDER,
      stripeSubscriptionId: lemonSubId,
      status: "active",
      planTier: "PRO",
      unitAmountCents: 8000,
      currentPeriodEnd: new Date(periodEnd),
      cancelAtPeriodEnd: false,
    },
    update: {
      provider: LEMONSQUEEZY_PROVIDER,
      stripeSubscriptionId: lemonSubId,
      status: "active",
      planTier: "PRO",
      unitAmountCents: 8000,
      currentPeriodEnd: new Date(periodEnd),
      cancelAtPeriodEnd: false,
    },
  });

  const custom = {
    account_id: account.id,
    plan_tier: "PRO",
  };

  const cancelPayload: LemonWebhookPayload = {
    meta: { event_name: "subscription_cancelled", custom_data: custom },
    data: {
      id: lemonSubId,
      type: "subscriptions",
      attributes: {
        status: "cancelled",
        ends_at: periodEnd,
        user_email: email,
      },
    },
  };
  const cancelRes = await dispatch(cancelPayload, async () => {
    await markLemonSubscriptionCancelled({
      accountId: account.id,
      payload: cancelPayload,
      planTier: "PRO",
    });
    return { action: "cancelled_grace" };
  });
  console.log("cancel", cancelRes.status, cancelRes.json);
  if (cancelRes.status !== 200 || cancelRes.json.action !== "cancelled_grace") {
    throw new Error("cancel step failed");
  }

  let row = await prisma.account.findUnique({ where: { id: account.id } });
  let sub = await prisma.subscription.findUnique({ where: { accountId: account.id } });
  if (row?.plan !== "PRO") throw new Error("cancel must keep PRO during grace");
  if (!sub?.cancelAtPeriodEnd) throw new Error("cancelAtPeriodEnd should be true");
  console.log("after_cancel", { plan: row.plan, cancelAtPeriodEnd: sub.cancelAtPeriodEnd });

  const failPayload: LemonWebhookPayload = {
    meta: { event_name: "subscription_payment_failed", custom_data: custom },
    data: {
      id: `inv_${Date.now()}`,
      type: "subscription-invoices",
      attributes: {
        status: "past_due",
        subscription_id: lemonSubId,
        user_email: email,
      },
    },
  };
  const failRes = await dispatch(failPayload, async () => {
    await markLemonSubscriptionPastDue({
      accountId: account.id,
      payload: failPayload,
      planTier: "PRO",
    });
    return { action: "past_due" };
  });
  console.log("fail", failRes.status, failRes.json);
  if (failRes.status !== 200 || failRes.json.action !== "past_due") {
    throw new Error("payment_failed step failed");
  }
  row = await prisma.account.findUnique({ where: { id: account.id } });
  sub = await prisma.subscription.findUnique({ where: { accountId: account.id } });
  if (row?.plan !== "PRO") throw new Error("past_due must keep PRO during dunning");
  if (sub?.status !== "past_due") throw new Error("subscription status should be past_due");
  console.log("after_fail", { plan: row.plan, status: sub.status });

  const expirePayload: LemonWebhookPayload = {
    meta: { event_name: "subscription_expired", custom_data: custom },
    data: {
      id: lemonSubId,
      type: "subscriptions",
      attributes: {
        status: "expired",
        ends_at: periodEnd,
        user_email: email,
      },
    },
  };
  const expireRes = await dispatch(expirePayload, async () => {
    const result = await downgradeAccountToFreeFromLemon({
      accountId: account.id,
      planSource: "SUBSCRIPTION",
      payload: expirePayload,
      planTier: "PRO",
    });
    return {
      action: result.skipped ? "expire_skipped_admin" : "expired_downgrade",
      plan: result.plan,
    };
  });
  console.log("expire", expireRes.status, expireRes.json);
  if (expireRes.status !== 200 || expireRes.json.action !== "expired_downgrade") {
    throw new Error("expire step failed");
  }

  const afterExpire = await prisma.account.findUnique({ where: { id: account.id } });
  sub = await prisma.subscription.findUnique({ where: { accountId: account.id } });
  if (afterExpire?.plan !== "FREE") throw new Error("expired must set FREE");
  if (sub?.status !== "expired") throw new Error("subscription status should be expired");
  console.log("after_expire", { plan: afterExpire.plan, status: sub.status });

  await prisma.account.update({
    where: { id: account.id },
    data: {
      plan: previous.plan,
      planSource: previous.planSource,
    },
  });
  console.log("restored_account", previous);
  console.log("subscription_lifecycle_smoke_passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
