import { NextResponse } from "next/server";
import { requireApiKey, withQuotaHeaders } from "@/lib/auth";
import { getDailyEditionPayload } from "@/lib/editions";
import { kuwaitDate } from "@/lib/market";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireApiKey(request);
  if (denied) return denied;

  try {
    const url = new URL(request.url);
    const date = url.searchParams.get("date") || kuwaitDate();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return withQuotaHeaders(request, NextResponse.json(
        { error: "invalid_query", message: "date must be YYYY-MM-DD" },
        { status: 400 },
      ));
    }

    const articleFilters = new URLSearchParams(url.searchParams);
    articleFilters.delete("date");
    const payload = await getDailyEditionPayload(date, articleFilters);
    if (!payload) {
      return withQuotaHeaders(request, NextResponse.json(
        {
          error: "edition_not_ready",
          date,
          message: "No stored daily edition for this date yet.",
        },
        { status: 404 },
      ));
    }
    return withQuotaHeaders(request, NextResponse.json(payload));
  } catch (error) {
    return withQuotaHeaders(request, NextResponse.json(
      { error: "invalid_query", message: error instanceof Error ? error.message : String(error) },
      { status: 400 },
    ));
  }
}
