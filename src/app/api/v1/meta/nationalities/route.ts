import { NextResponse } from "next/server";
import { requireApiKey, withQuotaHeaders } from "@/lib/auth";
import { limits } from "@/lib/limits";
import {
  audienceCodesFromValue,
  NATIONALITY_GROUPS,
  NATIONALITY_OPTIONS,
} from "@/lib/nationalities";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireApiKey(request);
  if (denied) return denied;

  const freshnessHours = Math.max(1, limits.nationalityMaxAgeHours);
  const freshArticles = await prisma.article.findMany({
    where: {
      publishedAt: { gte: new Date(Date.now() - freshnessHours * 60 * 60 * 1000) },
      NOT: { audienceCodes: "" },
    },
    select: { audienceCodes: true },
  });
  const counts = new Map<string, number>();
  for (const article of freshArticles) {
    for (const code of audienceCodesFromValue(article.audienceCodes)) {
      counts.set(code, (counts.get(code) ?? 0) + 1);
    }
  }

  return withQuotaHeaders(request, NextResponse.json({
    freshnessHours,
    ranking: false,
    note: "Audience options for community briefings; this is not a demographic ranking.",
    items: NATIONALITY_OPTIONS.map((option) => ({
      code: option.code,
      slug: option.slug,
      country: option.country,
      nationality: option.nationality,
      flag: option.flag,
      freshArticleCount: counts.get(option.code) ?? 0,
    })),
    groups: NATIONALITY_GROUPS.map((group) => ({
      ...group,
      freshArticleCount: group.countryCodes.reduce(
        (total, code) => total + (counts.get(code) ?? 0),
        0,
      ),
    })),
  }));
}
