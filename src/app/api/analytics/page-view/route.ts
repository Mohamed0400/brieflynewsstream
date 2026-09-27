import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** First-party page-view writes are off. Vercel Web Analytics covers traffic without a database write per visit. */
export async function POST() {
  return NextResponse.json({ ok: true, skipped: true, reason: "disabled" });
}
