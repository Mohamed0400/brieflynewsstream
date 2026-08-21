import { NextResponse } from "next/server";
import { buildReceiptPdf, EXAMPLE_RECEIPT } from "@/lib/billing/receipt-pdf";

export const dynamic = "force-static";

export function GET() {
  const pdf = buildReceiptPdf(EXAMPLE_RECEIPT);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="briefly-newsstream-receipt.pdf"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
