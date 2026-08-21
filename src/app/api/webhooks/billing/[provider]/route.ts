import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "not_configured",
      message: "Billing webhooks will activate when a payment provider is connected.",
    },
    { status: 501 },
  );
}
