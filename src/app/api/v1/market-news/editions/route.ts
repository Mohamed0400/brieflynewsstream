import { NextResponse } from "next/server";
import { requireApiKey, withQuotaHeaders } from "@/lib/auth";
import { listDailyEditions } from "@/lib/editions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireApiKey(request);
  if (denied) return denied;

  const limit = Number(new URL(request.url).searchParams.get("limit") || 30);
  return withQuotaHeaders(request, NextResponse.json(await listDailyEditions(limit)));
}
