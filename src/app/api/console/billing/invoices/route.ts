import { NextResponse } from "next/server";
import { requireAccount } from "@/lib/account";
import { isTrustedConsoleOrigin } from "@/lib/console-auth";
import {
  listAccountInvoices,
  requestPlanInvoice,
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
  const plan = body.plan === "ENTERPRISE" ? "ENTERPRISE" : body.plan === "PRO" ? "PRO" : null;
  if (!plan) {
    return NextResponse.json(
      { error: "invalid_plan", message: "Request Pro or Enterprise from billing." },
      { status: 400 },
    );
  }

  const invoice = await requestPlanInvoice(auth.account.id, plan);
  return NextResponse.json({ item: serializeInvoice(invoice) }, { status: 201 });
}
