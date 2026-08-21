import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireApiKey, withQuotaHeaders } from "@/lib/auth";
import { describeQueryFailure } from "@/lib/api";
import { limits } from "@/lib/limits";
import {
  NATIONALITY_GROUPS,
  NATIONALITY_OPTIONS,
} from "@/lib/nationalities";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireApiKey(request);
  if (denied) return denied;

  try {
    const freshnessHours = Math.max(1, limits.nationalityMaxAgeHours);
    const cutoff = new Date(Date.now() - freshnessHours * 60 * 60 * 1000);
    const rows = await prisma.$queryRaw<Array<{ code: string; count: number }>>(Prisma.sql`
      SELECT code, COUNT(*)::int AS count
      FROM (
        SELECT unnest(string_to_array(trim(both '|' from "audienceCodes"), '|')) AS code
        FROM "Article"
        WHERE "publishedAt" >= ${cutoff}
          AND "audienceCodes" <> ''
      ) parts
      WHERE code ~ '^[A-Z]{2}$'
      GROUP BY code
    `);
    const counts = new Map(rows.map((row) => [row.code, Number(row.count)]));

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
  } catch (error) {
    const failure = describeQueryFailure(error);
    return withQuotaHeaders(request, NextResponse.json(
      { error: failure.error, message: failure.message },
      { status: failure.status },
    ));
  }
}
