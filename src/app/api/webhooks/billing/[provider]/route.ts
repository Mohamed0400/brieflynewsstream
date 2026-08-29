import { NextResponse } from "next/server";
import { markInvoicePaidFromProvider } from "@/lib/billing/invoices";
import {
  extractInvoiceIdFromWebhook,
  extractPlanTierFromWebhook,
  isCancelLemonEvent,
  isExpireLemonEvent,
  isHandledLemonLifecycleEvent,
  isPaidLemonEvent,
  isPastDueLemonEvent,
  isResumeLemonEvent,
  isUpdateLemonEvent,
  LEMONSQUEEZY_PROVIDER,
  type LemonWebhookPayload,
  verifyLemonSqueezySignature,
} from "@/lib/billing/lemonsqueezy";
import {
  downgradeAccountToFreeFromLemon,
  markLemonSubscriptionCancelled,
  markLemonSubscriptionPastDue,
  markLemonSubscriptionResumed,
  resolveAccountIdFromLemonWebhook,
  syncLemonSubscriptionUpdated,
  syncPaidLemonSubscription,
} from "@/lib/billing/subscription-lifecycle";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider } = await context.params;
  if (provider !== "lemonsqueezy" && provider !== LEMONSQUEEZY_PROVIDER) {
    return NextResponse.json(
      {
        error: "not_configured",
        message: `No webhook handler for provider "${provider}".`,
      },
      { status: 501 },
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");
  if (!verifyLemonSqueezySignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let payload: LemonWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as LemonWebhookPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const eventName = payload.meta?.event_name;
  if (!isHandledLemonLifecycleEvent(eventName)) {
    return NextResponse.json({ ok: true, ignored: eventName ?? "unknown" });
  }

  if (isPaidLemonEvent(eventName)) {
    const invoiceId = extractInvoiceIdFromWebhook(payload);
    let invoicePlanTier = extractPlanTierFromWebhook(payload);

    if (invoiceId) {
      const providerRef =
        payload.data?.id != null
          ? `ls_${payload.data.type || "event"}_${payload.data.id}`
          : undefined;

      const result = await markInvoicePaidFromProvider({
        invoiceId,
        provider: LEMONSQUEEZY_PROVIDER,
        providerRef,
        method: "lemonsqueezy",
      });

      if ("error" in result) {
        if (result.error === "not_found") {
          return NextResponse.json({ error: "invoice_not_found" }, { status: 404 });
        }
        if (result.error !== "not_open") {
          return NextResponse.json({ error: result.error }, { status: 409 });
        }
        // Already paid / not open: still sync subscription on renewals.
      } else if (result.invoice?.planTier) {
        invoicePlanTier = result.invoice.planTier;
      }
    }

    const account = await resolveAccountIdFromLemonWebhook(payload);
    if (!account) {
      return NextResponse.json(
        {
          error: "account_not_found",
          message: "Could not resolve account from invoice_id, account_id, subscription, or email",
        },
        { status: 422 },
      );
    }

    const tier =
      invoicePlanTier
      ?? (account.plan === "ENTERPRISE" ? "ENTERPRISE" : "PRO");
    const paidTier = tier === "FREE" ? "PRO" : tier;
    await syncPaidLemonSubscription({
      accountId: account.id,
      planTier: paidTier,
      payload,
    });

    return NextResponse.json({
      ok: true,
      action: "paid",
      event: eventName,
      accountId: account.id,
      plan: paidTier,
      invoiceId: invoiceId ?? null,
    });
  }

  const account = await resolveAccountIdFromLemonWebhook(payload);
  if (!account) {
    return NextResponse.json(
      {
        error: "account_not_found",
        message: "Could not resolve account from account_id, invoice_id, subscription, or email",
      },
      { status: 422 },
    );
  }

  const planTier = extractPlanTierFromWebhook(payload)
    ?? (account.plan === "FREE" ? "PRO" : account.plan);

  if (isCancelLemonEvent(eventName)) {
    await markLemonSubscriptionCancelled({
      accountId: account.id,
      payload,
      planTier,
    });
    return NextResponse.json({
      ok: true,
      action: "cancelled_grace",
      event: eventName,
      accountId: account.id,
      plan: account.plan,
      cancelAtPeriodEnd: true,
    });
  }

  if (isExpireLemonEvent(eventName)) {
    const result = await downgradeAccountToFreeFromLemon({
      accountId: account.id,
      planSource: account.planSource,
      payload,
      planTier,
    });
    return NextResponse.json({
      ok: true,
      action: result.skipped ? "expire_skipped_admin" : "expired_downgrade",
      event: eventName,
      accountId: account.id,
      plan: result.plan ?? account.plan,
      skipped: result.skipped,
    });
  }

  if (isPastDueLemonEvent(eventName)) {
    await markLemonSubscriptionPastDue({
      accountId: account.id,
      payload,
      planTier,
    });
    return NextResponse.json({
      ok: true,
      action: "past_due",
      event: eventName,
      accountId: account.id,
      plan: account.plan,
    });
  }

  if (isResumeLemonEvent(eventName)) {
    const result = await markLemonSubscriptionResumed({
      accountId: account.id,
      payload,
      planTier,
    });
    return NextResponse.json({
      ok: true,
      action: "resumed",
      event: eventName,
      accountId: account.id,
      plan: result.plan,
    });
  }

  if (isUpdateLemonEvent(eventName)) {
    const result = await syncLemonSubscriptionUpdated({
      accountId: account.id,
      planSource: account.planSource,
      payload,
      planTier,
    });
    return NextResponse.json({
      ok: true,
      action: "subscription_updated",
      event: eventName,
      accountId: account.id,
      plan: result.plan ?? account.plan,
      skipped: "skipped" in result ? result.skipped : null,
    });
  }

  return NextResponse.json({ ok: true, ignored: eventName ?? "unknown" });
}
