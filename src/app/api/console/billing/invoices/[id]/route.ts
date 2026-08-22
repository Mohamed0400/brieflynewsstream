import { NextResponse } from "next/server";
import { requireAccount } from "@/lib/account";
import {
  getAccountInvoice,
  payCustomerInvoice,
  serializeInvoice,
} from "@/lib/billing/invoices";
import { isTrustedConsoleOrigin } from "@/lib/console-auth";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isTrustedConsoleOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }
  const auth = await requireAccount();
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  const invoice = await getAccountInvoice(auth.account.id, id);
  if (!invoice || invoice.example) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ item: serializeInvoice(invoice) });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isTrustedConsoleOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }
  const auth = await requireAccount();
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { action?: string };

  if (body.action === "cancel") {
    const invoice = await getAccountInvoice(auth.account.id, id);
    if (!invoice || invoice.example) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({
      item: serializeInvoice(invoice),
      keptOpen: true,
    });
  }

  if (body.action !== "pay") {
    return NextResponse.json(
      { error: "invalid_request", message: "Use action pay or cancel." },
      { status: 400 },
    );
  }

  const result = await payCustomerInvoice(auth.account.id, id);
  if ("error" in result) {
    if (result.error === "billing_not_live") {
      return NextResponse.json(
        {
          error: "billing_not_live",
          message:
            "Card payments are not live. Open the Pro order and we confirm the upgrade.",
        },
        { status: 409 },
      );
    }
    if (result.error === "checkout_failed") {
      return NextResponse.json(
        {
          error: "checkout_failed",
          message: ("message" in result && result.message) || "Could not start Lemon Squeezy checkout.",
        },
        { status: 502 },
      );
    }
    const status = result.error === "not_found" ? 404 : 409;
    return NextResponse.json(
      {
        error: result.error,
        message: "message" in result ? result.message : undefined,
      },
      { status },
    );
  }

  return NextResponse.json({
    item: serializeInvoice(result.invoice),
    plan: result.invoice.planTier,
    checkoutUrl: "checkoutUrl" in result ? result.checkoutUrl : undefined,
  });
}
