import { NextResponse } from "next/server";
import { requireApiKey, withQuotaHeaders } from "@/lib/auth";
import { describeQueryFailure } from "@/lib/api";
import { listDailyEditions } from "@/lib/editions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireApiKey(request);
  if (denied) return denied;

  try {
    const limit = Number(new URL(request.url).searchParams.get("limit") || 30);
    return withQuotaHeaders(request, NextResponse.json(await listDailyEditions(limit)));
  } catch (error) {
    const failure = describeQueryFailure(error);
    return withQuotaHeaders(request, NextResponse.json(
      { error: failure.error, message: failure.message },
      { status: failure.status },
    ));
  }
}
