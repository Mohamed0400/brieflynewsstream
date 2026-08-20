import { NextResponse } from "next/server";
import { requireAdminKey } from "@/lib/auth";
import { buildDailyEdition } from "@/lib/pipeline";
import { kuwaitDate } from "@/lib/market";

export async function POST(request: Request) {
  const denied = requireAdminKey(request);
  if (denied) return denied;

  const body = await request.json().catch(() => ({})) as { date?: string; force?: boolean };
  const date = body.date || kuwaitDate();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "invalid_query", message: "date must be YYYY-MM-DD" },
      { status: 400 },
    );
  }

  const itemCount = await buildDailyEdition(date, { force: body.force !== false });
  return NextResponse.json({ ok: true, date, itemCount, force: body.force !== false });
}
