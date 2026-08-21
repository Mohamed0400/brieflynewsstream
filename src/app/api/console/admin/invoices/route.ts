import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/account";
import { applyInvoiceAdminAction } from "@/lib/billing/invoices";
import { isTrustedConsoleOrigin } from "@/lib/console-auth";

export async function PATCH(request: Request) {
  if (!isTrustedConsoleOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }
  const auth = await requireSuperAdmin();
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => ({})) as {
    invoiceId?: string;
    action?: "pay" | "void";
    voidReason?: string;
  };

  if (!body.invoiceId || (body.action !== "pay" && body.action !== "void")) {
    return NextResponse.json(
      { error: "invalid_request", message: "Provide invoiceId and action pay or void." },
      { status: 400 },
    );
  }

  try {
    const updated = await applyInvoiceAdminAction({
      invoiceId: body.invoiceId,
      action: body.action,
      actorId: auth.account.id,
      voidReason: body.voidReason,
    });
    if (!updated) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({
      item: {
        id: updated.id,
        number: updated.number,
        status: updated.status,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "invoice_not_open";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
