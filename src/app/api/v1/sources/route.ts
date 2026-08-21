import { NextResponse } from "next/server";
import { requireApiKey, withQuotaHeaders } from "@/lib/auth";
import { describeQueryFailure } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { categoryToCode, regionToCode } from "@/lib/market";
import { limits } from "@/lib/limits";
import { publicErrorMessage } from "@/lib/public-error";
import { publicHomepageUrl, publicSourceName } from "@/lib/public-source";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireApiKey(request);
  if (denied) return denied;
  try {
    const healthHours = Math.max(1, limits.sourceHealthMaxAgeHours);
    const healthCutoff = new Date(new Date().getTime() - healthHours * 60 * 60 * 1000);
    const sources = await prisma.source.findMany({
      where: { enabled: true },
      orderBy: { qualityWeight: "desc" },
    });
    return withQuotaHeaders(request, NextResponse.json({
      count: sources.length,
      healthHours,
      items: sources.map((source) => ({
        code: source.code,
        name: publicSourceName(source.name),
        homepageUrl: publicHomepageUrl(source.homepageUrl),
        country: source.country,
        region: regionToCode(source.region),
        defaultCategory: source.defaultCategory ? categoryToCode(source.defaultCategory) : null,
        qualityWeight: source.qualityWeight,
        enabled: source.enabled,
        lastFetchedAt: source.lastFetchedAt?.toISOString() ?? null,
        status: source.lastError
          ? "error"
          : !source.lastFetchedAt
            ? "pending"
            : source.lastFetchedAt < healthCutoff
              ? "stale"
              : "healthy",
        lastError: source.lastError
          ? publicErrorMessage(source.lastError, "Source fetch failed.")
          : null,
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
