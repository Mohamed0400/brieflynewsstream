import { NextResponse } from "next/server";
import { requireApiKey, withQuotaHeaders } from "@/lib/auth";
import { limits } from "@/lib/limits";
import { prisma } from "@/lib/prisma";
import { countryDisplayName, countryFlag, supportedCountryCodes } from "@/lib/supported-countries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireApiKey(request);
  if (denied) return denied;
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
}
