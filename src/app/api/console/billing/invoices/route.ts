import { NextResponse } from "next/server";
import { requireAccount } from "@/lib/account";
import { isTrustedConsoleOrigin } from "@/lib/console-auth";
import {
  listAccountInvoices,
  requestProInvoice,
  serializeInvoice,
} from "@/lib/billing/invoices";

export async function GET(request: Request) {
  if (!isTrustedConsoleOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }
  const auth = await requireAccount();
  if ("response" in auth) return auth.response;
  const invoices = await listAccountInvoices(auth.account.id);
  return NextResponse.json({ items: invoices.map(serializeInvoice) });
}

export async function POST(request: Request) {
  if (!isTrustedConsoleOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }
  const auth = await requireAccount();
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => ({})) as { plan?: string };
  if (body.plan && body.plan !== "PRO") {
    return NextResponse.json(
      { error: "invalid_plan", message: "Request Pro from billing. Enterprise is arranged with us." },
      { status: 400 },
    );
  }

  const invoice = await requestProInvoice(auth.account.id);
  return NextResponse.json({ item: serializeInvoice(invoice) }, { status: 201 });
}
