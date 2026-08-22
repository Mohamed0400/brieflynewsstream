import { NextResponse } from "next/server";
import { markInvoicePaidFromProvider } from "@/lib/billing/invoices";
import {
  extractInvoiceIdFromWebhook,
  isPaidLemonEvent,
  LEMONSQUEEZY_PROVIDER,
  type LemonWebhookPayload,
  verifyLemonSqueezySignature,
} from "@/lib/billing/lemonsqueezy";

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
  if (!isPaidLemonEvent(eventName)) {
    return NextResponse.json({ ok: true, ignored: eventName ?? "unknown" });
  }

  const invoiceId = extractInvoiceIdFromWebhook(payload);
  if (!invoiceId) {
    return NextResponse.json(
      { error: "missing_invoice_id", message: "custom_data.invoice_id required" },
      { status: 422 },
    );
  }

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
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  return NextResponse.json({
    ok: true,
    invoiceId: result.invoice?.id,
    status: result.invoice?.status,
  });
}
