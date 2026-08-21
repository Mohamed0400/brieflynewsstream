import { NextResponse } from "next/server";
import { requireApiKey, withQuotaHeaders } from "@/lib/auth";
import { describeQueryFailure } from "@/lib/api";
import { getDailyEditionPayload } from "@/lib/editions";
import { kuwaitDate } from "@/lib/market";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireApiKey(request);
  if (denied) return denied;

  try {
    const date = kuwaitDate();
    const payload = await getDailyEditionPayload(date, new URL(request.url).searchParams);
    if (!payload) {
      return withQuotaHeaders(request, NextResponse.json(
        { error: "edition_not_ready", date, message: "Today's edition has not been published yet. Run Collect or Publish from the console Schedule page." },
        { status: 404 },
      ));
    }
    return withQuotaHeaders(request, NextResponse.json(payload));
  } catch (error) {
    const failure = describeQueryFailure(error);
    return withQuotaHeaders(request, NextResponse.json(
      { error: failure.error, message: failure.message },
      { status: failure.status },
    ));
  }
}
