import { NextResponse } from "next/server";
import { requireAccount } from "@/lib/account";
import { getAccountInvoice } from "@/lib/billing/invoices";
import { buildReceiptPdf } from "@/lib/billing/receipt-pdf";
import { canDownloadReceipt } from "@/lib/billing/types";
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
  if (!invoice) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!canDownloadReceipt(invoice.status)) {
    return NextResponse.json(
      { error: "receipt_unavailable", message: "A PDF receipt is available after the invoice is paid." },
      { status: 409 },
    );
  }

  const pdf = buildReceiptPdf({
    number: invoice.number,
    status: invoice.status,
    description: invoice.description,
    issuedAt: invoice.issuedAt,
    paidAt: invoice.paidAt,
    dueAt: invoice.dueAt,
    totalCents: invoice.totalCents,
    amountPaidCents: invoice.amountPaidCents,
    example: invoice.example,
  });

      return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
