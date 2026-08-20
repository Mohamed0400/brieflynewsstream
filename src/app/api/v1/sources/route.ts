import { NextResponse } from "next/server";
import { requireApiKey, withQuotaHeaders } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { categoryToCode, regionToCode } from "@/lib/market";
import { limits } from "@/lib/limits";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireApiKey(request);
  if (denied) return denied;
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
      name: source.name,
      homepageUrl: source.homepageUrl,
      adapter: source.adapter,
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
      lastError: source.lastError,
    })),
  }));
}
