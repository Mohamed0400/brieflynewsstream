import { NextResponse } from "next/server";
import { requireApiKey, withQuotaHeaders } from "@/lib/auth";
import { describeQueryFailure } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { countryDisplayName, countryFlag, supportedCountryCodes } from "@/lib/supported-countries";
import { limits } from "@/lib/limits";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireApiKey(request);
  if (denied) return denied;
  try {
    const freshnessHours = Math.max(1, limits.newsMaxAgeHours);
    const [liveRows, sourceRows] = await Promise.all([
      prisma.article.findMany({
        where: {
          publishedAt: {
            gte: new Date(Date.now() - freshnessHours * 60 * 60 * 1000),
          },
        },
        distinct: ["country"],
        select: { country: true },
      }),
      prisma.source.findMany({
        where: { enabled: true },
        distinct: ["country"],
        select: { country: true },
      }),
    ]);
    const inFeed = new Set(liveRows.map((row) => row.country));
    const items = supportedCountryCodes([
      ...sourceRows.map((row) => row.country),
      ...liveRows.map((row) => row.country),
    ]).map((code) => ({
      code,
      name: countryDisplayName(code, "en"),
      nameAr: countryDisplayName(code, "ar"),
      flag: countryFlag(code),
      inFeed: inFeed.has(code),
    }));
    return withQuotaHeaders(request, NextResponse.json({
      freshnessHours,
      inFeedCount: items.filter((item) => item.inFeed).length,
      supportedCount: items.length,
      items,
    }));
  } catch (error) {
    const failure = describeQueryFailure(error);
    return withQuotaHeaders(request, NextResponse.json(
      { error: failure.error, message: failure.message },
      { status: failure.status },
    ));
  }
}
